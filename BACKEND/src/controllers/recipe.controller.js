const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const RecipeRestriction = require('../models/RecipeRestriction');
const RecipeRating = require('../models/RecipeRating');
const RecipeFavorite = require('../models/RecipeFavorite');
const UserRestriction = require('../models/UserRestriction');
const { User, Restriction } = require('../models');
const fs = require('fs');
const path = require('path');
const { saveFile, deleteFile } = require('../services/storageService');
const {
  extractIngredients,
  identifyRestrictionsFromIngredients
} = require('../utils/ingredientParser');
const logger = require('../utils/logger');

/**
 * Listar receitas com paginação, filtros e ordenação
 * GET /api/recipes
 */
const listRecipes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      restrictions,
      compatible,
      status = 'publicada',
      orderBy,
      order,
      sort
    } = req.query;

    const userId = req.user?.id;
    const filter = { status };

    // Busca por nome (regex case-insensitive — equivalente ao iLike do Postgres)
    if (search) {
      filter.nome = { $regex: search, $options: 'i' };
    }

    // Filtro por restrições específicas
    let recipeIdsByRestrictions = null;
    if (restrictions) {
      const restrictionIds = restrictions
        .split(',')
        .map(id => id.trim())
        .filter(id => mongoose.isValidObjectId(id));

      if (restrictionIds.length > 0) {
        const restrictionDocs = await Restriction.find({
          _id: { $in: restrictionIds }
        }).select('palavras_chave');

        const keywords = [];
        restrictionDocs.forEach(r => {
          if (Array.isArray(r.palavras_chave)) {
            keywords.push(...r.palavras_chave.map(k => k.toLowerCase()));
          }
        });

        if (keywords.length > 0) {
          const keywordRegex = keywords.map(k => new RegExp(k, 'i'));
          const recipeRestrictions = await RecipeRestriction.find({
            $or: [
              { ingrediente_restritivo: { $in: keywordRegex } }
            ]
          }).select('recipe_id');

          recipeIdsByRestrictions = [...new Set(recipeRestrictions.map(rr => rr.recipe_id.toString()))];

          if (recipeIdsByRestrictions.length === 0) {
            return res.json({
              success: true,
              data: [],
              meta: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 }
            });
          }
        }
      }
    }

    // Filtro de compatibilidade com restrições do usuário autenticado
    let compatibleRecipeIds = null;
    if (compatible === 'true' && userId) {
      const userRestrictions = await UserRestriction.find({ user_id: userId }).select('restriction_id');
      const userRestrictionIds = userRestrictions.map(ur => ur.restriction_id).filter(Boolean);

      if (userRestrictionIds.length > 0) {
        const conflictingRecipes = await RecipeRestriction.find({
          restriction_id: { $in: userRestrictionIds }
        }).select('recipe_id');

        const conflictingIds = new Set(conflictingRecipes.map(rr => rr.recipe_id.toString()));

        const allRecipes = await Recipe.find({ status: 'publicada' }).select('_id');
        compatibleRecipeIds = allRecipes
          .map(r => r._id.toString())
          .filter(id => !conflictingIds.has(id));

        if (compatibleRecipeIds.length === 0) {
          return res.json({
            success: true,
            data: [],
            meta: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 }
          });
        }
      }
    }

    // Combinar filtros de IDs
    if (recipeIdsByRestrictions !== null || compatibleRecipeIds !== null) {
      let finalIds;
      if (recipeIdsByRestrictions !== null && compatibleRecipeIds !== null) {
        finalIds = recipeIdsByRestrictions.filter(id => compatibleRecipeIds.includes(id));
      } else {
        finalIds = recipeIdsByRestrictions ?? compatibleRecipeIds;
      }

      if (finalIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          meta: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 }
        });
      }

      filter._id = { $in: finalIds };
    }

    // Ordenação
    const sortMap = {
      recent: { created_at: -1 },
      popular: { visualizacoes: -1 },
      rating: { created_at: -1 } // será reordenado após calcular média
    };

    const validOrderByFields = ['created_at', 'nome', 'visualizacoes', 'updated_at'];
    let sortObj;

    if (sort && sortMap[sort.toLowerCase()]) {
      sortObj = sortMap[sort.toLowerCase()];
    } else {
      const field = validOrderByFields.includes(orderBy) ? orderBy : 'created_at';
      const direction = order?.toUpperCase() === 'ASC' ? 1 : -1;
      sortObj = { [field]: direction };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const lim = parseInt(limit);

    const [rows, total] = await Promise.all([
      Recipe.find(filter)
        .populate('user_id', 'id nome_completo email foto_perfil')
        .sort(sortObj)
        .skip(skip)
        .limit(lim),
      Recipe.countDocuments(filter)
    ]);

    // Calcular média de avaliações para cada receita
    const recipeIds = rows.map(r => r._id);
    const ratingsAgg = await RecipeRating.aggregate([
      { $match: { recipe_id: { $in: recipeIds } } },
      {
        $group: {
          _id: '$recipe_id',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);
    const ratingsMap = {};
    ratingsAgg.forEach(r => {
      ratingsMap[r._id.toString()] = {
        averageRating: Math.round(r.averageRating * 10) / 10,
        totalRatings: r.totalRatings
      };
    });

    let recipesWithRatings = rows.map(recipe => {
      const data = recipe.toJSON();
      data.author = data.user_id;
      delete data.user_id;
      const stats = ratingsMap[recipe._id.toString()] || { averageRating: 0, totalRatings: 0 };
      return { ...data, ...stats };
    });

    // Reordenar por rating se solicitado
    if (sort?.toLowerCase() === 'rating') {
      recipesWithRatings.sort((a, b) => {
        if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
        if (b.totalRatings !== a.totalRatings) return b.totalRatings - a.totalRatings;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }

    return res.json({
      success: true,
      data: recipesWithRatings,
      meta: {
        total,
        page: parseInt(page),
        limit: lim,
        totalPages: Math.ceil(total / lim)
      }
    });
  } catch (err) {
    logger.error('Erro ao listar receitas', err);
    return res.status(500).json({ success: false, message: 'Erro ao listar receitas' });
  }
};

/**
 * Obter receita por ID
 * GET /api/recipes/:id
 */
const getRecipeById = async (req, res) => {
  try {
    const recipeId = req.params.id;

    if (!mongoose.isValidObjectId(recipeId)) {
      return res.status(400).json({ success: false, message: 'ID da receita inválido' });
    }

    const userId = req.user?.id;

    const recipe = await Recipe.findById(recipeId).populate(
      'user_id',
      'id nome_completo email foto_perfil'
    );

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receita não encontrada' });
    }

    // Buscar avaliações com dados do usuário
    const ratings = await RecipeRating.find({ recipe_id: recipeId })
      .populate('user_id', 'id nome_completo foto_perfil')
      .sort({ created_at: -1 });

    // Buscar restrições detectadas
    let restrictions = [];
    if (recipe.restricoes_detectadas?.length > 0) {
      const restrictionIds = recipe.restricoes_detectadas
        .map(r => r.restricao_id)
        .filter(id => id && mongoose.isValidObjectId(id));

      let restrictionsMap = {};
      if (restrictionIds.length > 0) {
        const restrictionDocs = await Restriction.find({ _id: { $in: restrictionIds } }).select(
          'id nome categoria palavras_chave'
        );
        restrictionDocs.forEach(r => { restrictionsMap[r._id.toString()] = r; });
      }

      const seenIds = new Set();
      restrictions = recipe.restricoes_detectadas
        .filter(r => {
          if (r.restricao_id && !seenIds.has(r.restricao_id.toString())) {
            seenIds.add(r.restricao_id.toString());
            return true;
          }
          return false;
        })
        .map(r => {
          const rd = restrictionsMap[r.restricao_id?.toString()];
          return {
            ingrediente_restritivo: r.ingrediente,
            palavras_chave: rd?.palavras_chave || r.palavras_chave || [],
            restricao_id: r.restricao_id,
            restricao_nome: r.restricao_nome || rd?.nome || null,
            restriction: rd
              ? { id: rd._id, nome: rd.nome, categoria: rd.categoria, palavras_chave: rd.palavras_chave }
              : null
          };
        });
    } else {
      // Fallback: tabela recipe_restrictions
      const recipeRestrictions = await RecipeRestriction.find({ recipe_id: recipeId }).populate(
        'restriction_id'
      );
      const seenIds = new Set();
      restrictions = recipeRestrictions
        .filter(rr => {
          if (rr.restriction_id && !seenIds.has(rr.restriction_id._id.toString())) {
            seenIds.add(rr.restriction_id._id.toString());
            return true;
          }
          return false;
        })
        .map(rr => ({
          id: rr._id,
          ingrediente_restritivo: rr.ingrediente_restritivo,
          restriction_id: rr.restriction_id?._id,
          restricao_id: rr.restriction_id?._id,
          restricao_nome: rr.restriction_id?.nome || null,
          palavras_chave: rr.restriction_id?.palavras_chave || [],
          restriction: rr.restriction_id
            ? {
                id: rr.restriction_id._id,
                nome: rr.restriction_id.nome,
                categoria: rr.restriction_id.categoria,
                palavras_chave: rr.restriction_id.palavras_chave
              }
            : null
        }));
    }

    // Incrementar visualizações
    try {
      await Recipe.findByIdAndUpdate(recipeId, { $inc: { visualizacoes: 1 } });
    } catch (saveErr) {
      logger.warn('Erro ao incrementar visualizações', saveErr);
    }

    // Calcular média de avaliações
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    // Verificar conflito com restrições do usuário
    let hasRestrictionConflict = false;
    const conflictingRestrictions = [];

    if (userId && restrictions.length > 0) {
      try {
        const userRestrictionsData = await UserRestriction.find({ user_id: userId }).populate(
          'restriction_id',
          'id nome palavras_chave'
        );

        const userKeywords = new Set();
        userRestrictionsData.forEach(ur => {
          const kws = ur.restriction_id?.palavras_chave || [];
          kws.forEach(k => userKeywords.add(k.toLowerCase()));
          (ur.palavras_chave_personalizadas || []).forEach(k => userKeywords.add(k.toLowerCase()));
        });

        restrictions.forEach(rr => {
          const ingrediente = (rr.ingrediente_restritivo || '').toLowerCase();
          const palavrasChave = (rr.palavras_chave || []).map(k => k.toLowerCase());
          const hasMatch =
            userKeywords.has(ingrediente) ||
            palavrasChave.some(pk => userKeywords.has(pk)) ||
            [...userKeywords].some(uk => ingrediente.includes(uk) || palavrasChave.some(pk => pk.includes(uk)));

          if (hasMatch) {
            hasRestrictionConflict = true;
            conflictingRestrictions.push({
              ingredient: rr.ingrediente_restritivo,
              palavrasChave
            });
          }
        });
      } catch (restrictionErr) {
        logger.warn('Erro ao verificar restrições do usuário', restrictionErr);
      }
    }

    const recipeData = recipe.toJSON();
    recipeData.author = recipeData.user_id;
    delete recipeData.user_id;
    recipeData.restrictions = restrictions;
    recipeData.ratings = ratings.map(r => ({
      id: r._id,
      rating: r.rating,
      comentario: r.comentario,
      user: r.user_id
        ? { id: r.user_id._id, nome_completo: r.user_id.nome_completo, foto_perfil: r.user_id.foto_perfil }
        : null,
      created_at: r.created_at
    }));

    return res.json({
      success: true,
      data: {
        ...recipeData,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratings.length,
        hasRestrictionConflict,
        conflictingRestrictions
      }
    });
  } catch (err) {
    logger.error('Erro ao obter receita por ID', err);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter receita',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Criar receita
 * POST /api/recipes
 */
const createRecipe = async (req, res) => {
  try {
    const userId = req.user.id;

    let restriction_ids = req.body.restriction_ids;
    if (restriction_ids) {
      if (!Array.isArray(restriction_ids)) {
        try { restriction_ids = JSON.parse(restriction_ids); }
        catch { restriction_ids = String(restriction_ids).split(',').map(id => id.trim()).filter(Boolean); }
      }
    }

    const { titulo, descricao, ingredientes, modo_preparo, tempo_preparo, rendimento, status } = req.body;

    let imagemUrl = null;
    if (req.file) {
      try {
        const filePath = req.file.path;
        const fileName = path.basename(filePath);
        imagemUrl = await saveFile(filePath, fileName, 'recipe');
        if (req.file.originalPath && req.file.originalPath !== filePath) {
          setTimeout(() => {
            try { if (fs.existsSync(req.file.originalPath)) fs.unlinkSync(req.file.originalPath); }
            catch { /* ignorar */ }
          }, 500);
        }
      } catch (error) {
        logger.error('Erro ao salvar imagem', error);
      }
    }

    let ingredientesArray = [];
    if (Array.isArray(ingredientes)) {
      ingredientesArray = ingredientes;
    } else if (typeof ingredientes === 'string') {
      try { ingredientesArray = JSON.parse(ingredientes); }
      catch { ingredientesArray = ingredientes.split(',').map(i => i.trim()).filter(Boolean); }
    }

    const recipe = await Recipe.create({
      user_id: userId,
      nome: titulo,
      descricao: descricao || null,
      ingredientes: ingredientesArray,
      modo_preparo,
      tempo_preparo: tempo_preparo || null,
      rendimento: rendimento || null,
      imagem_url: imagemUrl,
      status: status || 'rascunho'
    });

    // Detecção automática de restrições
    try {
      const extracted = extractIngredients(ingredientesArray);
      const validIngredients = extracted.filter(ing => ing && ing.length > 0 && ing.length <= 100);

      if (validIngredients.length > 0) {
        const matches = await identifyRestrictionsFromIngredients(validIngredients);

        if (matches?.length > 0) {
          const seenIds = new Set();
          const uniqueMatches = matches.filter(m => {
            if (m.restrictionId && !seenIds.has(m.restrictionId)) {
              seenIds.add(m.restrictionId);
              return true;
            }
            return false;
          });

          const restricoesDetectadas = uniqueMatches.map(m => {
            let ingredienteTexto = (m.ingrediente || '').trim().substring(0, 255);
            return {
              ingrediente: ingredienteTexto,
              palavras_chave: [m.matchedKeyword],
              restricao_id: m.restrictionId,
              restricao_nome: m.restrictionName,
              detectado_em: new Date()
            };
          });

          recipe.restricoes_detectadas = restricoesDetectadas;
          await recipe.save();

          // Salvar também na coleção recipe_restrictions para compatibilidade
          for (const m of uniqueMatches) {
            let ingredienteTexto = (m.ingrediente || '').trim().substring(0, 255);
            if (ingredienteTexto.length > 0) {
              try {
                await RecipeRestriction.create({
                  recipe_id: recipe._id,
                  restriction_id: m.restrictionId || null,
                  ingrediente_restritivo: ingredienteTexto
                });
              } catch (err) {
                logger.warn('Erro ao criar recipe_restriction (não crítico)', err);
              }
            }
          }
        }
      }
    } catch (restrictionErr) {
      logger.warn('Erro ao processar restrições da receita', restrictionErr);
    }

    return res.status(201).json({ success: true, data: recipe });
  } catch (err) {
    logger.error('Erro ao criar receita', err);

    if (req.file) {
      [req.file.processedPath, req.file.path].filter(Boolean).forEach(filePath => {
        setTimeout(() => {
          try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }
          catch (unlinkErr) { logger.error('Erro ao deletar arquivo temporário', unlinkErr); }
        }, 100);
      });
    }

    return res.status(500).json({ success: false, message: 'Erro ao criar receita', error: err.message });
  }
};

/**
 * Atualizar receita
 * PUT /api/recipes/:id
 */
const updateRecipe = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(recipeId)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receita não encontrada' });
    }

    if (recipe.user_id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Não autorizado' });
    }

    const { titulo, descricao, ingredientes, modo_preparo, tempo_preparo, rendimento, status } = req.body;

    if (titulo !== undefined) recipe.nome = titulo;
    if (descricao !== undefined) recipe.descricao = descricao;
    if (modo_preparo !== undefined) recipe.modo_preparo = modo_preparo;
    if (tempo_preparo !== undefined) recipe.tempo_preparo = tempo_preparo;
    if (rendimento !== undefined) recipe.rendimento = rendimento;
    if (status !== undefined) recipe.status = status;

    if (ingredientes !== undefined) {
      let ingredientesArray = [];
      if (Array.isArray(ingredientes)) {
        ingredientesArray = ingredientes;
      } else if (typeof ingredientes === 'string') {
        try { ingredientesArray = JSON.parse(ingredientes); }
        catch { ingredientesArray = ingredientes.split(',').map(i => i.trim()).filter(Boolean); }
      }
      recipe.ingredientes = ingredientesArray;
    }

    if (req.file) {
      if (recipe.imagem_url) {
        try { await deleteFile(recipe.imagem_url); }
        catch (deleteErr) { logger.error('Erro ao deletar imagem antiga', deleteErr); }
      }
      try {
        const fileName = path.basename(req.file.path);
        recipe.imagem_url = await saveFile(req.file.path, fileName, 'recipe');
      } catch (error) {
        logger.error('Erro ao salvar nova imagem', error);
      }
    }

    // Reprocessar restrições
    try {
      const ingredientsArr = Array.isArray(recipe.ingredientes) ? recipe.ingredientes : [];
      const validIngredients = ingredientsArr.filter(ing => ing && ing.length > 0 && ing.length <= 100);

      if (validIngredients.length > 0) {
        const extracted = extractIngredients(validIngredients);
        const matches = await identifyRestrictionsFromIngredients(extracted);

        if (matches?.length > 0) {
          const seenIds = new Set();
          const uniqueMatches = matches.filter(m => {
            if (m.restrictionId && !seenIds.has(m.restrictionId)) {
              seenIds.add(m.restrictionId);
              return true;
            }
            return false;
          });

          recipe.restricoes_detectadas = uniqueMatches.map(m => ({
            ingrediente: (m.ingrediente || '').trim().substring(0, 255),
            palavras_chave: [m.matchedKeyword],
            restricao_id: m.restrictionId,
            restricao_nome: m.restrictionName,
            detectado_em: new Date()
          }));

          // Atualizar recipe_restrictions
          await RecipeRestriction.deleteMany({ recipe_id: recipe._id });
          for (const m of uniqueMatches) {
            const ingredienteTexto = (m.ingrediente || '').trim().substring(0, 255);
            if (ingredienteTexto.length > 0) {
              try {
                await RecipeRestriction.create({
                  recipe_id: recipe._id,
                  restriction_id: m.restrictionId || null,
                  ingrediente_restritivo: ingredienteTexto
                });
              } catch (err) {
                logger.warn('Erro ao criar recipe_restriction (não crítico)', err);
              }
            }
          }
        } else {
          recipe.restricoes_detectadas = [];
          await RecipeRestriction.deleteMany({ recipe_id: recipe._id });
        }
      } else {
        recipe.restricoes_detectadas = [];
        await RecipeRestriction.deleteMany({ recipe_id: recipe._id });
      }
    } catch (restrictionErr) {
      logger.warn('Erro ao processar restrições na atualização', restrictionErr);
    }

    await recipe.save();

    return res.json({ success: true, data: recipe });
  } catch (err) {
    logger.error('Erro ao atualizar receita', err);
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); }
      catch (unlinkErr) { logger.error('Erro ao deletar arquivo', unlinkErr); }
    }
    return res.status(500).json({ success: false, message: 'Erro ao atualizar receita' });
  }
};

/**
 * Deletar receita
 * DELETE /api/recipes/:id
 */
const deleteRecipe = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(recipeId)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receita não encontrada' });
    }

    if (recipe.user_id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Não autorizado' });
    }

    if (recipe.imagem_url) {
      try { await deleteFile(recipe.imagem_url); }
      catch (deleteErr) { logger.error('Erro ao deletar imagem', deleteErr); }
    }

    // Remover documentos relacionados
    await Promise.all([
      RecipeRestriction.deleteMany({ recipe_id: recipe._id }),
      RecipeRating.deleteMany({ recipe_id: recipe._id }),
      RecipeFavorite.deleteMany({ recipe_id: recipe._id })
    ]);

    await Recipe.findByIdAndDelete(recipeId);

    return res.status(204).send();
  } catch (err) {
    logger.error('Erro ao deletar receita', err);
    return res.status(500).json({ success: false, message: 'Erro ao deletar receita' });
  }
};

/**
 * Listar receitas do usuário
 * GET /api/recipes/user
 */
const listUserRecipes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { user_id: userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [rows, total] = await Promise.all([
      Recipe.find(filter).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)),
      Recipe.countDocuments(filter)
    ]);

    return res.json({ success: true, data: rows, meta: { count: total } });
  } catch (err) {
    logger.error('Erro ao listar receitas do usuário', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

/**
 * Listar receitas publicadas do usuário
 * GET /api/recipes/user/published
 */
const listUserPublishedRecipes = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await Recipe.find({ user_id: userId, status: 'publicada' }).sort({ created_at: -1 });
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Erro ao listar receitas publicadas do usuário', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

module.exports = {
  listRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  listUserRecipes,
  listUserPublishedRecipes
};