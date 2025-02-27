const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// Função para inicializar o banco de dados
async function initializeDatabase() {
  try {
    console.log('Verificando conexão com o banco de dados...');
    
    // Testar conexão antes de prosseguir
    const connected = await db.testConnection();
    if (!connected) {
      console.error('Não foi possível conectar ao banco de dados. Verifique as configurações.');
      return false;
    }
    
    console.log('Conexão estabelecida. Inicializando esquema do banco de dados...');
    
    // Ler o arquivo de schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`Arquivo de schema não encontrado: ${schemaPath}`);
      return false;
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir o schema em instruções individuais
    // Isso ajuda a executar cada comando separadamente e evitar erros de EOF
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Executar cada instrução individualmente
    for (const statement of statements) {
      try {
        await db.query(`${statement};`);
      } catch (error) {
        // Se a tabela já existir, podemos ignorar o erro
        if (!error.message.includes('already exists')) {
          console.error(`Erro ao executar instrução SQL: ${statement.substring(0, 100)}...`);
          console.error(error);
          // Continue a execução mesmo com erros
        }
      }
    }
    
    console.log('Banco de dados inicializado com sucesso!');
    
    // Verificar se já existe um usuário admin, se não, criar um
    try {
      const adminCheck = await db.query('SELECT * FROM users WHERE username = $1', ['admin']);
      
      if (adminCheck.rows.length === 0) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        await db.query(
          'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4)',
          ['admin', hashedPassword, 'admin@example.com', 'admin']
        );
        
        console.log('Usuário admin criado com sucesso!');
      } else {
        console.log('Usuário admin já existe.');
      }
    } catch (error) {
      console.error('Erro ao verificar ou criar usuário admin:', error);
      // Continuar mesmo se não conseguir criar o usuário admin
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    return false;
  }
}

// Exportar a função para ser chamada no início da aplicação
module.exports = { initializeDatabase };

// Se este arquivo for executado diretamente, inicializar o banco de dados
if (require.main === module) {
  initializeDatabase()
    .then((success) => {
      console.log(`Inicialização ${success ? 'bem-sucedida' : 'falhou'}.`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Erro fatal durante a inicialização:', error);
      process.exit(1);
    });
}
