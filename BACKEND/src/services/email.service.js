const nodemailer = require('nodemailer');

/**
 * Configuração do transporter de email
 */
const createTransporter = () => {
  // Se não houver configuração de email, retorna null (modo desenvolvimento)
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Envia email de recuperação de senha
 * @param {string} email - Email do destinatário
 * @param {string} token - Token de recuperação
 * @returns {Promise<Object>} Resultado do envio
 */
const sendPasswordResetEmail = async (email, token) => {
  const transporter = createTransporter();

  // Se não houver transporter (email não configurado), apenas loga
  if (!transporter) {
    console.log('📧 [DEV MODE] Email de recuperação de senha:');
    console.log(`   Para: ${email}`);
    console.log(`   Token: ${token}`);
    console.log(`   Link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`);
    return { success: true, devMode: true };
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"SafeBite" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperação de Senha - SafeBite',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .token {
            background-color: #e8e8e8;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            word-break: break-all;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperação de Senha</h1>
          </div>
          <div class="content">
            <p>Olá!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta SafeBite.</p>
            <p>Clique no botão abaixo para redefinir sua senha:</p>
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
            <p>Ou copie e cole o link abaixo no seu navegador:</p>
            <div class="token">${resetUrl}</div>
            <p><strong>Este link expira em 1 hora.</strong></p>
            <p>Se você não solicitou esta recuperação de senha, ignore este email.</p>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>SafeBite - Plataforma de Receitas</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Recuperação de Senha - SafeBite

      Olá!

      Recebemos uma solicitação para redefinir a senha da sua conta SafeBite.

      Acesse o link abaixo para redefinir sua senha:
      ${resetUrl}

      Este link expira em 1 hora.

      Se você não solicitou esta recuperação de senha, ignore este email.

      SafeBite - Plataforma de Receitas
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Erro ao enviar email de recuperação de senha');
  }
};

/**
 * Envia email de verificação de conta
 * @param {string} email - Email do destinatário
 * @param {string} token - Token de verificação
 * @returns {Promise<Object>} Resultado do envio
 */
const sendVerificationEmail = async (email, token) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('📧 [DEV MODE] Email de verificação:');
    console.log(`   Para: ${email}`);
    console.log(`   Token: ${token}`);
    console.log(`   Link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`);
    return { success: true, devMode: true };
  }

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"SafeBite" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verifique seu email - SafeBite',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2196F3;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Verifique seu Email</h1>
          </div>
          <div class="content">
            <p>Olá!</p>
            <p>Obrigado por se cadastrar no SafeBite!</p>
            <p>Clique no botão abaixo para verificar seu email:</p>
            <a href="${verifyUrl}" class="button">Verificar Email</a>
            <p>Ou copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all;">${verifyUrl}</p>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>SafeBite - Plataforma de Receitas</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Erro ao enviar email de verificação');
  }
};

/**
 * Envia email de boas-vindas
 * @param {string} email - Email do destinatário
 * @param {string} nome - Nome do usuário
 * @returns {Promise<Object>} Resultado do envio
 */
const sendWelcomeEmail = async (email, nome) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('📧 [DEV MODE] Email de boas-vindas:');
    console.log(`   Para: ${email}`);
    console.log(`   Nome: ${nome}`);
    console.log(`   Link do app: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    return { success: true, devMode: true };
  }

  const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const mailOptions = {
    from: `"SafeBite" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Bem-vindo ao SafeBite! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 18px;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
          }
          .welcome-message {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
          }
          .features {
            background-color: #f9f9f9;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
          }
          .features h3 {
            color: #4CAF50;
            margin-top: 0;
            font-size: 20px;
          }
          .features ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .features li {
            padding: 10px 0;
            padding-left: 30px;
            position: relative;
          }
          .features li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #4CAF50;
            font-weight: bold;
            font-size: 18px;
          }
          .button {
            display: inline-block;
            padding: 15px 40px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
          }
          .button:hover {
            background-color: #45a049;
          }
          .cta {
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            background-color: #f9f9f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
          }
          .social {
            margin: 20px 0;
          }
          .social a {
            color: #4CAF50;
            text-decoration: none;
            margin: 0 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo ao SafeBite!</h1>
            <p>Sua jornada culinária começa aqui</p>
          </div>
          <div class="content">
            <p class="welcome-message">Olá, <strong>${nome}</strong>!</p>
            <p>Estamos muito felizes em tê-lo(a) conosco! 🎊</p>
            <p>O SafeBite é a plataforma perfeita para descobrir receitas deliciosas que respeitam suas restrições alimentares e preferências.</p>

            <div class="features">
              <h3>✨ O que você pode fazer:</h3>
              <ul>
                <li>Descobrir receitas incríveis adaptadas às suas necessidades</li>
                <li>Criar e compartilhar suas próprias receitas</li>
                <li>Gerenciar suas restrições alimentares de forma fácil</li>
                <li>Avaliar e favoritar receitas</li>
                <li>Explorar receitas compatíveis com seu perfil</li>
              </ul>
            </div>

            <div class="cta">
              <p><strong>Pronto para começar?</strong></p>
              <a href="${appUrl}" class="button">Explorar Receitas</a>
            </div>

            <p style="margin-top: 30px;">Não esqueça de verificar seu email para desbloquear todas as funcionalidades!</p>

            <div class="footer">
              <p><strong>SafeBite - Plataforma de Receitas</strong></p>
              <p>Este é um email automático, por favor não responda.</p>
              <div class="social">
                <p>Nos siga nas redes sociais para receitas e dicas!</p>
              </div>
              <p style="margin-top: 20px; color: #999;">
                Se você não criou esta conta, pode ignorar este email.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Bem-vindo ao SafeBite! 🎉

      Olá, ${nome}!

      Estamos muito felizes em tê-lo(a) conosco!

      O SafeBite é a plataforma perfeita para descobrir receitas deliciosas que respeitam suas restrições alimentares e preferências.

      O que você pode fazer:
      ✓ Descobrir receitas incríveis adaptadas às suas necessidades
      ✓ Criar e compartilhar suas próprias receitas
      ✓ Gerenciar suas restrições alimentares de forma fácil
      ✓ Avaliar e favoritar receitas
      ✓ Explorar receitas compatíveis com seu perfil

      Pronto para começar?
      Acesse: ${appUrl}

      Não esqueça de verificar seu email para desbloquear todas as funcionalidades!

      SafeBite - Plataforma de Receitas
      Este é um email automático, por favor não responda.

      Se você não criou esta conta, pode ignorar este email.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    throw new Error('Erro ao enviar email de boas-vindas');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail
};

