const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const {
  generateResetToken,
  generateExpirationDate,
  isTokenExpired
} = require('../utils/resetToken');
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail
} = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * Registro de novo usuário
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    logger.info('Body completo recebido:', JSON.stringify(req.body));

    const { nome_completo, email, senha, telefone, idade, tem_restricao } = req.body;

    // Verificar se email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Este email já está cadastrado' });
    }

    const senha_hash = await hashPassword(senha);
    const verificationToken = generateResetToken();
    const expirationDate = generateExpirationDate(24);

    // Converter tem_restricao para boolean
    let temRestricaoValue = false;
    if (tem_restricao !== undefined && tem_restricao !== null) {
      if (typeof tem_restricao === 'boolean') temRestricaoValue = tem_restricao;
      else if (typeof tem_restricao === 'string')
        temRestricaoValue = tem_restricao.toLowerCase() === 'true' || tem_restricao === '1';
      else if (typeof tem_restricao === 'number') temRestricaoValue = tem_restricao === 1;
    }

    const user = await User.create({
      nome_completo,
      email,
      senha_hash,
      telefone: telefone || null,
      idade: idade || null,
      tem_restricao: temRestricaoValue,
      token_verificacao_email: verificationToken,
      data_expiracao_token: expirationDate
    });

    logger.info('Usuário criado', { userId: user._id, email: user.email });

    sendWelcomeEmail(user.email, user.nome_completo).catch(err =>
      logger.error('Erro ao enviar email de boas-vindas', err)
    );
    sendVerificationEmail(user.email, verificationToken).catch(err =>
      logger.error('Erro ao enviar email de verificação', err)
    );

    const token = generateToken({ userId: user._id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id, email: user.email });

    return res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: {
          id: user._id,
          nome_completo: user.nome_completo,
          email: user.email,
          telefone: user.telefone,
          idade: user.idade,
          tem_restricao: user.tem_restricao,
          email_verificado: user.email_verificado,
          created_at: user.created_at
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Erro no registro', error);

    // Erro de validação do Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ success: false, message: 'Erro de validação', errors });
    }

    // Índice único violado (email duplicado)
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Este email já está cadastrado' });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro ao criar usuário',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Login de usuário
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // findWithPassword inclui senha_hash (select: false no schema)
    const user = await User.findWithPassword({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou senha inválidos' });
    }

    const isPasswordValid = await comparePassword(senha, user.senha_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email ou senha inválidos' });
    }

    const token = generateToken({ userId: user._id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id, email: user.email });

    return res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user._id,
          nome_completo: user.nome_completo,
          email: user.email,
          telefone: user.telefone,
          idade: user.idade,
          foto_perfil: user.foto_perfil,
          tem_restricao: user.tem_restricao,
          email_verificado: user.email_verificado,
          created_at: user.created_at
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Erro no login', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao fazer login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Refresh token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token não fornecido' });
    }

    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(refreshToken);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
    }

    const newToken = generateToken({ userId: user._id, email: user.email });
    const newRefreshToken = generateRefreshToken({ userId: user._id, email: user.email });

    return res.json({
      success: true,
      message: 'Token renovado com sucesso',
      data: { token: newToken, refreshToken: newRefreshToken }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Refresh token inválido ou expirado'
    });
  }
};

/**
 * Solicitação de recuperação de senha
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá um email com instruções para recuperar sua senha'
      });
    }

    const resetToken = generateResetToken();
    const expirationDate = generateExpirationDate(1);

    await User.findByIdAndUpdate(user._id, {
      token_recuperacao_senha: resetToken,
      data_expiracao_token: expirationDate
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      logger.error('Erro ao enviar email de recuperação de senha', emailError);
    }

    return res.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um email com instruções para recuperar sua senha'
    });
  } catch (error) {
    logger.error('Erro na solicitação de recuperação de senha', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação de recuperação de senha',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verificação de token de recuperação
 * POST /api/auth/verify-reset-token
 */
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token não fornecido' });
    }

    // Selecionar campos ocultos necessários para a verificação
    const user = await User.findOne({ token_recuperacao_senha: token }).select(
      '+token_recuperacao_senha +data_expiracao_token'
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }

    if (isTokenExpired(user.data_expiracao_token)) {
      await User.findByIdAndUpdate(user._id, {
        token_recuperacao_senha: null,
        data_expiracao_token: null
      });
      return res.status(400).json({
        success: false,
        message: 'Token expirado. Solicite uma nova recuperação de senha'
      });
    }

    return res.json({ success: true, message: 'Token válido', data: { email: user.email } });
  } catch (error) {
    logger.error('Erro na verificação de token', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Redefinição de senha
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, senha } = req.body;

    if (!token || !senha) {
      return res.status(400).json({ success: false, message: 'Token e nova senha são obrigatórios' });
    }

    const user = await User.findOne({ token_recuperacao_senha: token }).select(
      '+token_recuperacao_senha +data_expiracao_token'
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }

    if (isTokenExpired(user.data_expiracao_token)) {
      await User.findByIdAndUpdate(user._id, {
        token_recuperacao_senha: null,
        data_expiracao_token: null
      });
      return res.status(400).json({
        success: false,
        message: 'Token expirado. Solicite uma nova recuperação de senha'
      });
    }

    const senha_hash = await hashPassword(senha);

    await User.findByIdAndUpdate(user._id, {
      senha_hash,
      token_recuperacao_senha: null,
      data_expiracao_token: null
    });

    return res.json({ success: true, message: 'Senha redefinida com sucesso' });
  } catch (error) {
    logger.error('Erro na redefinição de senha', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Envio de email de verificação
 * POST /api/auth/send-verification-email
 */
const sendVerificationEmailHandler = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá um email com instruções para verificar sua conta'
      });
    }

    if (user.email_verificado) {
      return res.json({ success: true, message: 'Este email já está verificado' });
    }

    const verificationToken = generateResetToken();
    const expirationDate = generateExpirationDate(24);

    await User.findByIdAndUpdate(user._id, {
      token_verificacao_email: verificationToken,
      data_expiracao_token: expirationDate
    });

    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      logger.error('Erro ao enviar email de verificação', emailError);
    }

    return res.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um email com instruções para verificar sua conta'
    });
  } catch (error) {
    logger.error('Erro no envio de email de verificação', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar email de verificação',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verificação de email
 * POST /api/auth/verify-email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token não fornecido' });
    }

    const user = await User.findOne({ token_verificacao_email: token }).select(
      '+token_verificacao_email +data_expiracao_token'
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }

    if (user.email_verificado) {
      await User.findByIdAndUpdate(user._id, {
        token_verificacao_email: null,
        data_expiracao_token: null
      });
      return res.json({ success: true, message: 'Este email já estava verificado' });
    }

    if (isTokenExpired(user.data_expiracao_token)) {
      await User.findByIdAndUpdate(user._id, {
        token_verificacao_email: null,
        data_expiracao_token: null
      });
      return res.status(400).json({
        success: false,
        message: 'Token expirado. Solicite um novo email de verificação'
      });
    }

    await User.findByIdAndUpdate(user._id, {
      email_verificado: true,
      token_verificacao_email: null,
      data_expiracao_token: null
    });

    return res.json({
      success: true,
      message: 'Email verificado com sucesso',
      data: { email: user.email, email_verificado: true }
    });
  } catch (error) {
    logger.error('Erro na verificação de email', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(400).json({ success: false, message: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(400).json({ success: false, message: 'Formato inválido' });
    }

    const token = parts[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

    await BlacklistedToken.create({
      token_hash: require('crypto').createHash('sha256').update(token).digest('hex'),
      expires_at: expiresAt
    });

    return res.status(204).send();
  } catch (err) {
    logger.error('Erro no logout', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  sendVerificationEmailHandler,
  verifyEmail,
  logout
};