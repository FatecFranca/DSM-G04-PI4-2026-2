const Joi = require('joi');

/**
 * Schema de validação para criação de receita
 */
const createRecipeSchema = Joi.object({
  titulo: Joi.string()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.empty': 'O título da receita é obrigatório',
      'string.min': 'O título deve ter pelo menos 3 caracteres',
      'string.max': 'O título deve ter no máximo 255 caracteres',
      'any.required': 'O título da receita é obrigatório'
    }),
  descricao: Joi.string()
    .max(1000)
    .allow(null, '')
    .optional()
    .messages({
      'string.max': 'A descrição deve ter no máximo 1000 caracteres'
    }),
  ingredientes: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().min(1)).min(1).required(),
      Joi.string().min(1).required()
    )
    .required()
    .messages({
      'any.required': 'Os ingredientes são obrigatórios',
      'array.min': 'Deve haver pelo menos um ingrediente',
      'string.min': 'Os ingredientes não podem estar vazios'
    }),
  modo_preparo: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.empty': 'O modo de preparo é obrigatório',
      'string.min': 'O modo de preparo deve ter pelo menos 10 caracteres',
      'any.required': 'O modo de preparo é obrigatório'
    }),
  tempo_preparo: Joi.string()
    .max(50)
    .allow(null, '')
    .optional()
    .messages({
      'string.max': 'O tempo de preparo deve ter no máximo 50 caracteres'
    }),
  rendimento: Joi.string()
    .max(50)
    .allow(null, '')
    .optional()
    .messages({
      'string.max': 'O rendimento deve ter no máximo 50 caracteres'
    }),
  status: Joi.string()
    .valid('publicada', 'rascunho')
    .default('rascunho')
    .messages({
      'any.only': 'Status deve ser "publicada" ou "rascunho"'
    })
});

/**
 * Schema de validação para atualização de receita
 */
const updateRecipeSchema = Joi.object({
  titulo: Joi.string()
    .min(3)
    .max(255)
    .optional()
    .messages({
      'string.min': 'O título deve ter pelo menos 3 caracteres',
      'string.max': 'O título deve ter no máximo 255 caracteres'
    }),
  descricao: Joi.string()
    .max(1000)
    .allow(null, '')
    .optional()
    .messages({
      'string.max': 'A descrição deve ter no máximo 1000 caracteres'
    }),
  ingredientes: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().min(1)).min(1),
      Joi.string().min(1)
    )
    .optional()
    .messages({
      'array.min': 'Deve haver pelo menos um ingrediente',
      'string.min': 'Os ingredientes não podem estar vazios'
    }),
  modo_preparo: Joi.string()
    .min(10)
    .optional()
    .messages({
      'string.min': 'O modo de preparo deve ter pelo menos 10 caracteres'
    }),
  tempo_preparo: Joi.string()
    .max(50)
    .allow(null, '')
    .optional()
    .messages({
      'string.max': 'O tempo de preparo deve ter no máximo 50 caracteres'
    }),
  rendimento: Joi.string()
    .max(50)
    .allow(null, '')
    .optional()
    .messages({
      'string.max': 'O rendimento deve ter no máximo 50 caracteres'
    }),
  status: Joi.string()
    .valid('publicada', 'rascunho')
    .optional()
    .messages({
      'any.only': 'Status deve ser "publicada" ou "rascunho"'
    })
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
  createRecipeSchema,
  updateRecipeSchema,
  validate
};

