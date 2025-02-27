const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { authenticateJWT } = require('../middleware/auth');

// Middleware de autenticação para todas as rotas
router.use(authenticateJWT);

// Rotas de conversas
router.get('/', conversationController.listConversations);
router.get('/:id', conversationController.getConversation);
router.patch('/:id/status', conversationController.updateConversationStatus);
router.get('/:id/messages', conversationController.getConversationMessages);

module.exports = router;
