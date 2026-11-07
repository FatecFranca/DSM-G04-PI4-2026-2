# 🧪 Guia de Testes - Recuperação de Senha

Este guia mostra como testar o sistema de recuperação de senha implementado.

## 📋 Pré-requisitos

1. **Servidor rodando**

   ```bash
   npm run dev
   ```

2. **Usuário de teste cadastrado**
   - Você pode usar um usuário existente ou criar um novo

## 🚀 Método 1: Script Automatizado

Execute o script de testes:

```bash
npm run test:password-reset
```

Este script testa:

- ✅ Solicitação de recuperação de senha
- ✅ Validações de dados
- ✅ Verificação de token inválido
- ✅ Redefinição de senha com dados inválidos

## 🧪 Método 2: Testes Manuais com cURL

### Passo 1: Solicitar Recuperação de Senha

```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu_email@teste.com"
  }'
```

**Resposta esperada (200):**

```json
{
  "success": true,
  "message": "Se o email estiver cadastrado, você receberá um email com instruções para recuperar sua senha"
}
```

**⚠️ IMPORTANTE:**

- Se o email não estiver configurado, o token será exibido no **console do servidor**
- Procure por: `📧 [DEV MODE] Email de recuperação de senha:`
- O token aparecerá no console

### Passo 2: Verificar Token (Opcional)

```bash
curl -X POST http://localhost:3001/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_DO_CONSOLE_OU_EMAIL"
  }'
```

**Resposta esperada (200):**

```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "email": "seu_email@teste.com"
  }
}
```

**Resposta se token inválido (400):**

```json
{
  "success": false,
  "message": "Token inválido"
}
```

**Resposta se token expirado (400):**

```json
{
  "success": false,
  "message": "Token expirado. Solicite uma nova recuperação de senha"
}
```

### Passo 3: Redefinir Senha

```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_DO_CONSOLE_OU_EMAIL",
    "senha": "nova_senha_123"
  }'
```

**Resposta esperada (200):**

```json
{
  "success": true,
  "message": "Senha redefinida com sucesso"
}
```

### Passo 4: Testar Login com Nova Senha

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu_email@teste.com",
    "senha": "nova_senha_123"
  }'
```

**Resposta esperada (200):**

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": { ... },
    "token": "...",
    "refreshToken": "..."
  }
}
```

## 🧪 Método 3: Testes com Postman/Insomnia

### Collection: Recuperação de Senha

**1. Solicitar Recuperação**

- Method: `POST`
- URL: `http://localhost:3001/api/auth/forgot-password`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "email": "usuario@teste.com"
}
```

**2. Verificar Token**

- Method: `POST`
- URL: `http://localhost:3001/api/auth/verify-reset-token`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "token": "TOKEN_AQUI"
}
```

**3. Redefinir Senha**

- Method: `POST`
- URL: `http://localhost:3001/api/auth/reset-password`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "token": "TOKEN_AQUI",
  "senha": "nova_senha_123"
}
```

## 📝 Fluxo Completo de Teste

### Cenário 1: Fluxo Normal

1. ✅ Criar usuário (se não existir)
2. ✅ Solicitar recuperação de senha
3. ✅ Obter token do console/email
4. ✅ Verificar token (opcional)
5. ✅ Redefinir senha
6. ✅ Fazer login com nova senha
7. ✅ Tentar usar token novamente (deve falhar - token invalidado)

### Cenário 2: Testes de Erro

1. ✅ Solicitar recuperação com email inválido (deve retornar sucesso por segurança)
2. ✅ Solicitar recuperação com formato de email inválido (deve retornar erro 400)
3. ✅ Verificar token inválido (deve retornar erro 400)
4. ✅ Redefinir senha sem token (deve retornar erro 400)
5. ✅ Redefinir senha com senha muito curta (deve retornar erro 400)
6. ✅ Redefinir senha com token expirado (deve retornar erro 400)

## 🔍 Como Obter o Token em Modo Desenvolvimento

Quando o email não está configurado, o token é exibido no console do servidor:

```
📧 [DEV MODE] Email de recuperação de senha:
   Para: usuario@teste.com
   Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
   Link: http://localhost:3000/reset-password?token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

Copie o token e use nos testes.

## ⚙️ Configuração de Email (Opcional)

Para receber emails reais, configure no `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=luis.camposfra@gmail.com
EMAIL_PASSWORD=drulgovbsxfvzmpd
EMAIL_FROM=noreply@safebite.com
FRONTEND_URL=http://localhost:3000
```

**Configuração do Gmail:**

1. Ative a verificação em duas etapas
2. Gere uma senha de app: https://myaccount.google.com/apppasswords
3. Use a senha de app no campo `EMAIL_PASSWORD`

## ✅ Checklist de Testes

- [ ] Solicitar recuperação de senha funciona
- [ ] Token é gerado e salvo no banco
- [ ] Email é enviado (ou token aparece no console)
- [ ] Verificar token válido funciona
- [ ] Verificar token inválido retorna erro
- [ ] Verificar token expirado retorna erro
- [ ] Redefinir senha funciona
- [ ] Token é invalidado após redefinição
- [ ] Login com nova senha funciona
- [ ] Validações de dados funcionam
- [ ] Proteção contra enumeração de emails funciona

## 🐛 Troubleshooting

### Token não aparece no console

- Verifique se o servidor está rodando
- Verifique se o email está no banco de dados
- Verifique os logs do servidor

### Token expirado muito rápido

- Por padrão, tokens expiram em 1 hora
- Você pode ajustar em `src/utils/resetToken.js`

### Email não é enviado

- Verifique configuração do email no `.env`
- Em desenvolvimento, o token aparece no console
- Verifique logs de erro do servidor

### Erro ao redefinir senha

- Verifique se o token está correto
- Verifique se o token não foi usado antes
- Verifique se o token não expirou

## 📚 Próximos Passos

Após validar que tudo está funcionando:

1. Testar com emails reais (se configurado)
2. Testar expiração de tokens
3. Testar segurança (tentativas de reutilizar token)
