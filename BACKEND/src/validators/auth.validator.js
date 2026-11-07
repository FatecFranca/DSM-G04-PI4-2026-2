const Joi = require('joi');

/**
 * Schema de validação para registro de usuário
 */
const registerSchema = Joi.object({
  nome_completo: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.empty': 'O nome completo é obrigatório',
      'string.min': 'O nome deve ter pelo menos 2 caracteres',
      'string.max': 'O nome deve ter no máximo 255 caracteres',
      'any.required': 'O nome completo é obrigatório'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'string.empty': 'O email é obrigatório',
      'any.required': 'O email é obrigatório'
    }),
  senha: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.empty': 'A senha é obrigatória',
      'string.min': 'A senha deve ter pelo menos 6 caracteres',
      'string.max': 'A senha deve ter no máximo 100 caracteres',
      'any.required': 'A senha é obrigatória'
    }),
  telefone: Joi.string()
    .max(20)
    .allow(null, '')
    .optional()
    .messages({
      'string.max': 'O telefone deve ter no máximo 20 caracteres'
    }),
  idade: Joi.number()
    .integer()
    .min(0)
    .max(150)
    .allow(null)
    .optional()
    .messages({
      'number.base': 'A idade deve ser um número',
      'number.integer': 'A idade deve ser um número inteiro',
      'number.min': 'A idade deve ser um número positivo',
      'number.max': 'A idade deve ser um número válido'
    }),
  tem_restricao: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'tem_restricao deve ser um valor booleano (true/false)'
    })
});

/**
 * Schema de validação para login
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'string.empty': 'O email é obrigatório',
      'any.required': 'O email é obrigatório'
    }),
  senha: Joi.string()
    .required()
    .messages({
      'string.empty': 'A senha é obrigatória',
      'any.required': 'A senha é obrigatória'
    })
});

/**
 * Schema de validação para solicitação de recuperação de senha
 */
const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'string.empty': 'O email é obrigatório',
      'any.required': 'O email é obrigatório'
    })
});

/**
 * Schema de validação para verificação de token de recuperação
 */
const verifyResetTokenSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'O token é obrigatório',
      'any.required': 'O token é obrigatório'
    })
});

/**
 * Schema de validação para redefinição de senha
 */
const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'O token é obrigatório',
      'any.required': 'O token é obrigatório'
    }),
  senha: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.empty': 'A nova senha é obrigatória',
      'string.min': 'A senha deve ter pelo menos 6 caracteres',
      'string.max': 'A senha deve ter no máximo 100 caracteres',
      'any.required': 'A nova senha é obrigatória'
    })
});

/**
 * Schema de validação para envio de email de verificação
 */
const sendVerificationEmailSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'string.empty': 'O email é obrigatório',
      'any.required': 'O email é obrigatório'
    })
});

/**
 * Schema de validação para verificação de email
 */
const verifyEmailSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'O token é obrigatório',
      'any.required': 'O token é obrigatório'
    })
});

/**
 * Middleware de validação genérico
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors
      });
    }

    // Substituir req.body pelos valores validados e sanitizados
    req.body = value;
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetTokenSchema,
  resetPasswordSchema,
  sendVerificationEmailSchema,
  verifyEmailSchema,
  validate
};

