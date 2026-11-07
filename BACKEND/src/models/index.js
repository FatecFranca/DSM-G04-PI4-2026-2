// No MongoDB com Mongoose, os relacionamentos são feitos via
// referências (ObjectId) nos próprios schemas, sem necessidade
// de declarar associações como no Sequelize.
// Basta exportar todos os modelos.

const User = require('./User');
const Restriction = require('./Restriction');
const UserRestriction = require('./UserRestriction');
const Recipe = require('./Recipe');
const RecipeRestriction = require('./RecipeRestriction');
const RecipeRating = require('./RecipeRating');
const RecipeFavorite = require('./RecipeFavorite');
const BlacklistedToken = require('./BlacklistedToken');

module.exports = {
  User,
  Restriction,
  UserRestriction,
  Recipe,
  RecipeRestriction,
  RecipeRating,
  RecipeFavorite,
  BlacklistedToken
};