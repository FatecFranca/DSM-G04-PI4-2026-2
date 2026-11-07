/**
 * Testes para funções de restrições
 */
const {
  cleanDatabase,
  createTestUser,
  createTestRestriction,
  loginUser,
  closeDatabase,
  app,
  request
} = require('./helpers/testHelpers');

describe('Restrições', () => {
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
      email: 'restricoes@teste.com',
      senha: 'senha123',
      email_verificado: true
    });
    token = await loginUser('restricoes@teste.com', 'senha123');
  });

  describe('GET /api/restrictions', () => {
    test('Deve listar todas as restrições', async () => {
      await createTestRestriction({ nome: 'Restrição 1' });
      await createTestRestriction({ nome: 'Restrição 2' });

      const response = await request(app).get('/api/restrictions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    test('Deve buscar restrições por termo', async () => {
      await createTestRestriction({
        nome: 'Glúten',
        palavras_chave: JSON.stringify(['trigo', 'cevada'])
      });
      await createTestRestriction({
        nome: 'Lactose',
        palavras_chave: JSON.stringify(['leite', 'queijo'])
      });

      const response = await request(app).get('/api/restrictions?q=glúten');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/restrictions/users', () => {
    test('Deve listar restrições do usuário autenticado', async () => {
      const restriction = await createTestRestriction();
      await UserRestriction.create({
        user_id: user.id,
        restriction_id: restriction.id
      });

      const response = await request(app)
        .get('/api/restrictions/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    test('Deve retornar erro sem autenticação', async () => {
      const response = await request(app).get('/api/restrictions/users');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/restrictions/users', () => {
    test('Deve adicionar restrição existente ao usuário', async () => {
      const restriction = await createTestRestriction();

      const response = await request(app)
        .post('/api/restrictions/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          restriction_id: restriction.id
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verificar se foi criada
      const userRestriction = await UserRestriction.findOne({
        where: {
          user_id: user.id,
          restriction_id: restriction.id
        }
      });
      expect(userRestriction).not.toBeNull();
    });

    test('Deve criar nova restrição e associar ao usuário', async () => {
      const response = await request(app)
        .post('/api/restrictions/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: 'Nova Restrição',
          palavras_chave: ['palavra1', 'palavra2']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('Deve retornar erro se restrição já está associada', async () => {
      const restriction = await createTestRestriction();
      await UserRestriction.create({
        user_id: user.id,
        restriction_id: restriction.id
      });

      const response = await request(app)
        .post('/api/restrictions/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          restriction_id: restriction.id
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('Deve retornar erro de validação se dados inválidos', async () => {
      const response = await request(app)
        .post('/api/restrictions/users')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/restrictions/users/:id', () => {
    test('Deve atualizar restrição do usuário', async () => {
      const restriction = await createTestRestriction();
      const userRestriction = await UserRestriction.create({
        user_id: user.id,
        restriction_id: restriction.id
      });

      const response = await request(app)
        .put(`/api/restrictions/users/${userRestriction.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          palavras_chave_personalizadas: ['palavra1', 'palavra2'],
          notes: 'Notas personalizadas'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Deve retornar erro se não for do usuário', async () => {
      const otherUser = await createTestUser({
        email: 'outro@teste.com',
        senha: 'senha123'
      });
      const restriction = await createTestRestriction();
      const userRestriction = await UserRestriction.create({
        user_id: otherUser.id,
        restriction_id: restriction.id
      });

      const response = await request(app)
        .put(`/api/restrictions/users/${userRestriction.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: 'Tentativa de atualizar'
        });

      expect(response.status).toBe(403);
    });

    test('Deve retornar 404 se associação não existe', async () => {
      const response = await request(app)
        .put('/api/restrictions/users/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: 'Atualizar'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/restrictions/users/:id', () => {
    test('Deve remover restrição do usuário', async () => {
      const restriction = await createTestRestriction();
      const userRestriction = await UserRestriction.create({
        user_id: user.id,
        restriction_id: restriction.id
      });

      const response = await request(app)
        .delete(`/api/restrictions/users/${userRestriction.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);

      // Verificar se foi removida
      const deleted = await UserRestriction.findByPk(userRestriction.id);
      expect(deleted).toBeNull();
    });

    test('Deve retornar erro se não for do usuário', async () => {
      const otherUser = await createTestUser({
        email: 'outro@teste.com',
        senha: 'senha123'
      });
      const restriction = await createTestRestriction();
      const userRestriction = await UserRestriction.create({
        user_id: otherUser.id,
        restriction_id: restriction.id
      });

      const response = await request(app)
        .delete(`/api/restrictions/users/${userRestriction.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    test('Deve retornar 404 se associação não existe', async () => {
      const response = await request(app)
        .delete('/api/restrictions/users/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});

