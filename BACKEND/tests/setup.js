/**
 * Configuração global para testes
 */
require('dotenv').config({ path: '.env.test' });

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt';
process.env.DB_NAME = process.env.DB_TEST_NAME || 'safebite_test_db';

// Limpar console antes dos testes
console.log('\n🧪 Iniciando testes...\n');

