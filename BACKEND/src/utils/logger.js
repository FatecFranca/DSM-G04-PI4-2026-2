/**
 * Sistema de logging estruturado
 */

const fs = require('fs');
const path = require('path');

// Criar diretório de logs se não existir
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Formatar timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Formatar mensagem de log
 */
const formatLog = (level, message, meta = {}) => {
  const log = {
    timestamp: getTimestamp(),
    level,
    message,
    ...meta
  };

  return JSON.stringify(log);
};

/**
 * Escrever log em arquivo
 */
const writeLog = (level, message, meta = {}) => {
  const logMessage = formatLog(level, message, meta);
  const logFile = path.join(logsDir, `${level}.log`);
  const allLogsFile = path.join(logsDir, 'all.log');

  // Escrever em arquivo específico do nível
  fs.appendFileSync(logFile, logMessage + '\n', 'utf8');
  // Escrever em arquivo geral
  fs.appendFileSync(allLogsFile, logMessage + '\n', 'utf8');
};

/**
 * Logger com diferentes níveis
 */
const logger = {
  /**
   * Log de informação
   */
  info: (message, meta = {}) => {
    const formatted = formatLog('INFO', message, meta);
    console.log(`[INFO] ${message}`, meta && Object.keys(meta).length > 0 ? meta : '');
    if (process.env.NODE_ENV === 'production') {
      writeLog('info', message, meta);
    }
  },

  /**
   * Log de erro
   */
  error: (message, error = null, meta = {}) => {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      })
    };

    const formatted = formatLog('ERROR', message, errorMeta);
    console.error(`[ERROR] ${message}`, error || '');
    if (error && error.stack && process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }

    // Sempre escrever erros em arquivo
    writeLog('error', message, errorMeta);
  },

  /**
   * Log de aviso
   */
  warn: (message, meta = {}) => {
    const formatted = formatLog('WARN', message, meta);
    console.warn(`[WARN] ${message}`, meta && Object.keys(meta).length > 0 ? meta : '');
    if (process.env.NODE_ENV === 'production') {
      writeLog('warn', message, meta);
    }
  },

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const formatted = formatLog('DEBUG', message, meta);
      console.debug(`[DEBUG] ${message}`, meta && Object.keys(meta).length > 0 ? meta : '');
    }
  },

  /**
   * Log de requisição HTTP
   */
  http: (req, res, responseTime) => {
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    const level = res.statusCode >= 400 ? 'error' : 'info';
    const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`;

    if (level === 'error') {
      logger.error(message, null, logData);
    } else {
      logger.info(message, logData);
    }
  }
};

module.exports = logger;

