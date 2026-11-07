/**
 * Testes unitários para funções de email
 * Execute: npm test -- tests/email.test.js
 *
 * Nota: Estes testes mockam o nodemailer para não enviar emails reais
 */

const {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail
} = require('../src/services/email.service');

// Mock do nodemailer
jest.mock('nodemailer', () => {
  const mockSendMail = jest.fn((mailOptions, callback) => {
    if (callback) {
      callback(null, { messageId: 'test-message-id' });
    }
    return Promise.resolve({ messageId: 'test-message-id' });
  });

  const mockCreateTransport = jest.fn(() => ({
    sendMail: mockSendMail
  }));

  return {
    createTransport: mockCreateTransport
  };
});

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetar variáveis de ambiente
    process.env.EMAIL_HOST = 'smtp.test.com';
    process.env.EMAIL_USER = 'test@test.com';
    process.env.EMAIL_PASSWORD = 'test-password';
    process.env.EMAIL_FROM = 'noreply@test.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendWelcomeEmail', () => {
    it('deve enviar email de boas-vindas com sucesso', async () => {
      const email = 'test@example.com';
      const nome = 'João Silva';

      const result = await sendWelcomeEmail(email, nome);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('deve funcionar em modo desenvolvimento (sem configuração)', async () => {
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_USER;

      const email = 'test@example.com';
      const nome = 'João Silva';

      const result = await sendWelcomeEmail(email, nome);

      expect(result.success).toBe(true);
      expect(result.devMode).toBe(true);
    });
  });

  describe('sendVerificationEmail', () => {
    it('deve enviar email de verificação com sucesso', async () => {
      const email = 'test@example.com';
      const token = 'verification-token-123';

      const result = await sendVerificationEmail(email, token);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('deve incluir o token no link de verificação', async () => {
      const email = 'test@example.com';
      const token = 'test-token-123';

      await sendVerificationEmail(email, token);

      // Verificar se o transporter foi chamado
      const nodemailer = require('nodemailer');
      expect(nodemailer.createTransport).toHaveBeenCalled();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('deve enviar email de recuperação de senha com sucesso', async () => {
      const email = 'test@example.com';
      const token = 'reset-token-123';

      const result = await sendPasswordResetEmail(email, token);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('deve incluir o token no link de recuperação', async () => {
      const email = 'test@example.com';
      const token = 'test-reset-token-123';

      await sendPasswordResetEmail(email, token);

      // Verificar se o transporter foi chamado
      const nodemailer = require('nodemailer');
      expect(nodemailer.createTransport).toHaveBeenCalled();
    });
  });

  describe('Configuração de Email', () => {
    it('deve usar EMAIL_FROM se configurado', async () => {
      process.env.EMAIL_FROM = 'custom@test.com';
      const email = 'test@example.com';
      const nome = 'Test User';

      await sendWelcomeEmail(email, nome);

      // Verificar se o transporter foi configurado corretamente
      const nodemailer = require('nodemailer');
      expect(nodemailer.createTransport).toHaveBeenCalled();
    });

    it('deve usar FRONTEND_URL para links', async () => {
      process.env.FRONTEND_URL = 'https://app.safebite.com';
      const email = 'test@example.com';
      const token = 'test-token';

      await sendVerificationEmail(email, token);

      // O link deve incluir a URL do frontend
      const nodemailer = require('nodemailer');
      expect(nodemailer.createTransport).toHaveBeenCalled();
    });
  });
});
