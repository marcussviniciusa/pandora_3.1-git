const inboundMessageWorker = require('./inboundMessageWorker');
const outboundMessageWorker = require('./outboundMessageWorker');
const connectionMaintenanceWorker = require('./connectionMaintenanceWorker');

// Inicializar todos os workers
async function startAllWorkers() {
  try {
    console.log('Iniciando todos os workers...');
    
    // Todos os workers estão desativados pois dependem do Redis
    console.log('Workers desativados - Redis removido');
    
    return true;
  } catch (error) {
    console.error('Erro ao iniciar workers:', error);
    return false;
  }
}

// Parar todos os workers
async function stopAllWorkers() {
  try {
    console.log('Parando todos os workers...');
    
    // Todos os workers estão desativados pois dependem do Redis
    console.log('Workers desativados - Redis removido');
    
    return true;
  } catch (error) {
    console.error('Erro ao parar workers:', error);
    return false;
  }
}

// Configurar tratamento de encerramento
function setupGracefulShutdown() {
  process.on('SIGTERM', async () => {
    console.log('Recebido SIGTERM, encerrando workers...');
    await stopAllWorkers();
  });
  
  process.on('SIGINT', async () => {
    console.log('Recebido SIGINT, encerrando workers...');
    await stopAllWorkers();
  });
}

module.exports = {
  startAllWorkers,
  stopAllWorkers
};

// Se este arquivo for executado diretamente, iniciar todos os workers
if (require.main === module) {
  startAllWorkers()
    .then(() => {
      console.log('Workers iniciados via linha de comando');
    })
    .catch(error => {
      console.error('Erro ao iniciar workers via linha de comando:', error);
      process.exit(1);
    });
}
