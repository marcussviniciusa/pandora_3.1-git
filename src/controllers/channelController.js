const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const whatsappClientManager = require('../services/whatsappClientManager');

// Função utilitária para validar UUID
const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Função utilitária para registrar eventos de canal
const registerChannelEvent = async (channelId, eventType, eventData = {}) => {
  try {
    await db.query(
      `INSERT INTO channel_events (id, channel_id, type, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [uuidv4(), channelId, eventType, JSON.stringify(eventData)]
    );
    console.log(`Evento ${eventType} registrado para o canal ${channelId}`);
  } catch (error) {
    console.error('Erro ao registrar evento do canal:', error);
  }
};

// Listar canais do usuário
const listChannels = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM channels WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.status(200).json({
      error: false,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar canais:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Obter detalhes de um canal
const getChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    const result = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    // Obter dados de conexão
    const connectionResult = await db.query(
      'SELECT * FROM channel_connections WHERE channel_id = $1',
      [id]
    );
    
    const channel = result.rows[0];
    channel.connection = connectionResult.rows[0] || null;
    
    res.status(200).json({
      error: false,
      data: channel
    });
  } catch (error) {
    console.error('Erro ao obter canal:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Obter detalhes completos de um canal
const getChannelDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      `SELECT c.*, cc.settings, cc.credentials, cc.last_connected
       FROM channels c
       LEFT JOIN channel_connections cc ON c.id = cc.channel_id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, userId]
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    res.status(200).json({
      error: false,
      data: channelResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter detalhes do canal:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Criar um novo canal
const createChannel = async (req, res) => {
  try {
    const { type, name } = req.body;
    const userId = req.user.id;
    
    if (!type || !name) {
      return res.status(400).json({ error: true, message: 'Tipo e nome são obrigatórios' });
    }
    
    if (!['whatsapp', 'instagram'].includes(type)) {
      return res.status(400).json({ error: true, message: 'Tipo de canal inválido' });
    }
    
    // Inserir canal
    const result = await db.query(
      'INSERT INTO channels (user_id, type, name, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, type, name, 'disconnected']
    );
    
    const channel = result.rows[0];
    
    // Criar entrada na tabela de conexões
    await db.query(
      'INSERT INTO channel_connections (channel_id, credentials, settings) VALUES ($1, $2, $3)',
      [channel.id, {}, {}]
    );
    
    res.status(201).json({
      error: false,
      message: 'Canal criado com sucesso',
      data: channel
    });
  } catch (error) {
    console.error('Erro ao criar canal:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Iniciar conexão com WhatsApp
const connectWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2 AND type = $3',
      [id, userId, 'whatsapp']
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    const channel = channelResult.rows[0];
    
    // Verificar se já existe um cliente ativo
    if (whatsappClientManager.hasClient(channel.id)) {
      console.log(`Cliente WhatsApp já existe para o canal ${channel.id}, retornando cliente existente`);
      
      // Verificar status atual do cliente
      const client = whatsappClientManager.getClient(channel.id);
      const clientInfo = client ? { state: client.getState ? await client.getState() : 'unknown' } : { state: 'unknown' };
      
      return res.status(200).json({
        error: false,
        message: 'Cliente WhatsApp já está inicializado',
        data: {
          channelId: channel.id,
          status: channel.status,
          clientInfo
        }
      });
    }
    
    // Criar cliente WhatsApp
    const client = new Client({
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      },
      authStrategy: new LocalAuth({
        clientId: channel.id
      })
    });
    
    // Gerar QR Code
    client.on('qr', async (qr) => {
      try {
        // Gerar QR Code como data URL
        const qrDataURL = await qrcode.toDataURL(qr);
        
        // Armazenar QR Code no PostgreSQL
        await db.query(
          `INSERT INTO channel_events (id, channel_id, type, metadata, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [uuidv4(), channel.id, 'qr_code', JSON.stringify({ qrDataURL })]
        );
        
        // Atualizar status do canal
        await db.query(
          'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
          ['qr_ready', channel.id]
        );
        
        // Registrar evento na tabela channel_events
        await registerChannelEvent(channel.id, 'qr_ready', {
          timestamp: new Date().toISOString()
        });
        
        console.log(`QR Code gerado para o canal ${channel.id}`);
      } catch (error) {
        console.error('Erro ao processar QR Code:', error);
      }
    });
    
    // Evento de autenticação
    client.on('authenticated', async (session) => {
      try {
        // Atualizar dados de conexão
        await db.query(
          'UPDATE channel_connections SET credentials = $1, last_connected = NOW(), updated_at = NOW() WHERE channel_id = $2',
          [JSON.stringify(session), channel.id]
        );
        
        // Atualizar status do canal
        await db.query(
          'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
          ['authenticated', channel.id]
        );
        
        // Registrar evento na tabela channel_events
        await registerChannelEvent(channel.id, 'authenticated', {
          timestamp: new Date().toISOString()
        });
        
        console.log(`Cliente WhatsApp autenticado para o canal ${channel.id}`);
      } catch (error) {
        console.error('Erro ao processar autenticação:', error);
      }
    });
    
    // Evento de pronto
    client.on('ready', async () => {
      try {
        console.log(`Cliente WhatsApp pronto para o canal ${channel.id}`);
        
        // Atualizar status do cliente no PostgreSQL
        await db.query(
          `UPDATE channel_connections 
           SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{whatsapp_client_status}', '"ready"'),
           updated_at = NOW()
           WHERE channel_id = $1`,
          [channel.id]
        );
        
        // Atualizar status do canal
        await db.query(
          'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
          ['connected', channel.id]
        );
        
        // Registrar evento na tabela channel_events
        await registerChannelEvent(channel.id, 'ready', {
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Erro ao processar evento ready:', error);
      }
    });
    
    // Evento de desconexão
    client.on('disconnected', async (reason) => {
      try {
        console.log(`Cliente WhatsApp desconectado para o canal ${channel.id}. Motivo: ${reason}`);
        
        // Atualizar status do canal
        await db.query(
          'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
          ['disconnected', channel.id]
        );
        
        // Registrar evento na tabela channel_events
        await registerChannelEvent(channel.id, 'disconnected', {
          timestamp: new Date().toISOString(),
          reason
        });
        
        // Remover cliente do gerenciador
        whatsappClientManager.removeClient(channel.id);
      } catch (error) {
        console.error('Erro ao processar evento de desconexão:', error);
      }
    });
    
    // Manipular mensagens recebidas
    client.on('message', async (message) => {
      try {
        console.log(`Mensagem recebida no canal ${channel.id}: ${message.body}`);
        
        // Obter informações do remetente
        const contact = await message.getContact();
        
        // Verificar se já existe uma conversa com esse contato
        const conversationResult = await db.query(
          'SELECT * FROM conversations WHERE channel_id = $1 AND contact_id = $2',
          [channel.id, message.from]
        );
        
        let conversationId;
        
        if (conversationResult.rows.length === 0) {
          // Criar nova conversa
          const newConversation = await db.query(
            `INSERT INTO conversations 
             (id, channel_id, contact_id, contact_name, contact_info, last_message_at, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW()) 
             RETURNING id`,
            [
              uuidv4(), 
              channel.id, 
              message.from, 
              contact.name || contact.pushname || message.from, 
              JSON.stringify({
                name: contact.name || contact.pushname,
                number: message.from,
                isGroup: message.isGroup
              })
            ]
          );
          
          conversationId = newConversation.rows[0].id;
        } else {
          conversationId = conversationResult.rows[0].id;
          
          // Atualizar última mensagem
          await db.query(
            'UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1',
            [conversationId]
          );
        }
        
        // Inserir mensagem no banco de dados
        await db.query(
          `INSERT INTO messages 
           (id, conversation_id, channel_id, direction, content, status, external_id, timestamp, metadata) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            uuidv4(),
            conversationId,
            channel.id,
            'inbound',
            message.body,
            'received',
            message.id._serialized,
            new Date(message.timestamp * 1000).toISOString(),
            JSON.stringify({
              hasMedia: message.hasMedia,
              messageType: message.type,
              from: message.from,
              raw: JSON.stringify(message)
            })
          ]
        );
        
        // Registrar evento na tabela channel_events
        await registerChannelEvent(channel.id, 'message_received', {
          timestamp: new Date().toISOString(),
          from: message.from,
          messageId: message.id._serialized
        });
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    });
    
    // Iniciar cliente
    client.initialize().catch(err => {
      console.error(`Erro ao inicializar cliente WhatsApp para o canal ${channel.id}:`, err);
    });
    
    // Adicionar cliente ao gerenciador
    whatsappClientManager.addClient(channel.id, client);
    
    // Registrar evento de início de conexão
    await registerChannelEvent(channel.id, 'connection_started', {
      timestamp: new Date().toISOString(),
      type: 'whatsapp'
    });
    
    // Atualizar status do canal
    await db.query(
      'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
      ['connecting', channel.id]
    );
    
    // Responder com sucesso
    res.status(200).json({
      error: false,
      message: 'Conexão WhatsApp iniciada, aguardando QR Code',
      data: {
        channelId: channel.id
      }
    });
  } catch (error) {
    console.error('Erro ao conectar WhatsApp:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor: ' + error.message });
  }
};

// Obter QR Code do WhatsApp
const getWhatsAppQR = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2 AND type = $3',
      [id, userId, 'whatsapp']
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    // Obter QR Code do PostgreSQL
    const qrCodeResult = await db.query(
      'SELECT metadata FROM channel_events WHERE channel_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1',
      [id, 'qr_code']
    );
    
    if (qrCodeResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'QR Code não disponível ou expirado' });
    }
    
    const qrCode = JSON.parse(qrCodeResult.rows[0].metadata).qrDataURL;
    
    res.status(200).json({
      error: false,
      data: {
        qrCode
      }
    });
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Conectar Instagram
const connectInstagram = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    const userId = req.user.id;
    
    if (!username || !password) {
      return res.status(400).json({ error: true, message: 'Nome de usuário e senha são obrigatórios' });
    }
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2 AND type = $3',
      [id, userId, 'instagram']
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    // Atualizar dados de conexão (em uma aplicação real, usaria a API do Instagram)
    await db.query(
      'UPDATE channel_connections SET credentials = $1, last_connected = NOW(), updated_at = NOW() WHERE channel_id = $2',
      [JSON.stringify({ username }), id]
    );
    
    // Atualizar status do canal
    await db.query(
      'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
      ['connected', id]
    );
    
    // Publicar evento de conexão
    // await redisUtils.publish('channel:instagram:events', {
    //   type: 'connected',
    //   channelId: id,
    //   userId: userId
    // });
    
    res.status(200).json({
      error: false,
      message: 'Canal Instagram conectado com sucesso',
      data: {
        channelId: id
      }
    });
  } catch (error) {
    console.error('Erro ao conectar Instagram:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Verificar status de um canal
const getChannelStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    const result = await db.query(
      'SELECT id, status, updated_at FROM channels WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    res.status(200).json({
      error: false,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao verificar status do canal:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Obter estatísticas de um canal
const getChannelStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    // Obter estatísticas de mensagens
    const messageStats = await db.query(`
      SELECT 
        COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as messages_sent,
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as messages_received
      FROM messages
      WHERE channel_id = $1
    `, [id]);
    
    // Obter contagem de conversas ativas
    const conversationsResult = await db.query(`
      SELECT COUNT(*) as active_conversations
      FROM conversations
      WHERE channel_id = $1 AND status = 'active'
    `, [id]);
    
    // Obter contagem de contatos
    const contactsResult = await db.query(`
      SELECT COUNT(DISTINCT contact_id) as contacts
      FROM conversations
      WHERE channel_id = $1
    `, [id]);
    
    const stats = {
      messagesSent: parseInt(messageStats.rows[0]?.messages_sent || 0),
      messagesReceived: parseInt(messageStats.rows[0]?.messages_received || 0),
      activeConversations: parseInt(conversationsResult.rows[0]?.active_conversations || 0),
      contacts: parseInt(contactsResult.rows[0]?.contacts || 0)
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas do canal:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Obter histórico de eventos de um canal
const getChannelEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    // Obter eventos do canal
    const eventsResult = await db.query(`
      SELECT *
      FROM channel_events
      WHERE channel_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [id]);
    
    res.status(200).json(eventsResult.rows);
  } catch (error) {
    console.error('Erro ao obter eventos do canal:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Conectar canal (rota genérica)
const connectChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    const channel = channelResult.rows[0];
    
    // Redirecionar para o método específico de acordo com o tipo de canal
    switch (channel.type) {
      case 'whatsapp':
        return connectWhatsApp(req, res);
      case 'instagram':
        return connectInstagram(req, res);
      default:
        return res.status(400).json({ 
          error: true, 
          message: `Tipo de canal não suportado: ${channel.type}` 
        });
    }
  } catch (error) {
    console.error('Erro ao conectar canal:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Desconectar canal
const disconnectChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    const channel = channelResult.rows[0];
    
    // Atualizar status do canal
    await db.query(
      'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
      ['disconnected', channel.id]
    );
    
    // Registrar evento de desconexão
    await registerChannelEvent(channel.id, 'disconnected', {
      timestamp: new Date().toISOString(),
      type: channel.type
    });
    
    // Publicar evento de desconexão
    // await redisUtils.publish(`channel:${channel.type}:events`, {
    //   type: 'disconnected',
    //   channelId: channel.id,
    //   userId: userId
    // });
    
    // Desconectar cliente específico do tipo de canal
    if (channel.type === 'whatsapp') {
      // Desconectar cliente WhatsApp
      // const clientKey = `whatsapp:${id}`;
      // const client = redisUtils.getClient(clientKey);
      
      // if (client) {
      //   await client.logout();
      //   redisUtils.removeClient(clientKey);
      // }
    }
    
    res.status(200).json({ 
      error: false, 
      message: 'Canal desconectado com sucesso',
      status: 'disconnected'
    });
  } catch (error) {
    console.error('Erro ao desconectar canal:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Atualizar configurações do canal
const updateChannelSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    const { name, settings } = req.body;
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    const channel = channelResult.rows[0];
    
    // Validar configurações específicas do tipo de canal
    let validatedSettings = {};
    if (settings) {
      switch (channel.type) {
        case 'whatsapp':
          // Validar configurações do WhatsApp
          if (settings.phoneNumber) {
            validatedSettings.phoneNumber = settings.phoneNumber;
          }
          break;
        case 'instagram':
          // Validar configurações do Instagram
          if (settings.username) {
            validatedSettings.username = settings.username;
          }
          break;
        default:
          return res.status(400).json({ 
            error: true, 
            message: `Tipo de canal não suportado: ${channel.type}` 
          });
      }
    }
    
    // Iniciar transação
    await db.query('BEGIN');
    
    // Atualizar nome do canal se fornecido
    if (name) {
      await db.query(
        `UPDATE channels 
         SET name = $1, 
             updated_at = NOW()
         WHERE id = $2`,
        [name, id]
      );
    }
    
    // Verificar se já existe uma conexão para este canal
    const connectionResult = await db.query(
      'SELECT * FROM channel_connections WHERE channel_id = $1',
      [id]
    );
    
    if (connectionResult.rows.length > 0) {
      // Atualizar configurações na conexão existente
      await db.query(
        `UPDATE channel_connections 
         SET settings = COALESCE(settings::jsonb || $1::jsonb, $1::jsonb),
         updated_at = NOW()
         WHERE channel_id = $2`,
        [JSON.stringify(validatedSettings), id]
      );
    } else {
      // Criar nova entrada de conexão
      await db.query(
        `INSERT INTO channel_connections 
         (channel_id, settings, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [id, JSON.stringify(validatedSettings)]
      );
    }
    
    // Commit da transação
    await db.query('COMMIT');
    
    // Registrar evento de atualização de configurações
    await registerChannelEvent(id, 'settings_updated', {
      timestamp: new Date().toISOString(),
      updatedFields: {
        name: name ? true : false,
        settings: Object.keys(validatedSettings)
      }
    });
    
    res.status(200).json({ 
      error: false, 
      message: 'Configurações atualizadas com sucesso' 
    });
  } catch (error) {
    // Rollback em caso de erro
    await db.query('ROLLBACK').catch(e => console.error('Erro no rollback:', e));
    console.error('Erro ao atualizar configurações do canal:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Excluir canal
const deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    const channel = channelResult.rows[0];
    
    // Verificar se o canal está conectado
    if (channel.status === 'connected') {
      // Tentar desconectar primeiro
      try {
        // Desconectar cliente específico do tipo de canal
        if (channel.type === 'whatsapp') {
          const client = whatsappClientManager.getClient(channel.id);
          if (client) {
            await client.logout();
            await client.destroy();
            whatsappClientManager.removeClient(channel.id);
          }
        }
      } catch (disconnectError) {
        console.error('Erro ao desconectar canal antes da exclusão:', disconnectError);
      }
    }
    
    // Registrar evento de exclusão
    await registerChannelEvent(id, 'channel_deleted', {
      timestamp: new Date().toISOString(),
      channelType: channel.type,
      channelName: channel.name
    });
    
    // Iniciar transação
    await db.query('BEGIN');
    
    try {
      // Excluir mensagens
      await db.query('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE channel_id = $1)', [id]);
      
      // Excluir conversas
      await db.query('DELETE FROM conversations WHERE channel_id = $1', [id]);
      
      // Excluir eventos
      await db.query('DELETE FROM channel_events WHERE channel_id = $1', [id]);
      
      // Excluir conexões
      await db.query('DELETE FROM channel_connections WHERE channel_id = $1', [id]);
      
      // Excluir o canal
      await db.query('DELETE FROM channels WHERE id = $1', [id]);
      
      await db.query('COMMIT');
      
      res.status(200).json({ 
        error: false, 
        message: 'Canal excluído com sucesso' 
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error; // Propagar o erro para ser tratado abaixo
    }
  } catch (error) {
    console.error('Erro ao excluir canal:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor: ' + error.message });
  }
};

// Verificar status da conexão WhatsApp
const checkWhatsAppStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT c.*, cc.settings FROM channels c LEFT JOIN channel_connections cc ON c.id = cc.channel_id WHERE c.id = $1 AND c.user_id = $2 AND c.type = $3',
      [id, userId, 'whatsapp']
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    const channel = channelResult.rows[0];
    
    // Verificar se há um cliente ativo no gerenciador
    const hasActiveClient = whatsappClientManager.hasClient(id);
    
    // Verificar status armazenado no banco
    let clientStatus = 'disconnected';
    if (channel.settings && channel.settings.whatsapp_client_status) {
      clientStatus = channel.settings.whatsapp_client_status;
    }
    
    res.status(200).json({
      error: false,
      data: {
        channelId: channel.id,
        status: channel.status,
        clientStatus,
        hasActiveClient
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status do WhatsApp:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Desconectar WhatsApp
const disconnectWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2 AND type = $3',
      [id, userId, 'whatsapp']
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    const channel = channelResult.rows[0];
    
    // Remover cliente do gerenciador de clientes
    whatsappClientManager.removeClient(id);
    
    // Atualizar status do canal
    await db.query(
      'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
      ['disconnected', id]
    );
    
    // Atualizar status do cliente no banco de dados
    await db.query(
      `UPDATE channel_connections 
       SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{whatsapp_client_status}', '"disconnected"'),
       updated_at = NOW()
       WHERE channel_id = $1`,
      [id]
    );
    
    // Registrar evento na tabela channel_events
    await registerChannelEvent(id, 'disconnected', {
      timestamp: new Date().toISOString(),
      reason: 'user_request'
    });
    
    res.status(200).json({
      error: false,
      message: 'WhatsApp desconectado com sucesso',
      data: {
        channelId: id
      }
    });
  } catch (error) {
    console.error('Erro ao desconectar WhatsApp:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Alternar conexão do canal (conectar/desconectar)
const toggleChannelConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validar se o ID é um UUID válido
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: true, message: 'ID de canal inválido' });
    }
    
    // Verificar se o canal existe e pertence ao usuário
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    const channel = channelResult.rows[0];
    
    // Verificar o status atual e decidir a ação
    if (channel.status === 'connected') {
      // Se está conectado, desconectar
      if (channel.type === 'whatsapp') {
        // Desconectar cliente WhatsApp
        const client = whatsappClientManager.getClient(id);
        if (client) {
          try {
            await client.logout();
            await client.destroy();
            whatsappClientManager.removeClient(id);
          } catch (err) {
            console.error('Erro ao desconectar cliente WhatsApp:', err);
          }
        }
      }
      
      // Atualizar status do canal
      await db.query(
        'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
        ['disconnected', id]
      );
      
      // Registrar evento
      await registerChannelEvent(id, 'disconnected', {
        timestamp: new Date().toISOString()
      });
      
    } else {
      // Se não está conectado, iniciar conexão
      if (channel.type === 'whatsapp') {
        // Criar cliente WhatsApp
        const client = new Client({
          puppeteer: {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--single-process',
              '--disable-gpu'
            ]
          },
          authStrategy: new LocalAuth({
            clientId: channel.id
          })
        });
        
        // Configurar eventos do cliente
        client.on('qr', async (qr) => {
          try {
            // Gerar QR Code como data URL
            const qrDataURL = await qrcode.toDataURL(qr);
            
            // Armazenar QR Code no PostgreSQL
            await db.query(
              `INSERT INTO channel_events (id, channel_id, type, metadata, created_at)
               VALUES ($1, $2, $3, $4, NOW())`,
              [uuidv4(), channel.id, 'qr_code', JSON.stringify({ qrDataURL })]
            );
            
            // Atualizar status do canal
            await db.query(
              'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
              ['qr_ready', channel.id]
            );
            
            // Registrar evento
            await registerChannelEvent(channel.id, 'qr_ready', {
              timestamp: new Date().toISOString()
            });
            
            console.log(`QR Code gerado para o canal ${channel.id}`);
          } catch (error) {
            console.error('Erro ao processar QR Code:', error);
          }
        });
        
        // Configurar outros eventos...
        client.on('authenticated', async () => {
          await db.query(
            'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
            ['authenticated', channel.id]
          );
        });
        
        client.on('ready', async () => {
          await db.query(
            'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
            ['connected', channel.id]
          );
        });
        
        // Iniciar cliente
        client.initialize().catch(err => {
          console.error(`Erro ao inicializar cliente WhatsApp para o canal ${channel.id}:`, err);
        });
        
        // Adicionar cliente ao gerenciador
        whatsappClientManager.addClient(channel.id, client);
      }
      
      // Atualizar status do canal para connecting
      await db.query(
        'UPDATE channels SET status = $1, updated_at = NOW() WHERE id = $2',
        ['connecting', id]
      );
      
      // Registrar evento
      await registerChannelEvent(id, 'connecting', {
        timestamp: new Date().toISOString()
      });
    }
    
    // Obter o status atualizado do canal
    const updatedChannelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1',
      [id]
    );
    
    const updatedChannel = updatedChannelResult.rows[0];
    
    return res.status(200).json({
      error: false,
      message: `Alterando estado do canal para: ${updatedChannel.status}`,
      data: updatedChannel
    });
  } catch (error) {
    console.error('Erro ao alternar conexão do canal:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor: ' + error.message });
  }
};

module.exports = {
  createChannel,
  listChannels,
  getChannel,
  getChannelDetails,
  getChannelStatus,
  connectChannel,
  disconnectChannel,
  updateChannelSettings,
  getChannelStats,
  getChannelEvents,
  connectWhatsApp,
  getWhatsAppQR,
  checkWhatsAppStatus,
  disconnectWhatsApp,
  toggleChannelConnection,
  connectInstagram,
  deleteChannel
};
