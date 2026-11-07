const mongoose = require('mongoose');

const recipeRestrictionSchema = new mongoose.Schema(
  {
    recipe_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true
    },
    restriction_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restriction',
      default: null // Nullable para ingredientes não catalogados
    },
    ingrediente_restritivo: {
      type: String,
      required: [true, 'O ingrediente restritivo é obrigatório'],
      trim: true
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

recipeRestrictionSchema.index({ recipe_id: 1, restriction_id: 1 });
recipeRestrictionSchema.index({ restriction_id: 1 });

const RecipeRestriction = mongoose.model('RecipeRestriction', recipeRestrictionSchema);

module.exports = RecipeRestriction;