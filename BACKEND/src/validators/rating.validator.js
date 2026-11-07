const Joi = require('joi');

/**
 * Schema de validação para criar avaliação
 */
const createRatingSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base': 'A avaliação deve ser um número',
      'number.integer': 'A avaliação deve ser um número inteiro',
      'number.min': 'A avaliação deve ser no mínimo 1',
      'number.max': 'A avaliação deve ser no máximo 5',
      'any.required': 'A avaliação é obrigatória'
    }),
  comment: Joi.string()
    .max(1000)
    .allow(null, '')
    .optional()
    .messages({
      'string.max': 'O comentário deve ter no máximo 1000 caracteres'
    })
});

/**
 * Schema de validação para atualizar avaliação
 */
const updateRatingSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.base': 'A avaliação deve ser um número',
      'number.integer': 'A avaliação deve ser um número inteiro',
      'number.min': 'A avaliação deve ser no mínimo 1',
      'number.max': 'A avaliação deve ser no máximo 5'
    }),
  comment: Joi.string()
    .max(1000)
    .allow(null, '')
    .optional()
    .messages({
      'string.max': 'O comentário deve ter no máximo 1000 caracteres'
    })
})
  .min(1)
  .messages({
    'object.min': 'Pelo menos um campo (rating ou comment) deve ser fornecido para atualização'
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
  createRatingSchema,
  updateRatingSchema,
  validate
};

