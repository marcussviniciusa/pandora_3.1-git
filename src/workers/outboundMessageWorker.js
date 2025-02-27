const axios = require('axios');
const db = require('../config/database');
const { redisUtils } = require('../config/redis');
const whatsappMessageService = require('../services/whatsappMessageService');
require('dotenv').config();

// Worker para processar mensagens de saída
class OutboundMessageWorker {
  constructor() {
    this.queueName = 'queue:messages:outbound';
    this.isRunning = false;
    this.processInterval = 1000; // 1 segundo
    this.maxRetries = 3;
  }
  
  // Iniciar o worker
  async start() {
    if (this.isRunning) return;
    
    console.log('Iniciando worker de processamento de mensagens de saída...');
    this.isRunning = true;
    
    // Processar mensagens em loop
    this.processLoop();
  }
  
  // Parar o worker
  stop() {
    console.log('Parando worker de processamento de mensagens de saída...');
    this.isRunning = false;
  }
  
  // Loop de processamento
  async processLoop() {
    while (this.isRunning) {
      try {
        // Obter mensagem da fila
        const message = await redisUtils.getFromQueue(this.queueName);
        
        if (message) {
          console.log(`Processando mensagem de saída: ${message.messageId}`);
          await this.processMessage(message);
        }
        
        // Aguardar intervalo
        await new Promise(resolve => setTimeout(resolve, this.processInterval));
      } catch (error) {
        console.error('Erro no processamento de mensagens de saída:', error);
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  // Processar uma mensagem
  async processMessage(message) {
    try {
      // Atualizar status da mensagem
      await db.query(
        'UPDATE messages SET status = $1 WHERE id = $2',
        ['sending', message.messageId]
      );
      
      // Enviar mensagem de acordo com o tipo de canal
      let result;
      
      switch (message.channelType) {
        case 'whatsapp':
          result = await this.sendWhatsAppMessage(message);
          break;
        case 'instagram':
          result = await this.sendInstagramMessage(message);
          break;
        default:
          throw new Error(`Tipo de canal não suportado: ${message.channelType}`);
      }
      
      if (result.success) {
        // Atualizar status da mensagem
        await db.query(
          'UPDATE messages SET status = $1, external_id = $2, metadata = jsonb_set(metadata, $3, $4) WHERE id = $5',
          ['sent', result.externalId || null, '{sent_at}', JSON.stringify(new Date().toISOString()), message.messageId]
        );
        
        // Publicar evento de mensagem enviada
        await redisUtils.publish('channel:notifications', {
          type: 'message_sent',
          messageId: message.messageId,
          conversationId: message.conversationId
        });
        
        // Notificar webhooks
        await this.notifyWebhooks(message, 'message.sent');
      } else {
        throw new Error(result.error || 'Erro desconhecido ao enviar mensagem');
      }
    } catch (error) {
      console.error(`Erro ao processar mensagem ${message.messageId}:`, error);
      
      // Verificar se deve tentar novamente
      const retryCount = await this.getRetryCount(message.messageId);
      
      if (retryCount < this.maxRetries) {
        // Incrementar contador de tentativas
        await this.incrementRetryCount(message.messageId);
        
        // Adicionar mensagem de volta à fila
        await redisUtils.addToQueue(this.queueName, message);
        
        console.log(`Mensagem ${message.messageId} adicionada de volta à fila. Tentativa ${retryCount + 1} de ${this.maxRetries}`);
      } else {
        // Atualizar status da mensagem para erro
        await db.query(
          'UPDATE messages SET status = $1, metadata = jsonb_set(metadata, $2, $3) WHERE id = $4',
          ['failed', '{error}', JSON.stringify(error.message || 'Erro desconhecido'), message.messageId]
        );
        
        // Publicar evento de falha
        await redisUtils.publish('channel:notifications', {
          type: 'message_failed',
          messageId: message.messageId,
          conversationId: message.conversationId,
          error: error.message
        });
        
        // Notificar webhooks
        await this.notifyWebhooks(message, 'message.failed');
      }
    }
  }
  
  // Enviar mensagem pelo WhatsApp
  async sendWhatsAppMessage(message) {
    try {
      // Usar o serviço de mensagens WhatsApp
      return await whatsappMessageService.sendMessage(message);
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Enviar mensagem pelo Instagram
  async sendInstagramMessage(message) {
    try {
      // Em uma implementação real, aqui seria utilizada a API do Instagram
      // Para fins de demonstração, simularemos o envio
      
      // Simular envio
      console.log(`Simulando envio de mensagem Instagram para ${message.contactId}: ${message.content}`);
      
      // Simular atraso de rede
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Gerar ID externo fictício
      const externalId = `instagram_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      return {
        success: true,
        externalId
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem Instagram:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Obter contador de tentativas
  async getRetryCount(messageId) {
    const key = `retry:message:${messageId}`;
    const count = await redisClient.get(key);
    return count ? parseInt(count) : 0;
  }
  
  // Incrementar contador de tentativas
  async incrementRetryCount(messageId) {
    const key = `retry:message:${messageId}`;
    await redisClient.incr(key);
    // Definir TTL de 1 hora
    await redisClient.expire(key, 60 * 60);
  }
  
  // Notificar webhooks
  async notifyWebhooks(message, event) {
    try {
      // Obter webhooks para notificação
      const webhookResult = await db.query(`
        SELECT w.* 
        FROM webhooks w
        JOIN channels c ON w.user_id = c.user_id
        WHERE c.id = $1 AND w.is_active = true AND w.events @> $2
      `, [message.channelId, JSON.stringify([event])]);
      
      // Notificar cada webhook
      for (const webhook of webhookResult.rows) {
        try {
          const headers = webhook.headers || {};
          
          // Preparar payload
          const payload = {
            event,
            timestamp: new Date().toISOString(),
            data: {
              messageId: message.messageId,
              conversationId: message.conversationId,
              channelId: message.channelId,
              channelType: message.channelType,
              contactId: message.contactId,
              content: message.content,
              mediaUrl: message.mediaUrl,
              mediaType: message.mediaType,
              timestamp: message.timestamp
            }
          };
          
          // Enviar requisição para o webhook
          const response = await axios.post(webhook.url, payload, { headers });
          
          console.log(`Webhook ${webhook.id} notificado com sucesso:`, response.status);
        } catch (webhookError) {
          console.error(`Erro ao notificar webhook ${webhook.id}:`, webhookError);
        }
      }
    } catch (error) {
      console.error('Erro ao notificar webhooks:', error);
    }
  }
}

// Criar e exportar instância do worker
const outboundMessageWorker = new OutboundMessageWorker();

module.exports = outboundMessageWorker;

// Se este arquivo for executado diretamente, iniciar o worker
if (require.main === module) {
  outboundMessageWorker.start()
    .catch(error => {
      console.error('Erro ao iniciar worker:', error);
      process.exit(1);
    });
}
