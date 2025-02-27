/**
 * Serviço para envio de mensagens WhatsApp
 */

const db = require('../config/database');
const whatsappClientManager = require('./whatsappClientManager');

/**
 * Enviar mensagem via WhatsApp
 * @param {Object} message - Objeto com dados da mensagem
 * @returns {Promise<Object>} - Resultado do envio
 */
async function sendMessage(message) {
  try {
    const { channelId, contactId, content } = message;
    
    // Verificar se o cliente existe no gerenciador
    if (!whatsappClientManager.hasClient(channelId)) {
      return {
        success: false,
        error: 'Cliente WhatsApp não está conectado'
      };
    }
    
    // Obter cliente do gerenciador
    const client = whatsappClientManager.getClient(channelId);
    
    // Verificar status do cliente
    const channelResult = await db.query(
      'SELECT c.*, cc.settings FROM channels c LEFT JOIN channel_connections cc ON c.id = cc.channel_id WHERE c.id = $1',
      [channelId]
    );
    
    if (channelResult.rows.length === 0) {
      return {
        success: false,
        error: 'Canal não encontrado'
      };
    }
    
    const channel = channelResult.rows[0];
    
    // Verificar se o cliente está pronto
    let clientStatus = 'disconnected';
    if (channel.settings && channel.settings.whatsapp_client_status) {
      clientStatus = channel.settings.whatsapp_client_status;
    }
    
    if (clientStatus !== 'ready') {
      return {
        success: false,
        error: 'Cliente WhatsApp não está pronto'
      };
    }
    
    // Formatar número de telefone (removendo caracteres não numéricos)
    const formattedNumber = contactId.replace(/\D/g, '');
    
    // Criar o destino no formato exigido pelo WhatsApp Web
    const chatId = `${formattedNumber}@c.us`;
    
    console.log(`Enviando mensagem WhatsApp para ${chatId}: ${content}`);
    
    // Enviar mensagem usando o cliente
    const result = await client.sendMessage(chatId, content);
    
    return {
      success: true,
      externalId: result.id._serialized || `whatsapp_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendMessage
};
