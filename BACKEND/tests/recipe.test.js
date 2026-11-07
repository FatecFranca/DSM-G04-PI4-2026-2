/**
 * Testes para funções de receitas
 */
const {
  cleanDatabase,
  createTestUser,
  createTestRecipe,
  loginUser,
  closeDatabase,
  app,
  request
} = require('./helpers/testHelpers');

describe('Receitas', () => {
  let user;
  let token;

  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await closeDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    user = await createTestUser({
      email: 'receitas@teste.com',
      senha: 'senha123',
      email_verificado: true
    });
    token = await loginUser('receitas@teste.com', 'senha123');
  });

  describe('GET /api/recipes', () => {
    test('Deve listar receitas publicadas', async () => {
      await createTestRecipe(user.id, { status: 'publicada' });
      await createTestRecipe(user.id, { status: 'publicada' });
      await createTestRecipe(user.id, { status: 'rascunho' }); // Não deve aparecer

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recipes');
      expect(response.body.data.recipes.length).toBe(2);
    });

    test('Deve paginar resultados', async () => {
      // Criar 5 receitas
      for (let i = 0; i < 5; i++) {
        await createTestRecipe(user.id, {
          titulo: `Receita ${i}`,
          status: 'publicada'
        });
      }

      const response = await request(app).get('/api/recipes?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.data.recipes.length).toBe(2);
      expect(response.body.data.pagination.total).toBe(5);
    });

    test('Deve buscar receitas por termo', async () => {
      await createTestRecipe(user.id, {
        titulo: 'Bolo de Chocolate',
        status: 'publicada'
      });
      await createTestRecipe(user.id, {
        titulo: 'Torta de Maçã',
        status: 'publicada'
      });

      const response = await request(app).get('/api/recipes?search=chocolate');

      expect(response.status).toBe(200);
      expect(response.body.data.recipes.length).toBe(1);
      expect(response.body.data.recipes[0].titulo).toContain('Chocolate');
    });
  });

  describe('GET /api/recipes/:id', () => {
    test('Deve obter receita por ID', async () => {
      const recipe = await createTestRecipe(user.id, { status: 'publicada' });

      const response = await request(app).get(`/api/recipes/${recipe.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(recipe.id);
      expect(response.body.data.titulo).toBe(recipe.titulo);
    });

    test('Deve retornar 404 se receita não existe', async () => {
      const response = await request(app).get('/api/recipes/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/recipes', () => {
    test('Deve criar receita com dados válidos', async () => {
      const recipeData = {
        titulo: 'Nova Receita',
        descricao: 'Descrição da receita',
        ingredientes: ['ingrediente1', 'ingrediente2'],
        modo_preparo: 'Modo de preparo com pelo menos 10 caracteres',
        tempo_preparo: '30 minutos',
        rendimento: '4 porções',
        status: 'publicada'
      };

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${token}`)
        .send(recipeData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.titulo).toBe(recipeData.titulo);
      expect(response.body.data.user_id).toBe(user.id);
    });

    test('Deve retornar erro sem autenticação', async () => {
      const response = await request(app).post('/api/recipes').send({});

      expect(response.status).toBe(401);
    });

    test('Deve retornar erro de validação se dados inválidos', async () => {
      const recipeData = {
        titulo: 'AB', // Muito curto
        ingredientes: [], // Vazio
        modo_preparo: 'curto' // Muito curto
      };

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${token}`)
        .send(recipeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/recipes/:id', () => {
    test('Deve atualizar receita se for o autor', async () => {
      const recipe = await createTestRecipe(user.id);

      const updateData = {
        titulo: 'Receita Atualizada',
        descricao: 'Nova descrição'
      };

      const response = await request(app)
        .put(`/api/recipes/${recipe.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.titulo).toBe(updateData.titulo);
    });

    test('Deve retornar erro se não for o autor', async () => {
      const otherUser = await createTestUser({
        email: 'outro@teste.com',
        senha: 'senha123'
      });
      const recipe = await createTestRecipe(otherUser.id);

      const response = await request(app)
        .put(`/api/recipes/${recipe.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ titulo: 'Tentativa de atualizar' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('Deve retornar 404 se receita não existe', async () => {
      const response = await request(app)
        .put('/api/recipes/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({ titulo: 'Atualizar' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    test('Deve deletar receita se for o autor', async () => {
      const recipe = await createTestRecipe(user.id);

      const response = await request(app)
        .delete(`/api/recipes/${recipe.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar se foi deletada
      const deleted = await Recipe.findByPk(recipe.id);
      expect(deleted).toBeNull();
    });

    test('Deve retornar erro se não for o autor', async () => {
      const otherUser = await createTestUser({
        email: 'outro@teste.com',
        senha: 'senha123'
      });
      const recipe = await createTestRecipe(otherUser.id);

      const response = await request(app)
        .delete(`/api/recipes/${recipe.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    test('Deve retornar 404 se receita não existe', async () => {
      const response = await request(app)
        .delete('/api/recipes/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});

