const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    nome_completo: {
      type: String,
      required: [true, 'O nome completo é obrigatório'],
      trim: true,
      minlength: [2, 'O nome deve ter entre 2 e 255 caracteres'],
      maxlength: [255, 'O nome deve ter entre 2 e 255 caracteres']
    },
    email: {
      type: String,
      required: [true, 'O email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    senha_hash: {
      type: String,
      required: [true, 'A senha é obrigatória'],
      select: false // Não retorna por padrão (equivale ao defaultScope do Sequelize)
    },
    telefone: {
      type: String,
      default: null,
      maxlength: [20, 'O telefone deve ter no máximo 20 caracteres']
    },
    idade: {
      type: Number,
      default: null,
      min: [0, 'A idade deve ser um número positivo'],
      max: [150, 'A idade deve ser um número válido']
    },
    foto_perfil: {
      type: String,
      default: null
    },
    email_verificado: {
      type: Boolean,
      default: false
    },
    token_verificacao_email: {
      type: String,
      default: null,
      select: false
    },
    token_recuperacao_senha: {
      type: String,
      default: null,
      select: false
    },
    data_expiracao_token: {
      type: Date,
      default: null,
      select: false
    },
    tem_restricao: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.senha_hash;
        delete ret.token_verificacao_email;
        delete ret.token_recuperacao_senha;
        delete ret.data_expiracao_token;
        return ret;
      }
    }
  }
);

// Equivalente ao scope "withPassword" do Sequelize
userSchema.statics.findWithPassword = function (filter) {
  return this.findOne(filter).select('+senha_hash');
};

const User = mongoose.model('User', userSchema);

module.exports = User;