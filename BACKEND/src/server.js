require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database'); // ← Mongoose
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { sanitizeInput } = require('./middleware/sanitize');
const requestLogger = require('./middleware/requestLogger');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http://localhost:*', 'http://127.0.0.1:*'],
        connectSrc: ["'self'", 'http://localhost:*', 'http://127.0.0.1:*'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Configuração de CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'file://'
    ];

    if (process.env.CORS_ORIGIN) {
      allowedOrigins.push(process.env.CORS_ORIGIN);
    }

    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      if (
        origin.match(/^http:\/\/localhost:\d+$/) ||
        origin.match(/^http:\/\/127\.0\.0\.1:\d+$/) ||
        origin.startsWith('file://') ||
        origin.startsWith('null')
      ) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        console.warn(`⚠️  CORS: Origem não listada, mas permitindo em desenvolvimento: ${origin}`);
        callback(null, true);
      } else {
        callback(new Error('Não permitido pelo CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(sanitizeInput);

// Servir arquivos estáticos
const path = require('path');
app.use(
  '/uploads',
  (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
    next();
  },
  express.static(path.join(__dirname, '../uploads'))
);

// Rate limiting
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isDevelopment ? 1000 : 100),
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente mais tarde.',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment && req.path === '/health'
});
app.use('/api/', limiter);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'SafeBite API - Backend',
    version: '1.0.0',
    status: 'running',
    documentation: '/api-docs'
  });
});

// Documentação Swagger
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SafeBite API Documentation'
  })
);

// Rotas da API
app.use('/api', routes);

// Middlewares de erro
app.use(notFound);
app.use(errorHandler);

// Seed automático: popula restrições alimentares se o banco estiver vazio
const autoSeed = async () => {
  try {
    const Restriction = require('./models/Restriction');
    const count = await Restriction.countDocuments();
    if (count === 0) {
      const { execSync } = require('child_process');
      console.log('🌱 Banco vazio — populando restrições alimentares...');
      execSync('node src/config/seed.js', { stdio: 'inherit', cwd: require('path').join(__dirname, '..') });
    }
  } catch (err) {
    console.warn('⚠️  Seed automático falhou (não crítico):', err.message);
  }
};

// Iniciar servidor após conectar ao MongoDB
const startServer = async () => {
  await connectDB(); // ← Conecta ao MongoDB antes de abrir o servidor
  await autoSeed();  // ← Popula restrições se banco estiver vazio

  app.listen(PORT, () => {
    logger.info('Servidor iniciado', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    });

    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🍃 Banco: MongoDB`);
    console.log(`🌐 CORS: Configurado para aceitar localhost (desenvolvimento)`);
    if (process.env.CORS_ORIGIN) {
      console.log(`   Origem adicional: ${process.env.CORS_ORIGIN}`);
    }
    console.log(`📚 Documentação: http://localhost:${PORT}/api-docs`);
  });
};

startServer();

module.exports = app;