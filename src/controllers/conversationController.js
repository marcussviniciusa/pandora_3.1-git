const db = require('../config/database');
const { redisUtils } = require('../config/redis');

// Listar conversas do usuário
const listConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, channelId, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT c.*, ch.name as channel_name, ch.type as channel_type, 
      (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
      (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message
      FROM conversations c
      JOIN channels ch ON c.channel_id = ch.id
      WHERE ch.user_id = $1
    `;
    
    const queryParams = [userId];
    let paramCount = 2;
    
    if (status) {
      query += ` AND c.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }
    
    if (channelId) {
      query += ` AND c.channel_id = $${paramCount}`;
      queryParams.push(channelId);
      paramCount++;
    }
    
    query += ` ORDER BY c.last_message_at DESC NULLS LAST LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, queryParams);
    
    // Obter contagem total
    const countQuery = `
      SELECT COUNT(*) FROM conversations c
      JOIN channels ch ON c.channel_id = ch.id
      WHERE ch.user_id = $1
      ${status ? ' AND c.status = $2' : ''}
      ${channelId ? ` AND c.channel_id = $${status ? 3 : 2}` : ''}
    `;
    
    const countParams = [userId];
    if (status) countParams.push(status);
    if (channelId) countParams.push(channelId);
    
    const countResult = await db.query(countQuery, countParams);
    
    res.status(200).json({
      error: false,
      data: {
        conversations: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Obter detalhes de uma conversa
const getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar se a conversa existe e pertence ao usuário
    const result = await db.query(`
      SELECT c.*, ch.name as channel_name, ch.type as channel_type
      FROM conversations c
      JOIN channels ch ON c.channel_id = ch.id
      WHERE c.id = $1 AND ch.user_id = $2
    `, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Conversa não encontrada' });
    }
    
    // Obter contagem de mensagens
    const countResult = await db.query(
      'SELECT COUNT(*) FROM messages WHERE conversation_id = $1',
      [id]
    );
    
    const conversation = result.rows[0];
    conversation.message_count = parseInt(countResult.rows[0].count);
    
    // Verificar cache do Redis
    const cachedConversation = await redisUtils.getCache(`cache:conversation:${id}`);
    
    if (!cachedConversation) {
      // Armazenar no cache
      await redisUtils.setCache(`cache:conversation:${id}`, conversation, 60 * 15); // 15 minutos
    }
    
    res.status(200).json({
      error: false,
      data: conversation
    });
  } catch (error) {
    console.error('Erro ao obter conversa:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Atualizar status de uma conversa
const updateConversationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    if (!status || !['active', 'archived'].includes(status)) {
      return res.status(400).json({ error: true, message: 'Status inválido' });
    }
    
    // Verificar se a conversa existe e pertence ao usuário
    const checkResult = await db.query(`
      SELECT c.id
      FROM conversations c
      JOIN channels ch ON c.channel_id = ch.id
      WHERE c.id = $1 AND ch.user_id = $2
    `, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Conversa não encontrada' });
    }
    
    // Atualizar status
    await db.query(
      'UPDATE conversations SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
    
    // Limpar cache
    await redisUtils.deleteCache(`cache:conversation:${id}`);
    
    res.status(200).json({
      error: false,
      message: 'Status da conversa atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status da conversa:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Obter mensagens de uma conversa
const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user.id;
    
    // Verificar se a conversa existe e pertence ao usuário
    const checkResult = await db.query(`
      SELECT c.id
      FROM conversations c
      JOIN channels ch ON c.channel_id = ch.id
      WHERE c.id = $1 AND ch.user_id = $2
    `, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Conversa não encontrada' });
    }
    
    // Construir query para mensagens
    let query = 'SELECT * FROM messages WHERE conversation_id = $1';
    const queryParams = [id];
    let paramCount = 2;
    
    if (before) {
      query += ` AND timestamp < $${paramCount}`;
      queryParams.push(before);
      paramCount++;
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));
    
    const result = await db.query(query, queryParams);
    
    res.status(200).json({
      error: false,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao obter mensagens da conversa:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

module.exports = {
  listConversations,
  getConversation,
  updateConversationStatus,
  getConversationMessages
};
