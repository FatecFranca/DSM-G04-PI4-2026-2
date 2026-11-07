require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'safebite_db'
    });

    const logger = require('../utils/logger');
    logger.info('Conexão com MongoDB estabelecida com sucesso', {
      host: conn.connection.host,
      database: conn.connection.name
    });
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('Erro ao conectar com o MongoDB', error, {
      uri: process.env.MONGODB_URI,
      message: 'Verifique se o MongoDB está rodando e se MONGODB_URI no .env está correto'
    });
    process.exit(1);
  }
};

// Eventos de conexão
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB desconectado');
});

mongoose.connection.on('reconnected', () => {
  console.info('MongoDB reconectado');
});

module.exports = { connectDB };