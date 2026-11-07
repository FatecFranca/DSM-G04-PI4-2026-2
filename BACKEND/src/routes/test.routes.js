const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

/**
 * Rota de teste para verificar se o middleware de autenticação está funcionando
 * GET /api/test/protected
 * @access Private
 */
router.get('/protected', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Rota protegida acessada com sucesso!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
