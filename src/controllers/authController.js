const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { redisUtils } = require('../config/redis');
require('dotenv').config();

// Gerar tokens JWT
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Login de usuário
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validar entrada
    if (!username || !password) {
      return res.status(400).json({ error: true, message: 'Nome de usuário e senha são obrigatórios' });
    }
    
    // Buscar usuário
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: true, message: 'Credenciais inválidas' });
    }
    
    const user = result.rows[0];
    
    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: true, message: 'Credenciais inválidas' });
    }
    
    // Gerar tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Armazenar refresh token no Redis
    const sessionId = uuidv4();
    await redisUtils.setSession(sessionId, {
      userId: user.id,
      refreshToken,
      createdAt: new Date().toISOString()
    }, 60 * 60 * 24 * 7); // 7 dias
    
    // Retornar tokens
    res.status(200).json({
      error: false,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken,
        sessionId
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Renovar token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken, sessionId } = req.body;
    
    if (!refreshToken || !sessionId) {
      return res.status(400).json({ error: true, message: 'Refresh token e ID de sessão são obrigatórios' });
    }
    
    // Verificar sessão no Redis
    const session = await redisUtils.getSession(sessionId);
    
    if (!session || session.refreshToken !== refreshToken) {
      return res.status(401).json({ error: true, message: 'Sessão inválida ou expirada' });
    }
    
    // Verificar token
    jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        await redisUtils.deleteSession(sessionId);
        return res.status(401).json({ error: true, message: 'Refresh token inválido ou expirado' });
      }
      
      // Buscar usuário
      const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      
      if (result.rows.length === 0) {
        await redisUtils.deleteSession(sessionId);
        return res.status(401).json({ error: true, message: 'Usuário não encontrado' });
      }
      
      const user = result.rows[0];
      
      // Gerar novos tokens
      const tokens = generateTokens(user);
      
      // Atualizar refresh token no Redis
      await redisUtils.setSession(sessionId, {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        createdAt: new Date().toISOString()
      }, 60 * 60 * 24 * 7); // 7 dias
      
      // Retornar novos tokens
      res.status(200).json({
        error: false,
        message: 'Token renovado com sucesso',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: true, message: 'ID de sessão é obrigatório' });
    }
    
    // Remover sessão do Redis
    await redisUtils.deleteSession(sessionId);
    
    res.status(200).json({
      error: false,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Obter perfil do usuário
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Usuário não encontrado' });
    }
    
    res.status(200).json({
      error: false,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

// Criar token de API
const createAPIToken = async (req, res) => {
  try {
    const { name, permissions, expiresIn } = req.body;
    const userId = req.user.id;
    
    if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: true, message: 'Nome e permissões são obrigatórios' });
    }
    
    // Gerar token
    const token = uuidv4();
    
    // Calcular data de expiração
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
    }
    
    // Inserir no banco de dados
    const result = await db.query(
      'INSERT INTO api_tokens (user_id, name, token, permissions, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name, token, JSON.stringify(permissions), expiresAt]
    );
    
    res.status(201).json({
      error: false,
      message: 'Token de API criado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar token de API:', error);
    res.status(500).json({ error: true, message: 'Erro no servidor' });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getProfile,
  createAPIToken
};
