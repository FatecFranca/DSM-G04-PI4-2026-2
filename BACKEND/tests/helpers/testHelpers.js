/**
 * Helpers para testes
 */
const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');
const Recipe = require('../../src/models/Recipe');
const Restriction = require('../../src/models/Restriction');
const UserRestriction = require('../../src/models/UserRestriction');
const RecipeRating = require('../../src/models/RecipeRating');
const RecipeRestriction = require('../../src/models/RecipeRestriction');
const { sequelize } = require('../../src/config/database');
const { hashPassword } = require('../../src/utils/password');

/**
 * Limpar banco de dados de teste
 */
const cleanDatabase = async () => {
  // Deletar em ordem para respeitar foreign keys
  await RecipeRating.destroy({ where: {}, force: true });
  await RecipeRestriction.destroy({ where: {}, force: true });
  await UserRestriction.destroy({ where: {}, force: true });
  await Recipe.destroy({ where: {}, force: true });
  await Restriction.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
};

/**
 * Criar usuário de teste
 */
const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    nome_completo: 'Usuário Teste',
    email: `teste${Date.now()}@teste.com`,
    senha: 'senha123',
    email_verificado: true,
    ...overrides
  };

  // Fazer hash da senha se fornecida
  if (defaultUser.senha) {
    defaultUser.senha_hash = await hashPassword(defaultUser.senha);
    delete defaultUser.senha;
  }

  return await User.create(defaultUser);
};

/**
 * Criar receita de teste
 */
const createTestRecipe = async (userId, overrides = {}) => {
  const defaultRecipe = {
    titulo: 'Receita Teste',
    descricao: 'Descrição da receita teste',
    ingredientes: JSON.stringify(['ingrediente1', 'ingrediente2']),
    modo_preparo: 'Modo de preparo da receita teste com pelo menos 10 caracteres',
    tempo_preparo: '30 minutos',
    rendimento: '4 porções',
    status: 'publicada',
    user_id: userId,
    ...overrides
  };

  return await Recipe.create(defaultRecipe);
};

/**
 * Criar restrição de teste
 */
const createTestRestriction = async (overrides = {}) => {
  const defaultRestriction = {
    nome: 'Restrição Teste',
    palavras_chave: JSON.stringify(['palavra1', 'palavra2']),
    ...overrides
  };

  return await Restriction.create(defaultRestriction);
};

/**
 * Fazer login e obter token
 */
const loginUser = async (email, senha) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, senha });

  return response.body.token || response.body.data?.token;
};

/**
 * Criar requisição autenticada
 */
const authenticatedRequest = (method, url) => {
  return async (token) => {
    return request(app)[method.toLowerCase()](url).set('Authorization', `Bearer ${token}`);
  };
};

/**
 * Fechar conexão do banco
 */
const closeDatabase = async () => {
  await sequelize.close();
};

module.exports = {
  cleanDatabase,
  createTestUser,
  createTestRecipe,
  createTestRestriction,
  loginUser,
  authenticatedRequest,
  closeDatabase,
  app,
  request
};

