/**
 * Gerenciador de clientes WhatsApp
 * Armazena e gerencia instâncias de clientes WhatsApp em memória
 */

class WhatsAppClientManager {
  constructor() {
    // Armazenar clientes em um Map para acesso rápido por channelId
    this.clients = new Map();
    console.log('WhatsApp Client Manager inicializado');
  }

  /**
   * Adicionar um cliente ao gerenciador
   * @param {string} channelId - ID do canal
   * @param {Object} client - Instância do cliente WhatsApp
   */
  addClient(channelId, client) {
    this.clients.set(channelId, client);
    console.log(`Cliente adicionado para o canal ${channelId}`);
  }

  /**
   * Obter um cliente do gerenciador
   * @param {string} channelId - ID do canal
   * @returns {Object|null} - Instância do cliente ou null se não existir
   */
  getClient(channelId) {
    return this.clients.get(channelId) || null;
  }

  /**
   * Verificar se um cliente existe
   * @param {string} channelId - ID do canal
   * @returns {boolean} - True se o cliente existir, false caso contrário
   */
  hasClient(channelId) {
    return this.clients.has(channelId);
  }

  /**
   * Remover um cliente do gerenciador
   * @param {string} channelId - ID do canal
   */
  removeClient(channelId) {
    if (this.clients.has(channelId)) {
      const client = this.clients.get(channelId);
      
      // Tentar desconectar o cliente de forma limpa
      try {
        if (client && typeof client.destroy === 'function') {
          client.destroy();
        }
      } catch (error) {
        console.error(`Erro ao destruir cliente para o canal ${channelId}:`, error);
      }
      
      this.clients.delete(channelId);
      console.log(`Cliente removido para o canal ${channelId}`);
    }
  }

  /**
   * Obter todos os clientes ativos
   * @returns {Map} - Map com todos os clientes
   */
  getAllClients() {
    return this.clients;
  }

  /**
   * Limpar todos os clientes
   */
  clearAllClients() {
    // Desconectar todos os clientes
    for (const [channelId, client] of this.clients.entries()) {
      try {
        if (client && typeof client.destroy === 'function') {
          client.destroy();
        }
      } catch (error) {
        console.error(`Erro ao destruir cliente para o canal ${channelId}:`, error);
      }
    }
    
    this.clients.clear();
    console.log('Todos os clientes foram removidos');
  }
}

// Exportar uma única instância do gerenciador para ser usada em toda a aplicação
const whatsappClientManager = new WhatsAppClientManager();

module.exports = whatsappClientManager;
