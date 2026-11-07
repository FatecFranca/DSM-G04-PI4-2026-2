const bcrypt = require('bcrypt');

/**
 * Gera hash da senha usando bcrypt
 * @param {string} password - Senha em texto plano
 * @returns {Promise<string>} Hash da senha
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compara senha em texto plano com hash
 * @param {string} password - Senha em texto plano
 * @param {string} hash - Hash da senha
 * @returns {Promise<boolean>} true se a senha corresponder ao hash
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword
};

