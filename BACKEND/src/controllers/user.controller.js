const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Obter perfil do usuário autenticado
 * GET /api/users/profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const photoUrl = user.foto_perfil ? `${baseUrl}${user.foto_perfil}` : null;

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          nome_completo: user.nome_completo,
          email: user.email,
          telefone: user.telefone,
          idade: user.idade,
          foto_perfil: photoUrl,
          tem_restricao: user.tem_restricao,
          email_verificado: user.email_verificado,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao obter perfil', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Atualizar perfil do usuário autenticado
 * PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nome_completo, telefone, idade } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    const updateData = {};
    if (nome_completo !== undefined) updateData.nome_completo = nome_completo;
    if (telefone !== undefined) updateData.telefone = telefone || null;
    if (idade !== undefined) updateData.idade = idade || null;

    // { new: true } retorna o documento já atualizado
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true
    });

    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const photoUrl = updatedUser.foto_perfil ? `${baseUrl}${updatedUser.foto_perfil}` : null;

    return res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: {
          id: updatedUser._id,
          nome_completo: updatedUser.nome_completo,
          email: updatedUser.email,
          telefone: updatedUser.telefone,
          idade: updatedUser.idade,
          foto_perfil: photoUrl,
          email_verificado: updatedUser.email_verificado,
          updated_at: updatedUser.updated_at
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar perfil', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ success: false, message: 'Erro de validação', errors });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Atualizar foto de perfil
 * PUT /api/users/profile/photo
 */
const updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    // Deletar foto antiga se existir
    if (user.foto_perfil) {
      const oldPhotoPath = path.join(
        process.env.UPLOAD_PATH || './uploads',
        path.basename(user.foto_perfil)
      );
      if (fs.existsSync(oldPhotoPath)) {
        try { fs.unlinkSync(oldPhotoPath); } catch (err) {
          logger.error('Erro ao deletar foto antiga', err);
        }
      }
    }

    const photoPath = `/uploads/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { foto_perfil: photoPath },
      { new: true }
    );

    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const photoUrl = updatedUser.foto_perfil ? `${baseUrl}${updatedUser.foto_perfil}` : null;

    return res.json({
      success: true,
      message: 'Foto de perfil atualizada com sucesso',
      data: {
        user: {
          id: updatedUser._id,
          foto_perfil: photoUrl,
          foto_perfil_path: updatedUser.foto_perfil
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar foto de perfil', error);

    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (err) {
        logger.error('Erro ao deletar arquivo após erro', err);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar foto de perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Remover foto de perfil
 * DELETE /api/users/profile/photo
 */
const removeProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    if (user.foto_perfil) {
      const oldPhotoPath = path.join(
        process.env.UPLOAD_PATH || './uploads',
        path.basename(user.foto_perfil)
      );
      if (fs.existsSync(oldPhotoPath)) {
        try { fs.unlinkSync(oldPhotoPath); } catch (err) {
          logger.error('Erro ao deletar foto', err);
        }
      }
    }

    await User.findByIdAndUpdate(userId, { foto_perfil: null });

    return res.json({
      success: true,
      message: 'Foto de perfil removida com sucesso',
      data: { user: { id: userId, foto_perfil: null } }
    });
  } catch (error) {
    logger.error('Erro ao remover foto de perfil', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao remover foto de perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { getProfile, updateProfile, updateProfilePhoto, removeProfilePhoto };