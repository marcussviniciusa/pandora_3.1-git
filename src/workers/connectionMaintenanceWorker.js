const db = require('../config/database');
const { redisUtils } = require('../config/redis');
const { Client } = require('whatsapp-web.js');
require('dotenv').config();

// Worker para manutenção de conexões
class ConnectionMaintenanceWorker {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 60000; // 1 minuto
    this.activeConnections = new Map(); // Mapa de conexões ativas
  }
  
  // Iniciar o worker
  async start() {
    if (this.isRunning) return;
    
    console.log('Iniciando worker de manutenção de conexões...');
    this.isRunning = true;
    
    // Processar conexões em loop
    this.processLoop();
  }
  
  // Parar o worker
  async stop() {
    console.log('Parando worker de manutenção de conexões...');
    this.isRunning = false;
    
    // Desconectar todas as conexões ativas
    for (const [channelId, connection] of this.activeConnections.entries()) {
      try {
        if (connection.client) {
          await connection.client.destroy();
        }
        this.activeConnections.delete(channelId);
      } catch (error) {
        console.error(`Erro ao desconectar canal ${channelId}:`, error);
      }
    }
  }
  
  // Loop de processamento
  async processLoop() {
    while (this.isRunning) {
      try {
        // Verificar canais que precisam ser reconectados
        await this.checkChannels();
        
        // Aguardar intervalo
        await new Promise(resolve => setTimeout(resolve, this.checkInterval));
      } catch (error) {
        console.error('Erro na manutenção de conexões:', error);
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }
  
  // Verificar canais
  async checkChannels() {
    try {
      // Obter canais conectados
      const result = await db.query(`
        SELECT c.*, cc.credentials, cc.settings
        FROM channels c
        JOIN channel_connections cc ON c.id = cc.channel_id
        WHERE c.status = 'connected'
      `);
      
      for (const channel of result.rows) {
        // Verificar se o canal já está na lista de conexões ativas
        if (!this.activeConnections.has(channel.id)) {
          // Verificar se o cliente está pronto no Redis
          const clientStatus = await redisUtils.getCache(`${channel.type}:client:${channel.id}`);
          
          if (clientStatus !== 'ready') {
            // Tentar reconectar
            await this.reconnectChannel(channel);
          }
        }
      }
      
      // Verificar conexões ativas que não estão mais no banco de dados
      for (const [channelId, connection] of this.activeConnections.entries()) {
        const channelExists = result.rows.some(channel => channel.id === channelId);
        
        if (!channelExists) {
          // Remover conexão
          if (connection.client) {
            await connection.client.destroy();
          }
          this.activeConnections.delete(channelId);
          console.log(`Conexão removida para canal ${channelId}`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar canais:', error);
    }
  }
  
  // Reconectar um canal
  async reconnectChannel(channel) {
    try {
      console.log(`Tentando reconectar canal ${channel.id} (${channel.type})`);
      
      switch (channel.type) {
        case 'whatsapp':
          await this.reconnectWhatsApp(channel);
          break;
        case 'instagram':
          await this.reconnectInstagram(channel);
          break;
        default:
          console.log(`Tipo de canal não suportado para reconexão: ${channel.type}`);
      }
    } catch (error) {
      console.error(`Erro ao reconectar canal ${channel.id}:`, error);
      
      // Atualizar status do canal
      await db.query(
        'UPDATE channels SET status = $1 WHERE id = $2',
        ['disconnected', channel.id]
      );
      
      // Publicar evento de desconexão
      await redisUtils.publish(`channel:${channel.type}:events`, {
        type: 'disconnected',
        channelId: channel.id,
        userId: channel.user_id,
        error: error.message
      });
    }
  }
  
  // Reconectar WhatsApp
  async reconnectWhatsApp(channel) {
    try {
      // Verificar se há credenciais salvas
      if (!channel.credentials || Object.keys(channel.credentials).length === 0) {
        console.log(`Sem credenciais para reconectar WhatsApp no canal ${channel.id}`);
        return;
      }
      
      // Criar cliente WhatsApp
      const client = new Client({
        session: channel.credentials,
        puppeteer: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });
      
      // Configurar eventos
      client.on('authenticated', async (session) => {
        try {
          // Atualizar credenciais
          await db.query(
            'UPDATE channel_connections SET credentials = $1, last_connected = NOW() WHERE channel_id = $2',
            [JSON.stringify(session), channel.id]
          );
          
          console.log(`Cliente WhatsApp autenticado para canal ${channel.id}`);
        } catch (error) {
          console.error(`Erro ao atualizar credenciais para canal ${channel.id}:`, error);
        }
      });
      
      client.on('ready', async () => {
        try {
          console.log(`Cliente WhatsApp pronto para canal ${channel.id}`);
          
          // Atualizar status do canal
          await db.query(
            'UPDATE channels SET status = $1 WHERE id = $2',
            ['connected', channel.id]
          );
          
          // Armazenar cliente no Redis
          await redisUtils.setCache(`whatsapp:client:${channel.id}`, 'ready', 60 * 60 * 24); // 24 horas
          
          // Publicar evento de conexão
          await redisUtils.publish('channel:whatsapp:events', {
            type: 'connected',
            channelId: channel.id,
            userId: channel.user_id
          });
          
          // Adicionar à lista de conexões ativas
          this.activeConnections.set(channel.id, { client, type: 'whatsapp' });
        } catch (error) {
          console.error(`Erro ao processar evento ready para canal ${channel.id}:`, error);
        }
      });
      
      client.on('disconnected', async (reason) => {
        try {
          console.log(`Cliente WhatsApp desconectado para canal ${channel.id}: ${reason}`);
          
          // Atualizar status do canal
          await db.query(
            'UPDATE channels SET status = $1 WHERE id = $2',
            ['disconnected', channel.id]
          );
          
          // Remover do Redis
          await redisUtils.deleteCache(`whatsapp:client:${channel.id}`);
          
          // Publicar evento de desconexão
          await redisUtils.publish('channel:whatsapp:events', {
            type: 'disconnected',
            channelId: channel.id,
            userId: channel.user_id,
            reason
          });
          
          // Remover da lista de conexões ativas
          this.activeConnections.delete(channel.id);
        } catch (error) {
          console.error(`Erro ao processar desconexão para canal ${channel.id}:`, error);
        }
      });
      
      // Inicializar cliente
      await client.initialize();
      
    } catch (error) {
      console.error(`Erro ao reconectar WhatsApp para canal ${channel.id}:`, error);
      throw error;
    }
  }
  
  // Reconectar Instagram
  async reconnectInstagram(channel) {
    try {
      // Em uma implementação real, aqui seria utilizada a API do Instagram
      // Para fins de demonstração, simularemos a reconexão
      
      console.log(`Simulando reconexão de Instagram para canal ${channel.id}`);
      
      // Simular atraso de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar status do canal
      await db.query(
        'UPDATE channels SET status = $1 WHERE id = $2',
        ['connected', channel.id]
      );
      
      // Armazenar status no Redis
      await redisUtils.setCache(`instagram:client:${channel.id}`, 'ready', 60 * 60 * 24); // 24 horas
      
      // Publicar evento de conexão
      await redisUtils.publish('channel:instagram:events', {
        type: 'connected',
        channelId: channel.id,
        userId: channel.user_id
      });
      
      // Adicionar à lista de conexões ativas
      this.activeConnections.set(channel.id, { type: 'instagram' });
      
      console.log(`Canal Instagram ${channel.id} reconectado com sucesso`);
    } catch (error) {
      console.error(`Erro ao reconectar Instagram para canal ${channel.id}:`, error);
      throw error;
    }
  }
}

// Criar e exportar instância do worker
const connectionMaintenanceWorker = new ConnectionMaintenanceWorker();

module.exports = connectionMaintenanceWorker;

// Se este arquivo for executado diretamente, iniciar o worker
if (require.main === module) {
  connectionMaintenanceWorker.start()
    .catch(error => {
      console.error('Erro ao iniciar worker:', error);
      process.exit(1);
    });
}
