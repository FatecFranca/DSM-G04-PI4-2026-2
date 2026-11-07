const crypto = require('crypto');

/**
 * Gera um token de recuperação de senha seguro
 * @returns {string} Token aleatório em hexadecimal
 */
const generateResetToken = () => {
  // Gera 32 bytes aleatórios e converte para hexadecimal (64 caracteres)
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Gera data de expiração para o token
 * @param {number} hours - Horas até expirar (padrão: 1 hora)
 * @returns {Date} Data de expiração
 */
const generateExpirationDate = (hours = 1) => {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + hours);
  return expirationDate;
};

/**
 * Verifica se um token está expirado
 * @param {Date} expirationDate - Data de expiração
 * @returns {boolean} true se expirado
 */
const isTokenExpired = (expirationDate) => {
  if (!expirationDate) {
    return true;
  }
  return new Date() > new Date(expirationDate);
};

module.exports = {
  generateResetToken,
  generateExpirationDate,
  isTokenExpired
};

