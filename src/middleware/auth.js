const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

// Middleware para verificar o token JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: true, message: 'Token de autenticação não fornecido' });
  }
  
  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: true, message: 'Token inválido ou expirado' });
    }
    
    req.user = user;
    next();
  });
};

// Middleware para verificar se o usuário é admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: true, message: 'Acesso negado: permissão de administrador necessária' });
  }
};

// Middleware para verificar token de API
const authenticateAPIToken = async (req, res, next) => {
  const apiToken = req.headers['x-api-token'];
  
  if (!apiToken) {
    return res.status(401).json({ error: true, message: 'Token de API não fornecido' });
  }
  
  try {
    // Verificar se o token existe no banco de dados
    const result = await db.query(
      'SELECT * FROM api_tokens WHERE token = $1 AND expires_at > NOW()',
      [apiToken]
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({ error: true, message: 'Token de API inválido ou expirado' });
    }
    
    const tokenData = result.rows[0];
    
    // Atualizar último uso
    await db.query(
      'UPDATE api_tokens SET last_used_at = NOW() WHERE id = $1',
      [tokenData.id]
    );
    
    // Obter dados do usuário
    const userResult = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [tokenData.user_id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: true, message: 'Usuário associado ao token não encontrado' });
    }
    
    req.user = userResult.rows[0];
    req.apiToken = tokenData;
    next();
  } catch (error) {
    console.error('Erro ao verificar token de API:', error);
    res.status(500).json({ error: true, message: 'Erro ao verificar token de API' });
  }
};

// Middleware para verificar permissões do token de API
const hasAPIPermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiToken) {
      return res.status(403).json({ error: true, message: 'Token de API não autenticado' });
    }
    
    const permissions = req.apiToken.permissions;
    
    if (Array.isArray(permissions) && permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: true, message: `Permissão '${permission}' necessária` });
    }
  };
};

module.exports = {
  authenticateJWT,
  isAdmin,
  authenticateAPIToken,
  hasAPIPermission
};
