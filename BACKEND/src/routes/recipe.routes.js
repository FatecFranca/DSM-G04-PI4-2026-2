const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const recipeController = require('../controllers/recipe.controller');
const {
  uploadRecipeImage,
  validateUploadOptional,
  processUploadedImage
} = require('../middleware/upload');
const {
  createRecipeSchema,
  updateRecipeSchema,
  validate
} = require('../validators/recipe.validator');
const ratingRoutes = require('./ratings.routes');
const favoriteRoutes = require('./favorite.routes');

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Listar receitas com paginação, filtros e ordenação
 *     tags: [Receitas]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou descrição
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [publicada, rascunho]
 *           default: publicada
 *         description: Status da receita
 *     responses:
 *       200:
 *         description: Lista de receitas
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
 *                     recipes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Recipe'
 *                     pagination:
 *                       type: object
 */
router.get('/', optionalAuth, recipeController.listRecipes);

// Rotas de avaliações (ratings) - devem vir antes de /:id para evitar conflitos
router.use('/', ratingRoutes);

// Rotas de favoritos - devem vir antes de /:id para evitar conflitos
router.use('/', favoriteRoutes);

/**
 * @route   GET /api/recipes/:id
 * @desc    Obter receita por ID (com autor, avaliações e verificação de restrições)
 * @access  Public (autenticação opcional para verificar restrições do usuário)
 */
router.get('/:id', optionalAuth, recipeController.getRecipeById);

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Criar receita
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [titulo, ingredientes, modo_preparo]
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Bolo de Chocolate
 *               descricao:
 *                 type: string
 *                 example: Delicioso bolo caseiro
 *               ingredientes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["farinha", "açúcar", "chocolate"]
 *               modo_preparo:
 *                 type: string
 *                 example: Misture todos os ingredientes...
 *               tempo_preparo:
 *                 type: string
 *                 example: 30 minutos
 *               rendimento:
 *                 type: string
 *                 example: 4 porções
 *               status:
 *                 type: string
 *                 enum: [publicada, rascunho]
 *                 example: publicada
 *               imagem:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Receita criada com sucesso
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/',
  authenticate,
  uploadRecipeImage,
  validateUploadOptional,
  processUploadedImage,
  validate(createRecipeSchema),
  recipeController.createRecipe
);

/**
 * @route   PUT /api/recipes/:id
 * @desc    Atualizar receita
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  uploadRecipeImage,
  validateUploadOptional,
  processUploadedImage,
  validate(updateRecipeSchema),
  recipeController.updateRecipe
);

/**
 * @route   DELETE /api/recipes/:id
 * @desc    Deletar receita
 * @access  Private
 */
router.delete('/:id', authenticate, recipeController.deleteRecipe);

module.exports = router;
