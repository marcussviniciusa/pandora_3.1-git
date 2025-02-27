const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Importar configurações
const db = require('./config/database');
const { initializeDatabase } = require('./db/init');
const { startAllWorkers, stopAllWorkers } = require('./workers');

// Importar rotas
const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const webhookRoutes = require('./routes/webhooks');

// Inicializar aplicação Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Definir rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/webhooks', webhookRoutes);

// Rota de verificação de saúde
app.get('/health', (req, res) => {
  // Verificar também a conexão com o banco de dados e Redis
  const dbStatus = db.pool && db.pool.totalCount > 0;
  
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date(),
    services: {
      database: dbStatus ? 'connected' : 'disconnected'
    }
  });
});

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message
  });
});

// Configurar Socket.IO para comunicação em tempo real
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);
  
  // Autenticar socket
  socket.on('authenticate', (token) => {
    // Implementar autenticação do socket
  });
  
  // Inscrever em conversas
  socket.on('subscribe', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });
  
  // Desconectar
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

// Número máximo de tentativas de reconexão
const MAX_RETRIES = 5;

// Função para iniciar o servidor
async function startServer() {
  let retries = 0;
  let dbInitialized = false;
  
  // Tentar inicializar o banco de dados com retry
  while (retries < MAX_RETRIES && !dbInitialized) {
    try {
      console.log(`Tentativa ${retries + 1} de ${MAX_RETRIES} para inicializar o banco de dados...`);
      
      // Inicializar banco de dados
      dbInitialized = await initializeDatabase();
      
      if (!dbInitialized) {
        console.error('Falha ao inicializar banco de dados, tentando novamente...');
        retries++;
        // Esperar antes de tentar novamente (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      }
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
      retries++;
      // Esperar antes de tentar novamente (backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, 2000 * retries));
    }
  }
  
  if (!dbInitialized) {
    console.error('Erro ao inicializar banco de dados após várias tentativas. Encerrando aplicação.');
    process.exit(1);
  }
  
  console.log('Banco de dados inicializado com sucesso!');
  
  // Iniciar workers
  try {
    console.log('Inicializando workers...');
    await startAllWorkers();
  } catch (error) {
    console.error('Erro ao iniciar workers:', error);
    console.warn('A aplicação continuará, mas algumas funcionalidades podem estar limitadas.');
  }
  
  // Iniciar servidor HTTP
  server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`API disponível em http://localhost:${PORT}/api`);
    console.log(`Verificar saúde do sistema em http://localhost:${PORT}/health`);
  });
}

// Iniciar servidor
startServer().catch(error => {
  console.error('Erro fatal ao iniciar servidor:', error);
  process.exit(1);
});

// Tratamento de encerramento gracioso
process.on('SIGINT', async () => {
  console.log('Encerrando servidor...');
  try {
    await stopAllWorkers();
    await db.pool.end().catch(() => {});
    console.log('Todos os serviços encerrados corretamente.');
  } catch (error) {
    console.error('Erro ao encerrar serviços:', error);
  } finally {
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  console.log('Encerrando servidor...');
  try {
    await stopAllWorkers();
    await db.pool.end().catch(() => {});
    console.log('Todos os serviços encerrados corretamente.');
  } catch (error) {
    console.error('Erro ao encerrar serviços:', error);
  } finally {
    process.exit(0);
  }
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
  // Não encerrar o processo para garantir que o servidor continue funcionando
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rejeitada não tratada:', reason);
  // Não encerrar o processo para garantir que o servidor continue funcionando
});

module.exports = { app, server, io };
