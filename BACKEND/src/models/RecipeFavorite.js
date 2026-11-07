const mongoose = require('mongoose');

const recipeFavoriteSchema = new mongoose.Schema(
  {
    recipe_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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

// Garante que um usuário só favorita uma receita uma vez
recipeFavoriteSchema.index({ recipe_id: 1, user_id: 1 }, { unique: true });

const RecipeFavorite = mongoose.model('RecipeFavorite', recipeFavoriteSchema);

module.exports = RecipeFavorite;