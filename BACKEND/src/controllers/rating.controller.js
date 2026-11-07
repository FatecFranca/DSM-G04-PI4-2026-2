const mongoose = require('mongoose');
const RecipeRating = require('../models/RecipeRating');
const Recipe = require('../models/Recipe');
const logger = require('../utils/logger');

/**
 * Criar avaliação
 * POST /api/recipes/:id/ratings
 */
const createRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.id;
    const { rating, comment } = req.body;

    const rVal = parseInt(rating, 10);
    if (!rVal || rVal < 1 || rVal > 5) {
      return res.status(400).json({ success: false, message: 'rating inválido (1-5)' });
    }

    const exists = await RecipeRating.findOne({ user_id: userId, recipe_id: recipeId });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Usuário já avaliou. Use PUT para atualizar' });
    }

    const created = await RecipeRating.create({
      user_id: userId,
      recipe_id: recipeId,
      rating: rVal,
      comentario: comment
    });

    // Recalcular média e atualizar na receita
    const stats = await RecipeRating.aggregate([
      { $match: { recipe_id: new mongoose.Types.ObjectId(recipeId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (stats.length > 0) {
      await Recipe.findByIdAndUpdate(recipeId, {
        average_rating: stats[0].avg,
        rating_count: stats[0].count
      });
    }

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    logger.error('Erro ao criar avaliação', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

/**
 * Atualizar avaliação
 * PUT /api/recipes/:id/ratings
 */
const updateRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.id;
    const { rating, comment } = req.body;

    const rVal = rating !== undefined ? parseInt(rating, 10) : undefined;
    if (rVal !== undefined && (rVal < 1 || rVal > 5)) {
      return res.status(400).json({ success: false, message: 'rating inválido (1-5)' });
    }

    const existing = await RecipeRating.findOne({ user_id: userId, recipe_id: recipeId });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });
    }

    if (rVal !== undefined) existing.rating = rVal;
    if (comment !== undefined) existing.comentario = comment;
    await existing.save();

    // Recalcular média
    const stats = await RecipeRating.aggregate([
      { $match: { recipe_id: new mongoose.Types.ObjectId(recipeId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (stats.length > 0) {
      await Recipe.findByIdAndUpdate(recipeId, {
        average_rating: stats[0].avg,
        rating_count: stats[0].count
      });
    }

    return res.json({ success: true, data: existing });
  } catch (err) {
    logger.error('Erro ao atualizar avaliação', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

/**
 * Deletar avaliação
 * DELETE /api/recipes/:id/ratings
 */
const deleteRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.id;

    const existing = await RecipeRating.findOne({ user_id: userId, recipe_id: recipeId });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });
    }

    await RecipeRating.findByIdAndDelete(existing._id);

    // Recalcular média
    const stats = await RecipeRating.aggregate([
      { $match: { recipe_id: new mongoose.Types.ObjectId(recipeId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    await Recipe.findByIdAndUpdate(recipeId, {
      average_rating: stats.length > 0 ? stats[0].avg : 0,
      rating_count: stats.length > 0 ? stats[0].count : 0
    });

    return res.status(204).send();
  } catch (err) {
    logger.error('Erro ao deletar avaliação', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

/**
 * Obter avaliações de uma receita
 * GET /api/recipes/:id/ratings
 */
const getRatings = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [total, rows] = await Promise.all([
      RecipeRating.countDocuments({ recipe_id: recipeId }),
      RecipeRating.find({ recipe_id: recipeId })
        .populate('user_id', 'id nome_completo')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
    ]);

    const recipe = await Recipe.findById(recipeId).select('average_rating rating_count');
    const meta = {
      average: recipe?.average_rating || 0,
      count: recipe?.rating_count || total
    };

    return res.json({ success: true, data: rows, meta });
  } catch (err) {
    logger.error('Erro ao obter avaliações', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

module.exports = { createRating, updateRating, deleteRating, getRatings };