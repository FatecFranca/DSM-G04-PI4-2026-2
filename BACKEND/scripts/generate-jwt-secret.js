/**
 * Script para gerar um JWT_SECRET seguro
 * Execute: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

console.log('🔐 Gerando JWT_SECRET seguro...\n');

// Gerar uma chave aleatória de 64 bytes (512 bits) em base64
const jwtSecret = crypto.randomBytes(64).toString('base64');

console.log('✅ JWT_SECRET gerado com sucesso!\n');
console.log('📋 Adicione esta linha no seu arquivo .env:\n');
console.log(`JWT_SECRET=${jwtSecret}\n`);
console.log('⚠️  IMPORTANTE:');
console.log('   - Mantenha este segredo em segurança');
console.log('   - Não compartilhe este valor');
console.log('   - Use um valor diferente em produção');
console.log('   - Se você já tem um JWT_SECRET, não precisa gerar um novo\n');
