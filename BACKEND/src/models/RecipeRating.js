const mongoose = require('mongoose');

const recipeRatingSchema = new mongoose.Schema(
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
    },
    rating: {
      type: Number,
      required: [true, 'A avaliação é obrigatória'],
      min: [1, 'A avaliação deve ser no mínimo 1'],
      max: [5, 'A avaliação deve ser no máximo 5']
    },
    comentario: {
      type: String,
      default: null
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

// Garante que um usuário só avalia uma receita uma vez (equivale ao unique index do Sequelize)
recipeRatingSchema.index({ recipe_id: 1, user_id: 1 }, { unique: true });

const RecipeRating = mongoose.model('RecipeRating', recipeRatingSchema);

module.exports = RecipeRating;