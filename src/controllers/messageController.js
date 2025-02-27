const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { redisUtils } = require('../config/redis');

// Enviar mensagem
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, mediaUrl, mediaType } = req.body;
    const userId = req.user.id;
    
    if (!conversationId || !content) {
      return res.status(400).json({ error: true, message: 'ID da conversa e conteúdo são obrigatórios' });
    }
    
    // Verificar se a conversa existe e pertence ao usuário
    const conversationResult = await db.query(`
      SELECT c.*, ch.id as channel_id, ch.type as channel_type
      FROM conversations c
      JOIN channels ch ON c.channel_id = ch.id
      WHERE c.id = $1 AND ch.user_id = $2
    `, [conversationId, userId]);
    
    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Conversa não encontrada' });
    }
    
    const conversation = conversationResult.rows[0];
    
    // Criar mensagem no banco de dados
    const messageResult = await db.query(
      `INSERT INTO messages 
       (conversation_id, channel_id, direction, content, media_url, media_type, status, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        conversationId,
        conversation.channel_id,
        'outbound',
        content,
        mediaUrl || null,
        mediaType || null,
        'pending',
        JSON.stringify({ sender: userId })
      ]
    );
    
    const message = messageResult.rows[0];
    
    // Atualizar timestamp da última mensagem na conversa
    await db.query(
      'UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1',
      [conversationId]
    );
    
    // Adicionar mensagem à fila de saída
    await redisUtils.addToQueue('queue:messages:outbound', {
      messageId: message.id,
      channelType: conversation.channel_type,
      channelId: conversation.channel_id,
      conversationId: conversationId,
      contactId: conversation.contact_id,
      content: content,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      timestamp: new Date().toISOString()
    });
    
    // Incrementar estatística
    await redisUtils.incrementStat(`stats:messages:daily:${new Date().toISOString().split('T')[0]}`);
    
    // Publicar evento de mensagem enviada
    await redisUtils.publish('channel:notifications', {
      type: 'message_queued',
      messageId: message.id,
      conversationId: conversationId,
      userId: userId
    });
    
    res.status(201).json({
      error: false,
      message: 'Mensagem adicionada à fila de envio',
      data: message
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Obter status de uma mensagem
const getMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar se a mensagem existe e pertence ao usuário
    const result = await db.query(`
      SELECT m.*
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      JOIN channels ch ON c.channel_id = ch.id
      WHERE m.id = $1 AND ch.user_id = $2
    `, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Mensagem não encontrada' });
    }
    
    res.status(200).json({
      error: false,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter status da mensagem:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Receber webhook de mensagem (para processamento de mensagens recebidas)
const receiveWebhook = async (req, res) => {
  try {
    const { channelId, contactId, content, mediaUrl, mediaType, externalId } = req.body;
    
    // Verificar se o canal existe
    const channelResult = await db.query(
      'SELECT * FROM channels WHERE id = $1',
      [channelId]
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Canal não encontrado' });
    }
    
    const channel = channelResult.rows[0];
    
    // Verificar se já existe uma conversa com este contato
    let conversationResult = await db.query(
      'SELECT * FROM conversations WHERE channel_id = $1 AND contact_id = $2',
      [channelId, contactId]
    );
    
    let conversation;
    
    if (conversationResult.rows.length === 0) {
      // Criar nova conversa
      const newConversationResult = await db.query(
        `INSERT INTO conversations 
         (channel_id, contact_id, contact_name, status, last_message_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         RETURNING *`,
        [channelId, contactId, contactId, 'active']
      );
      
      conversation = newConversationResult.rows[0];
    } else {
      conversation = conversationResult.rows[0];
      
      // Atualizar timestamp da última mensagem
      await db.query(
        'UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1',
        [conversation.id]
      );
    }
    
    // Criar mensagem no banco de dados
    const messageResult = await db.query(
      `INSERT INTO messages 
       (conversation_id, channel_id, direction, content, media_url, media_type, status, external_id, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        conversation.id,
        channelId,
        'inbound',
        content,
        mediaUrl || null,
        mediaType || null,
        'received',
        externalId || null,
        JSON.stringify({ source: 'webhook' })
      ]
    );
    
    const message = messageResult.rows[0];
    
    // Adicionar mensagem à fila de processamento
    await redisUtils.addToQueue('queue:messages:processing', {
      messageId: message.id,
      channelType: channel.type,
      channelId: channelId,
      conversationId: conversation.id,
      contactId: contactId,
      content: content,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      timestamp: new Date().toISOString()
    });
    
    // Incrementar estatística
    await redisUtils.incrementStat(`stats:messages:daily:${new Date().toISOString().split('T')[0]}`);
    
    // Publicar evento de mensagem recebida
    await redisUtils.publish('channel:notifications', {
      type: 'message_received',
      messageId: message.id,
      conversationId: conversation.id,
      userId: channel.user_id
    });
    
    res.status(200).json({
      error: false,
      message: 'Mensagem recebida com sucesso',
      data: {
        messageId: message.id,
        conversationId: conversation.id
      }
    });
  } catch (error) {
    console.error('Erro ao processar webhook de mensagem:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

module.exports = {
  sendMessage,
  getMessageStatus,
  receiveWebhook
};
