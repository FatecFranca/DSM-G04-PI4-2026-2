/**
 * Middleware para rotas não encontradas
 */
const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada: ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

module.exports = notFound;
