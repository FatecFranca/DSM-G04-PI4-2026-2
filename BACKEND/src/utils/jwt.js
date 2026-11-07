const jwt = require('jsonwebtoken');

/**
 * Gera um token JWT
 * @param {Object} payload - Dados a serem incluídos no token
 * @param {string} expiresIn - Tempo de expiração (ex: '24h', '7d')
 * @returns {string} Token JWT
 */
const generateToken = (payload, expiresIn = null) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado nas variáveis de ambiente');
  }

  const options = {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '24h'
  };

  return jwt.sign(payload, secret, options);
};

/**
 * Gera um refresh token JWT
 * @param {Object} payload - Dados a serem incluídos no token
 * @returns {string} Refresh token JWT
 */
const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado nas variáveis de ambiente');
  }

  // Refresh token expira em 7 dias
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

/**
 * Verifica e decodifica um token JWT
 * @param {string} token - Token JWT
 * @returns {Object} Payload decodificado
 * @throws {Error} Se o token for inválido ou expirado
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado nas variáveis de ambiente');
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    } else {
      throw new Error('Erro ao verificar token');
    }
  }
};

/**
 * Decodifica um token JWT sem verificar (útil para debug)
 * @param {string} token - Token JWT
 * @returns {Object} Payload decodificado
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken
};

