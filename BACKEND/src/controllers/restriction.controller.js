const mongoose = require('mongoose');
const { Restriction, UserRestriction } = require('../models');
const logger = require('../utils/logger');

/**
 * Listar todas as restrições
 * GET /api/restrictions
 */
const getAllRestrictions = async (req, res) => {
  try {
    const { q } = req.query;

    // Regex case-insensitive equivale ao iLike do Postgres
    const filter = q
      ? {
          $or: [
            { nome: { $regex: q, $options: 'i' } },
            { palavras_chave: { $elemMatch: { $regex: q, $options: 'i' } } }
          ]
        }
      : {};

    const list = await Restriction.find(filter).sort({ nome: 1 });
    return res.json({ success: true, data: list });
  } catch (err) {
    logger.error('Erro ao obter todas as restrições', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

/**
 * Obter restrições do usuário autenticado
 * GET /api/restrictions/user
 */
const getUserRestrictions = async (req, res) => {
  try {
    const userId = req.user.id;

    const userRestrictions = await UserRestriction.find({ user_id: userId }).populate(
      'restriction_id',
      'id nome categoria palavras_chave'
    );

    const restrictionsData = userRestrictions.map(ur => ({
      id: ur._id,
      user_id: ur.user_id,
      restriction_id: ur.restriction_id?._id,
      palavras_chave_personalizadas: ur.palavras_chave_personalizadas || [],
      created_at: ur.created_at,
      restriction: ur.restriction_id
        ? {
            id: ur.restriction_id._id,
            nome: ur.restriction_id.nome,
            categoria: ur.restriction_id.categoria,
            palavras_chave: ur.restriction_id.palavras_chave || []
          }
        : null
    }));

    return res.json({ success: true, data: restrictionsData });
  } catch (err) {
    logger.error('Erro ao obter restrições do usuário', err);
    return res.status(500).json({
      success: false,
      message: 'Erro interno',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Adicionar restrição ao usuário
 * POST /api/restrictions/user
 */
const addUserRestriction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { restriction_id, nome, palavras_chave } = req.body;

    if (restriction_id) {
      // Associar restrição existente
      if (!mongoose.isValidObjectId(restriction_id)) {
        return res.status(400).json({ success: false, message: 'restriction_id inválido' });
      }

      const r = await Restriction.findById(restriction_id);
      if (!r) {
        return res.status(404).json({ success: false, message: 'Restrição não encontrada' });
      }

      const exists = await UserRestriction.findOne({ user_id: userId, restriction_id });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Restrição já associada' });
      }

      const ur = await UserRestriction.create({ user_id: userId, restriction_id });
      return res.status(201).json({ success: true, data: ur });
    } else {
      // Criar nova restrição global e associar ao usuário
      if (!nome) {
        return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
      }

      const newR = await Restriction.create({
        nome,
        categoria: req.body.categoria || 'outros',
        palavras_chave: Array.isArray(palavras_chave) ? palavras_chave : []
      });

      const ur = await UserRestriction.create({ user_id: userId, restriction_id: newR._id });
      return res.status(201).json({
        success: true,
        data: { restriction: newR, userRestriction: ur }
      });
    }
  } catch (err) {
    logger.error('Erro ao adicionar restrição ao usuário', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

/**
 * Remover restrição do usuário
 * DELETE /api/restrictions/user/:id
 */
const deleteUserRestriction = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const ur = await UserRestriction.findById(id);
    if (!ur) {
      return res.status(404).json({ success: false, message: 'Associação não encontrada' });
    }

    if (ur.user_id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Não autorizado' });
    }

    await UserRestriction.findByIdAndDelete(id);
    return res.status(204).send();
  } catch (err) {
    logger.error('Erro ao deletar restrição do usuário', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

/**
 * Atualizar restrição do usuário (palavras-chave personalizadas)
 * PUT /api/restrictions/user/:id
 */
const updateUserRestriction = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const { palavras_chave_personalizadas } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const ur = await UserRestriction.findById(id);
    if (!ur) {
      return res.status(404).json({ success: false, message: 'Associação não encontrada' });
    }

    if (ur.user_id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Não autorizado' });
    }

    if (palavras_chave_personalizadas !== undefined) {
      ur.palavras_chave_personalizadas = Array.isArray(palavras_chave_personalizadas)
        ? palavras_chave_personalizadas
        : String(palavras_chave_personalizadas).split(',').map(k => k.trim()).filter(Boolean);
    }

    await ur.save();
    return res.json({ success: true, data: ur });
  } catch (err) {
    logger.error('Erro ao atualizar restrição do usuário', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

module.exports = {
  getAllRestrictions,
  getUserRestrictions,
  addUserRestriction,
  deleteUserRestriction,
  updateUserRestriction
};