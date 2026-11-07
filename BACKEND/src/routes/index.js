const express = require('express');
const router = express.Router();

// Importar rotas
const recipeRoutes = require('./recipe.routes');
const authRoutes = require('./auth.routes');
const testRoutes = require('./test.routes');
const userRoutes = require('./user.routes');
const restrictionRoutes = require('./restriction.routes');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verificar saúde da API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Tempo de atividade em segundos
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rotas da API
router.use('/auth', authRoutes);
router.use('/test', testRoutes);
router.use('/users', userRoutes);
router.use('/recipes', recipeRoutes);
router.use('/restrictions', restrictionRoutes);

module.exports = router;
