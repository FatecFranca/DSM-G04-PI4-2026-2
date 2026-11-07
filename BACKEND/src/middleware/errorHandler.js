/**
 * Middleware de tratamento de erros padronizado
 */
const logger = require('../utils/logger');
const { getErrorMessage } = require('../utils/errorMessages');

const errorHandler = (err, req, res, _next) => {
  // Log do erro com informações da requisição
  logger.error('Erro na requisição', err, {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    body: process.env.NODE_ENV === 'development' ? req.body : undefined
  });

  // Determinar status code
  const statusCode = err.status || err.statusCode || 500;

  // Resposta padronizada
  const response = {
    success: false,
    message: err.message || getErrorMessage('INTERNAL_ERROR'),
    ...(err.code && { code: err.code }),
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err.name
    })
  };

  // Tratamento específico por tipo de erro
  if (err.name === 'ValidationError' || err.name === 'MongoServerError' && err.code === 11000) {
    response.message = getErrorMessage('VALIDATION_ERROR');
    response.errors = err.errors || err.details || [err.message];
    return res.status(400).json(response);
  }

  if (
    err.name === 'UnauthorizedError' ||
    err.name === 'JsonWebTokenError' ||
    err.name === 'TokenExpiredError'
  ) {
    response.message = getErrorMessage('UNAUTHORIZED');
    return res.status(401).json(response);
  }

  if (err.code === 11000) {
    response.message = getErrorMessage('ALREADY_EXISTS');
    if (err.errors && err.errors[0]?.path === 'email') {
      response.message = getErrorMessage('EMAIL_ALREADY_EXISTS');
    }
    return res.status(409).json(response);
  }

  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    response.message = getErrorMessage('DATABASE_ERROR');
    return res.status(500).json(response);
  }

  if (statusCode === 404) {
    response.message = getErrorMessage('NOT_FOUND');
    return res.status(404).json(response);
  }

  if (statusCode === 403) {
    response.message = getErrorMessage('FORBIDDEN');
    return res.status(403).json(response);
  }

  // Erro padrão do servidor
  res.status(statusCode).json(response);
};

module.exports = errorHandler;