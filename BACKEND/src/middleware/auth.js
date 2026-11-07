const crypto = require('crypto');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');

// Corrigido: era BlacklistedToken.findOne({ where: { token_hash } }) — Sequelize
// Agora usa Mongoose: findOne({ token_hash })
const isTokenBlacklisted = async token => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return BlacklistedToken.findOne({ token_hash: tokenHash });
};

/**
 * Middleware de autenticação JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    const token = parts[1];

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token invalidado. Faça login novamente.'
      });
    }

    const decoded = verifyToken(token);

    // Corrigido: era User.findByPk() — Sequelize
    // Agora usa Mongoose: User.findById()
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    req.user = {
      id: user._id,
      email: user.email,
      nome_completo: user.nome_completo
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token inválido ou expirado'
    });
  }
};

/**
 * Middleware opcional de autenticação
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) return next();

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return next();

    const token = parts[1];

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return next();

    const decoded = verifyToken(token);

    // Corrigido: era User.findByPk() — Sequelize
    const user = await User.findById(decoded.userId);

    if (user) {
      req.user = {
        id: user._id,
        email: user.email,
        nome_completo: user.nome_completo
      };
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, optionalAuth };