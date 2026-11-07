const mongoose = require('mongoose');
const RecipeFavorite = require('../models/RecipeFavorite');
const Recipe = require('../models/Recipe');
const logger = require('../utils/logger');

/**
 * Adicionar receita aos favoritos
 * POST /api/recipes/:id/favorite
 */
const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.id;

    if (!mongoose.isValidObjectId(recipeId)) {
      return res.status(400).json({ success: false, message: 'ID da receita inválido' });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receita não encontrada' });
    }

    const existing = await RecipeFavorite.findOne({ user_id: userId, recipe_id: recipeId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Receita já está nos favoritos' });
    }

    const favorite = await RecipeFavorite.create({ user_id: userId, recipe_id: recipeId });

    return res.status(201).json({
      success: true,
      message: 'Receita adicionada aos favoritos',
      data: favorite
    });
  } catch (error) {
    logger.error('Erro ao adicionar favorito', error);
    return res.status(500).json({ success: false, message: 'Erro ao adicionar favorito' });
  }
};

/**
 * Remover receita dos favoritos
 * DELETE /api/recipes/:id/favorite
 */
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.id;

    const favorite = await RecipeFavorite.findOne({ user_id: userId, recipe_id: recipeId });
    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Receita não está nos favoritos' });
    }

    await RecipeFavorite.findByIdAndDelete(favorite._id);

    return res.json({ success: true, message: 'Receita removida dos favoritos' });
  } catch (error) {
    logger.error('Erro ao remover favorito', error);
    return res.status(500).json({ success: false, message: 'Erro ao remover favorito' });
  }
};

/**
 * Listar receitas favoritas do usuário
 * GET /api/users/favorites
 */
const listFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [total, rows] = await Promise.all([
      RecipeFavorite.countDocuments({ user_id: userId }),
      RecipeFavorite.find({ user_id: userId })
        .populate({
          path: 'recipe_id',
          populate: { path: 'user_id', select: 'id nome_completo foto_perfil' }
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
    ]);

    const favorites = rows.map(fav => ({
      id: fav._id,
      recipe: fav.recipe_id,
      added_at: fav.created_at
    }));

    return res.json({
      success: true,
      data: {
        favorites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao listar favoritos', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar favoritos' });
  }
};

/**
 * Verificar se receita está nos favoritos
 * GET /api/recipes/:id/favorite
 */
const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.id;

    const favorite = await RecipeFavorite.findOne({ user_id: userId, recipe_id: recipeId });

    return res.json({
      success: true,
      data: {
        isFavorite: !!favorite,
        favoriteId: favorite?._id || null
      }
    });
  } catch (error) {
    logger.error('Erro ao verificar favorito', error);
    return res.status(500).json({ success: false, message: 'Erro ao verificar favorito' });
  }
};

module.exports = { addFavorite, removeFavorite, listFavorites, checkFavorite };