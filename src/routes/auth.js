const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');

// Rotas públicas
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Rotas protegidas
router.get('/profile', authenticateJWT, authController.getProfile);
router.post('/api-tokens', authenticateJWT, authController.createAPIToken);

module.exports = router;
