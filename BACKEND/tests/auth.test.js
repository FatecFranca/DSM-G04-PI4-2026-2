/**
 * Testes para funções de autenticação
 */
const {
  cleanDatabase,
  createTestUser,
  loginUser,
  closeDatabase,
  app,
  request
} = require('./helpers/testHelpers');

describe('Autenticação', () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await closeDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    test('Deve registrar um novo usuário com sucesso', async () => {
      const userData = {
        nome_completo: 'João Silva',
        email: 'joao@teste.com',
        senha: 'senha123',
        telefone: '11999999999',
        idade: 30
      };

      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.senha).toBeUndefined(); // Senha não deve ser retornada
    });

    test('Deve retornar erro se email já existe', async () => {
      const userData = {
        nome_completo: 'João Silva',
        email: 'joao@teste.com',
        senha: 'senha123'
      };

      // Criar primeiro usuário
      await createTestUser({ email: 'joao@teste.com' });

      // Tentar criar segundo usuário com mesmo email
      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('Deve retornar erro de validação se dados inválidos', async () => {
      const userData = {
        nome_completo: 'A', // Muito curto
        email: 'email-invalido', // Email inválido
        senha: '123' // Muito curta
      };

      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('Deve retornar erro se campos obrigatórios faltando', async () => {
      const response = await request(app).post('/api/auth/register').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('Deve fazer login com credenciais válidas', async () => {
      const user = await createTestUser({
        email: 'login@teste.com',
        senha: 'senha123',
        email_verificado: true
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'login@teste.com',
        senha: 'senha123'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('login@teste.com');
    });

    test('Deve retornar erro com credenciais inválidas', async () => {
      await createTestUser({
        email: 'login@teste.com',
        senha: 'senha123'
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'login@teste.com',
        senha: 'senha-errada'
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Deve retornar erro se usuário não existe', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'naoexiste@teste.com',
        senha: 'senha123'
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Deve retornar erro de validação se dados inválidos', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'email-invalido',
        senha: ''
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('Deve fazer logout com token válido', async () => {
      const user = await createTestUser({
        email: 'logout@teste.com',
        senha: 'senha123'
      });

      const token = await loginUser('logout@teste.com', 'senha123');

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Deve retornar erro sem token', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
    });

    test('Deve retornar erro com token inválido', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    test('Deve enviar email de recuperação para email válido', async () => {
      await createTestUser({
        email: 'recuperar@teste.com',
        senha: 'senha123'
      });

      const response = await request(app).post('/api/auth/forgot-password').send({
        email: 'recuperar@teste.com'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Deve retornar sucesso mesmo se email não existe (segurança)', async () => {
      const response = await request(app).post('/api/auth/forgot-password').send({
        email: 'naoexiste@teste.com'
      });

      // Por segurança, não revelar se email existe ou não
      expect(response.status).toBe(200);
    });

    test('Deve retornar erro de validação se email inválido', async () => {
      const response = await request(app).post('/api/auth/forgot-password').send({
        email: 'email-invalido'
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-reset-token', () => {
    test('Deve verificar token de recuperação válido', async () => {
      const user = await createTestUser({
        email: 'verify@teste.com',
        senha: 'senha123'
      });

      // Simular token de reset (em produção, seria gerado pelo forgot-password)
      const resetToken = 'test-reset-token-123';
      await user.update({
        token_reset_senha: resetToken,
        data_expiracao_token: new Date(Date.now() + 3600000) // 1 hora
      });

      const response = await request(app).post('/api/auth/verify-reset-token').send({
        token: resetToken
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Deve retornar erro com token inválido', async () => {
      const response = await request(app).post('/api/auth/verify-reset-token').send({
        token: 'token-invalido'
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Deve retornar erro de validação se token não fornecido', async () => {
      const response = await request(app).post('/api/auth/verify-reset-token').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    test('Deve redefinir senha com token válido', async () => {
      const user = await createTestUser({
        email: 'reset@teste.com',
        senha: 'senha123'
      });

      const resetToken = 'test-reset-token-456';
      await user.update({
        token_reset_senha: resetToken,
        data_expiracao_token: new Date(Date.now() + 3600000)
      });

      const response = await request(app).post('/api/auth/reset-password').send({
        token: resetToken,
        senha: 'novaSenha123'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar se consegue fazer login com nova senha
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'reset@teste.com',
        senha: 'novaSenha123'
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
    });

    test('Deve retornar erro com token inválido', async () => {
      const response = await request(app).post('/api/auth/reset-password').send({
        token: 'token-invalido',
        senha: 'novaSenha123'
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Deve retornar erro de validação se senha muito curta', async () => {
      const response = await request(app).post('/api/auth/reset-password').send({
        token: 'token-valido',
        senha: '123' // Muito curta
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/send-verification-email', () => {
    test('Deve enviar email de verificação', async () => {
      await createTestUser({
        email: 'verify-email@teste.com',
        senha: 'senha123',
        email_verificado: false
      });

      const response = await request(app).post('/api/auth/send-verification-email').send({
        email: 'verify-email@teste.com'
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Deve retornar erro de validação se email inválido', async () => {
      const response = await request(app).post('/api/auth/send-verification-email').send({
        email: 'email-invalido'
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    test('Deve verificar email com token válido', async () => {
      const user = await createTestUser({
        email: 'verify-email2@teste.com',
        senha: 'senha123',
        email_verificado: false
      });

      const verifyToken = 'test-verify-token-789';
      await user.update({
        token_verificacao_email: verifyToken,
        data_expiracao_token: new Date(Date.now() + 3600000)
      });

      const response = await request(app).post('/api/auth/verify-email').send({
        token: verifyToken
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar se email foi marcado como verificado
      await user.reload();
      expect(user.email_verificado).toBe(true);
    });

    test('Deve retornar erro com token inválido', async () => {
      const response = await request(app).post('/api/auth/verify-email').send({
        token: 'token-invalido'
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

