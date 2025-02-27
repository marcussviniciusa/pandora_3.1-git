const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Listar webhooks do usuário
const listWebhooks = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.status(200).json({
      error: false,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar webhooks:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Obter detalhes de um webhook
const getWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM webhooks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Webhook não encontrado' });
    }
    
    res.status(200).json({
      error: false,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter webhook:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Registrar novo webhook
const registerWebhook = async (req, res) => {
  try {
    const { name, url, events, headers } = req.body;
    const userId = req.user.id;
    
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ 
        error: true, 
        message: 'Nome, URL e pelo menos um evento são obrigatórios' 
      });
    }
    
    // Validar eventos permitidos
    const allowedEvents = [
      'message.received', 
      'message.sent', 
      'message.delivered', 
      'message.read', 
      'message.failed',
      'conversation.created',
      'conversation.updated',
      'channel.connected',
      'channel.disconnected'
    ];
    
    const invalidEvents = events.filter(event => !allowedEvents.includes(event));
    
    if (invalidEvents.length > 0) {
      return res.status(400).json({ 
        error: true, 
        message: `Eventos inválidos: ${invalidEvents.join(', ')}` 
      });
    }
    
    // Inserir webhook
    const result = await db.query(
      `INSERT INTO webhooks 
       (user_id, name, url, events, headers, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        userId, 
        name, 
        url, 
        JSON.stringify(events), 
        headers ? JSON.stringify(headers) : JSON.stringify({}), 
        true
      ]
    );
    
    res.status(201).json({
      error: false,
      message: 'Webhook registrado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao registrar webhook:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Atualizar webhook
const updateWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, events, headers, is_active } = req.body;
    const userId = req.user.id;
    
    // Verificar se o webhook existe e pertence ao usuário
    const checkResult = await db.query(
      'SELECT * FROM webhooks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Webhook não encontrado' });
    }
    
    // Validar eventos se fornecidos
    if (events) {
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ 
          error: true, 
          message: 'Pelo menos um evento é obrigatório' 
        });
      }
      
      const allowedEvents = [
        'message.received', 
        'message.sent', 
        'message.delivered', 
        'message.read', 
        'message.failed',
        'conversation.created',
        'conversation.updated',
        'channel.connected',
        'channel.disconnected'
      ];
      
      const invalidEvents = events.filter(event => !allowedEvents.includes(event));
      
      if (invalidEvents.length > 0) {
        return res.status(400).json({ 
          error: true, 
          message: `Eventos inválidos: ${invalidEvents.join(', ')}` 
        });
      }
    }
    
    // Construir query de atualização
    let updateQuery = 'UPDATE webhooks SET updated_at = NOW()';
    const queryParams = [];
    let paramCount = 1;
    
    if (name) {
      updateQuery += `, name = $${paramCount}`;
      queryParams.push(name);
      paramCount++;
    }
    
    if (url) {
      updateQuery += `, url = $${paramCount}`;
      queryParams.push(url);
      paramCount++;
    }
    
    if (events) {
      updateQuery += `, events = $${paramCount}`;
      queryParams.push(JSON.stringify(events));
      paramCount++;
    }
    
    if (headers) {
      updateQuery += `, headers = $${paramCount}`;
      queryParams.push(JSON.stringify(headers));
      paramCount++;
    }
    
    if (is_active !== undefined) {
      updateQuery += `, is_active = $${paramCount}`;
      queryParams.push(is_active);
      paramCount++;
    }
    
    updateQuery += ` WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`;
    queryParams.push(id, userId);
    
    // Executar atualização
    const result = await db.query(updateQuery, queryParams);
    
    res.status(200).json({
      error: false,
      message: 'Webhook atualizado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar webhook:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Remover webhook
const deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar se o webhook existe e pertence ao usuário
    const checkResult = await db.query(
      'SELECT * FROM webhooks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Webhook não encontrado' });
    }
    
    // Remover webhook
    await db.query(
      'DELETE FROM webhooks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    res.status(200).json({
      error: false,
      message: 'Webhook removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover webhook:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

module.exports = {
  listWebhooks,
  getWebhook,
  registerWebhook,
  updateWebhook,
  deleteWebhook
};
