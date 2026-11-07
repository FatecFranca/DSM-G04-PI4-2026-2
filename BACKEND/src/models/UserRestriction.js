const mongoose = require('mongoose');

const userRestrictionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    restriction_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restriction',
      required: true
    },
    palavras_chave_personalizadas: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
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

// Garante que um usuário não tenha a mesma restrição duplicada
userRestrictionSchema.index({ user_id: 1, restriction_id: 1 }, { unique: true });

const UserRestriction = mongoose.model('UserRestriction', userRestrictionSchema);

module.exports = UserRestriction;