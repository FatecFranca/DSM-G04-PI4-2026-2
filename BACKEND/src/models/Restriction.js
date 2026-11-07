const mongoose = require('mongoose');

const restrictionSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome da restrição é obrigatório'],
      trim: true
    },
    categoria: {
      type: String,
      required: [true, 'A categoria é obrigatória'],
      trim: true
    },
    palavras_chave: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const Restriction = mongoose.model('Restriction', restrictionSchema);

module.exports = Restriction;