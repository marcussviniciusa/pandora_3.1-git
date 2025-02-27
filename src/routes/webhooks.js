const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { authenticateJWT } = require('../middleware/auth');

// Middleware de autenticação para todas as rotas
router.use(authenticateJWT);

// Rotas de webhooks
router.get('/', webhookController.listWebhooks);
router.get('/:id', webhookController.getWebhook);
router.post('/register', webhookController.registerWebhook);
router.put('/:id', webhookController.updateWebhook);
router.delete('/:id', webhookController.deleteWebhook);

module.exports = router;
