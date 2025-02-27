/**
 * Gerenciador de clientes WhatsApp
 * Armazena e gerencia instâncias de clientes WhatsApp em memória
 */

const { Client } = require('whatsapp-web.js');

class WhatsAppClientManager {
  constructor() {
    // Armazenar clientes em um objeto para acesso rápido por channelId
    this.clients = {};
    console.log('WhatsApp Client Manager inicializado');
  }

  /**
   * Adicionar um cliente ao gerenciador
   * @param {string} channelId - ID do canal
   * @param {Object} client - Instância do cliente WhatsApp
   */
  addClient(channelId, client) {
    console.log(`Cliente adicionado para o canal ${channelId}`);
    this.clients[channelId] = client;
  }

  /**
   * Obter um cliente do gerenciador
   * @param {string} channelId - ID do canal
   * @returns {Object} - Instância do cliente
   */
  getClient(channelId) {
    return this.clients[channelId];
  }

  /**
   * Remover um cliente do gerenciador
   * @param {string} channelId - ID do canal
   */
  removeClient(channelId) {
    console.log(`Cliente removido para o canal ${channelId}`);
    if (this.clients[channelId]) {
      delete this.clients[channelId];
    }
  }

  /**
   * Verificar se um cliente existe
   * @param {string} channelId - ID do canal
   * @returns {boolean} - True se o cliente existir, false caso contrário
   */
  hasClient(channelId) {
    return !!this.clients[channelId];
  }

  /**
   * Listar todos os clientes ativos
   * @returns {Array} - IDs dos clientes ativos
   */
  listActiveClients() {
    return Object.keys(this.clients);
  }

  /**
   * Desconectar todos os clientes
   */
  async disconnectAll() {
    console.log('Desconectando todos os clientes WhatsApp...');
    const clientIds = Object.keys(this.clients);
    for (const id of clientIds) {
      try {
        const client = this.clients[id];
        if (client) {
          await client.logout();
          await client.destroy();
          delete this.clients[id];
        }
      } catch (error) {
        console.error(`Erro ao desconectar cliente ${id}:`, error);
      }
    }
  }
}

// Exportar uma única instância do gerenciador para ser usada em toda a aplicação
module.exports = new WhatsAppClientManager();
