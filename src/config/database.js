const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexões
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pandora_3_1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo máximo que uma conexão pode ficar inativa
  connectionTimeoutMillis: 5000, // Tempo máximo para estabelecer uma conexão
});

// Manipulador de erros do pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões do PostgreSQL:', err);
});

// Função para testar a conexão
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Conexão com o banco de dados estabelecida:', result.rows[0]);
    return true;
  } catch (err) {
    console.error('Erro na conexão com o banco de dados:', err);
    return false;
  } finally {
    if (client) client.release();
  }
};

// Executar teste de conexão
testConnection();

// Função para executar queries
const query = async (text, params) => {
  const start = Date.now();
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn('Query lenta:', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (err) {
    console.error('Erro ao executar query:', err);
    throw err;
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  query,
  pool,
  testConnection
};
