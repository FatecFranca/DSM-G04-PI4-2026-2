const Joi = require('joi');

/**
 * Schema de validação para atualização de perfil
 */
const updateProfileSchema = Joi.object({
  nome_completo: Joi.string().min(2).max(255).optional().messages({
    'string.min': 'O nome deve ter pelo menos 2 caracteres',
    'string.max': 'O nome deve ter no máximo 255 caracteres'
  }),
  telefone: Joi.string().max(20).allow(null, '').optional().messages({
    'string.max': 'O telefone deve ter no máximo 20 caracteres'
  }),
  idade: Joi.number().integer().min(0).max(150).allow(null).optional().messages({
    'number.base': 'A idade deve ser um número',
    'number.integer': 'A idade deve ser um número inteiro',
    'number.min': 'A idade deve ser um número positivo',
    'number.max': 'A idade deve ser um número válido'
  })
})
  .min(1)
  .messages({
    'object.min': 'Pelo menos um campo deve ser fornecido para atualização'
  });

/**
 * Middleware de validação genérico
 */
const validate = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
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
  updateProfileSchema,
  validate
};
