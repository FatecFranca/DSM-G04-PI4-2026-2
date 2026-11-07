const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { updateProfileSchema, validate } = require('../validators/user.validator');
const { uploadProfilePhoto, validateUpload } = require('../middleware/upload');

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obter perfil do usuário autenticado
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Atualizar perfil do usuário autenticado
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_completo:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 example: João Silva
 *               telefone:
 *                 type: string
 *                 nullable: true
 *                 example: "11999999999"
 *               idade:
 *                 type: integer
 *                 nullable: true
 *                 example: 30
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/profile', authenticate, validate(updateProfileSchema), userController.updateProfile);

/**
 * @route   PUT /api/users/profile/photo
 * @desc    Atualizar foto de perfil
 * @access  Private
 */
router.put(
  '/profile/photo',
  authenticate,
  uploadProfilePhoto,
  validateUpload,
  userController.updateProfilePhoto
);

/**
 * @route   DELETE /api/users/profile/photo
 * @desc    Remover foto de perfil
 * @access  Private
 */
router.delete('/profile/photo', authenticate, userController.removeProfilePhoto);

/**
 * @swagger
 * /users/favorites:
 *   get:
 *     summary: Listar receitas favoritas do usuário
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de receitas favoritas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     favorites:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
const favoriteController = require('../controllers/favorite.controller');
const recipeController = require('../controllers/recipe.controller');

/**
 * @swagger
 * /users/favorites:
 *   get:
 *     summary: Listar receitas favoritas do usuário
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de receitas favoritas
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/favorites', authenticate, favoriteController.listFavorites);

/**
 * @swagger
 * /users/recipes:
 *   get:
 *     summary: Listar receitas do usuário autenticado
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [publicada, rascunho]
 *         description: Filtrar por status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de receitas do usuário
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/recipes', authenticate, recipeController.listUserRecipes);

/**
 * @swagger
 * /users/published-recipes:
 *   get:
 *     summary: Listar receitas publicadas pelo usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de receitas publicadas
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/published-recipes', authenticate, recipeController.listUserPublishedRecipes);

module.exports = router;
