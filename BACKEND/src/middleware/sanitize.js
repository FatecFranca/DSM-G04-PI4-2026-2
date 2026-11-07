/**
 * Middleware de sanitização de dados
 * Remove tags HTML e caracteres perigosos
 */

/**
 * Sanitiza string removendo tags HTML e caracteres perigosos
 * @param {string} str - String a ser sanitizada
 * @returns {string} - String sanitizada
 */
const sanitizeString = str => {
  if (typeof str !== 'string') return str;

  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]+>/g, '') // Remove todas as tags HTML
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onload, etc.)
    .trim();
};

/**
 * Sanitiza objeto recursivamente
 * @param {any} data - Dados a serem sanitizados
 * @returns {any} - Dados sanitizados
 */
const sanitizeObject = data => {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeObject(item));
  }

  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = sanitizeObject(data[key]);
      }
    }
    return sanitized;
  }

  return data;
};

/**
 * Middleware para sanitizar dados de entrada
 * Aplica sanitização básica em req.body, req.query e req.params
 */
const sanitizeInput = (req, res, next) => {
  // Sanitizar req.body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitizar req.query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitizar req.params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeInput
};

