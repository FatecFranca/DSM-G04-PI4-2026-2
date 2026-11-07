const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O usuário é obrigatório']
    },
    nome: {
      type: String,
      required: [true, 'O nome da receita é obrigatório'],
      trim: true
    },
    descricao: {
      type: String,
      default: null
    },
    ingredientes: {
      type: mongoose.Schema.Types.Mixed, // Array ou string
      required: [true, 'Os ingredientes são obrigatórios'],
      get(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
    },
    modo_preparo: {
      type: String,
      required: [true, 'O modo de preparo é obrigatório']
    },
    tempo_preparo: {
      type: String,
      default: null
    },
    rendimento: {
      type: String,
      default: null
    },
    propriedades: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    restricoes_detectadas: {
      type: [
        {
          ingrediente: { type: String, required: true },
          palavras_chave: { type: [String], default: [] },
          restricao_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Restriction', default: null },
          restricao_nome: { type: String, default: null },
          detectado_em: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    imagem_url: {
      type: String,
      default: null
    },
    status: {
      type: String,
      required: true,
      default: 'rascunho',
      enum: {
        values: ['publicada', 'rascunho'],
        message: 'Status deve ser "publicada" ou "rascunho"'
      }
    },
    visualizacoes: {
      type: Number,
      default: 0,
      min: [0, 'Visualizações não pode ser negativo']
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      getters: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;