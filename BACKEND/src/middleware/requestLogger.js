/**
 * Middleware de logging de requisições HTTP
 */
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log da requisição recebida
  logger.debug('Requisição recebida', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });

  // Interceptar o método end() da resposta
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - startTime;

    // Log da resposta
    logger.http(req, res, responseTime);

    // Chamar o método original
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = requestLogger;

