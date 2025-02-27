const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const { authenticateJWT } = require('../middleware/auth');

// Middleware de autenticação para todas as rotas
router.use(authenticateJWT);

// Rotas de canais
router.get('/', channelController.listChannels);
router.get('/:id', channelController.getChannel);
router.get('/:id/details', channelController.getChannelDetails);
router.post('/', channelController.createChannel);
router.get('/:id/status', channelController.getChannelStatus);

// Rotas específicas para WhatsApp
router.post('/whatsapp/:id/connect', channelController.connectWhatsApp);
router.get('/whatsapp/:id/qrcode', channelController.getWhatsAppQR);
router.get('/whatsapp/:id/status', channelController.checkWhatsAppStatus);
router.post('/whatsapp/:id/disconnect', channelController.disconnectWhatsApp);

// Rotas específicas para Instagram
router.post('/instagram/:id/connect', channelController.connectInstagram);

// Novas rotas para detalhes do canal
router.get('/:id/stats', channelController.getChannelStats);
router.get('/:id/events', channelController.getChannelEvents);
router.post('/:id/connect', channelController.connectChannel);
router.post('/:id/disconnect', channelController.disconnectChannel);
router.put('/:id/settings', channelController.updateChannelSettings);
router.delete('/:id', channelController.deleteChannel);

module.exports = router;
