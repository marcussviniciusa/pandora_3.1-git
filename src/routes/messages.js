const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateJWT, authenticateAPIToken } = require('../middleware/auth');

// Rotas protegidas por JWT
router.post('/send', authenticateJWT, messageController.sendMessage);
router.get('/:id/status', authenticateJWT, messageController.getMessageStatus);

// Rota de webhook (pode ser protegida por API token ou não, dependendo da implementação)
router.post('/webhook', messageController.receiveWebhook);

module.exports = router;
