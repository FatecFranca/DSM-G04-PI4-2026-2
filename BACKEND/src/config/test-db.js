require('dotenv').config();
const { testConnection, sequelize } = require('./database');

const test = async () => {
  console.log('🧪 Testando conexão com o banco de dados...');
  console.log(`📊 Configuração:`);
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}`);
  console.log('');

  await testConnection();

  // Fechar conexão
  await sequelize.close();
  console.log('🔌 Conexão fechada.');
  process.exit(0);
};

test();
