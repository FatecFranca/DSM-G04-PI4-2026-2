const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetTokenSchema,
  resetPasswordSchema,
  sendVerificationEmailSchema,
  verifyEmailSchema,
  validate
} = require('../validators/auth.validator');

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Fazer logout
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome_completo, email, senha]
 *             properties:
 *               nome_completo:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@example.com
 *               senha:
 *                 type: string
 *                 minLength: 6
 *                 example: senha123
 *               telefone:
 *                 type: string
 *                 nullable: true
 *                 example: "11999999999"
 *               idade:
 *                 type: integer
 *                 nullable: true
 *                 example: 30
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email já cadastrado
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@example.com
 *               senha:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar token JWT usando refresh token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperação de senha
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @route   POST /api/auth/verify-reset-token
 * @desc    Verificar token de recuperação de senha
 * @access  Public
 */
router.post(
  '/verify-reset-token',
  validate(verifyResetTokenSchema),
  authController.verifyResetToken
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Redefinir senha usando token
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/**
 * @route   POST /api/auth/send-verification-email
 * @desc    Enviar email de verificação
 * @access  Public
 */
router.post(
  '/send-verification-email',
  validate(sendVerificationEmailSchema),
  authController.sendVerificationEmailHandler
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verificar email usando token
 * @access  Public
 */
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

module.exports = router;
