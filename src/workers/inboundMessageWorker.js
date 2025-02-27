const axios = require('axios');
const db = require('../config/database');
const { redisUtils } = require('../config/redis');
require('dotenv').config();

// Worker para processar mensagens recebidas
class InboundMessageWorker {
  constructor() {
    this.queueName = 'queue:messages:processing';
    this.isRunning = false;
    this.processInterval = 1000; // 1 segundo
  }
  
  // Iniciar o worker
  async start() {
    if (this.isRunning) return;
    
    console.log('Iniciando worker de processamento de mensagens recebidas...');
    this.isRunning = true;
    
    // Processar mensagens em loop
    this.processLoop();
  }
  
  // Parar o worker
  stop() {
    console.log('Parando worker de processamento de mensagens recebidas...');
    this.isRunning = false;
  }
  
  // Loop de processamento
  async processLoop() {
    while (this.isRunning) {
      try {
        // Obter mensagem da fila
        const message = await redisUtils.getFromQueue(this.queueName);
        
        if (message) {
          console.log(`Processando mensagem recebida: ${message.messageId}`);
          await this.processMessage(message);
        }
        
        // Aguardar intervalo
        await new Promise(resolve => setTimeout(resolve, this.processInterval));
      } catch (error) {
        console.error('Erro no processamento de mensagens recebidas:', error);
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
        ['processing', message.messageId]
      );
      
      // Obter webhooks para notificação
      const webhookResult = await db.query(`
        SELECT w.* 
        FROM webhooks w
        JOIN channels c ON w.user_id = c.user_id
        WHERE c.id = $1 AND w.is_active = true AND w.events @> $2
      `, [message.channelId, JSON.stringify(['message.received'])]);
      
      // Notificar webhooks
      for (const webhook of webhookResult.rows) {
        try {
          await this.notifyWebhook(webhook, message);
        } catch (webhookError) {
          console.error(`Erro ao notificar webhook ${webhook.id}:`, webhookError);
        }
      }
      
      // Atualizar status da mensagem
      await db.query(
        'UPDATE messages SET status = $1 WHERE id = $2',
        ['processed', message.messageId]
      );
      
      // Publicar evento de mensagem processada
      await redisUtils.publish('channel:notifications', {
        type: 'message_processed',
        messageId: message.messageId,
        conversationId: message.conversationId
      });
      
    } catch (error) {
      console.error(`Erro ao processar mensagem ${message.messageId}:`, error);
      
      // Atualizar status da mensagem para erro
      await db.query(
        'UPDATE messages SET status = $1, metadata = jsonb_set(metadata, $2, $3) WHERE id = $4',
        ['error', '{error}', JSON.stringify(error.message || 'Erro desconhecido'), message.messageId]
      );
    }
  }
  
  // Notificar um webhook
  async notifyWebhook(webhook, message) {
    try {
      const headers = webhook.headers || {};
      
      // Preparar payload
      const payload = {
        event: 'message.received',
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
      
      return true;
    } catch (error) {
      console.error(`Erro ao notificar webhook ${webhook.id}:`, error.message);
      throw error;
    }
  }
}

// Criar e exportar instância do worker
const inboundMessageWorker = new InboundMessageWorker();

module.exports = inboundMessageWorker;

// Se este arquivo for executado diretamente, iniciar o worker
if (require.main === module) {
  inboundMessageWorker.start()
    .catch(error => {
      console.error('Erro ao iniciar worker:', error);
      process.exit(1);
    });
}
