const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const favoriteController = require('../controllers/favorite.controller');

/**
 * @swagger
 * /recipes/{id}/favorite:
 *   post:
 *     summary: Adicionar receita aos favoritos
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da receita
 *     responses:
 *       201:
 *         description: Receita adicionada aos favoritos
 *       404:
 *         description: Receita não encontrada
 *       409:
 *         description: Receita já está nos favoritos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/favorite', authenticate, favoriteController.addFavorite);

/**
 * @swagger
 * /recipes/{id}/favorite:
 *   delete:
 *     summary: Remover receita dos favoritos
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da receita
 *     responses:
 *       200:
 *         description: Receita removida dos favoritos
 *       404:
 *         description: Receita não está nos favoritos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/:id/favorite', authenticate, favoriteController.removeFavorite);

/**
 * @swagger
 * /recipes/{id}/favorite:
 *   get:
 *     summary: Verificar se receita está nos favoritos
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da receita
 *     responses:
 *       200:
 *         description: Status do favorito
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
 *                     isFavorite:
 *                       type: boolean
 *                     favoriteId:
 *                       type: integer
 *                       nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id/favorite', authenticate, favoriteController.checkFavorite);

module.exports = router;

