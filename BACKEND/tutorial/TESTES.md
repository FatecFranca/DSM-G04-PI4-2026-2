# 🧪 Guia de Testes - SafeBite Backend

Este guia mostra como testar todas as funcionalidades implementadas.

## 📋 Pré-requisitos

1. **Banco de dados configurado**
   - PostgreSQL rodando
   - Tabela `users` criada
   - Arquivo `.env` configurado

2. **Dependências instaladas**

   ```bash
   npm install
   ```

3. **Variáveis de ambiente**
   - Verifique se o arquivo `.env` existe e está configurado
   - Especialmente: `JWT_SECRET`, `DB_*`, `PORT`

## 🚀 Passo 1: Iniciar o Servidor

```bash
# Modo desenvolvimento (recomendado)
npm run dev

# Ou modo produção
npm start
```

**Verificações:**

- ✅ Servidor deve iniciar na porta 3001 (ou a configurada)
- ✅ Mensagem: "✅ Conexão com o banco de dados estabelecida com sucesso"
- ✅ Sem erros no console

## 🧪 Passo 2: Testar Endpoints

### Opção 1: Usando o Script de Teste Automatizado

```bash
node tests/test-auth.js
```

### Opção 2: Usando cURL (Terminal)

#### 2.1. Testar Health Check

```bash
curl http://localhost:3001/api/health
```

**Resposta esperada:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.456
}
```

#### 2.2. Testar Registro de Usuário

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome_completo": "João Silva",
    "email": "joao@teste.com",
    "senha": "senha123",
    "telefone": "11999999999",
    "idade": 30
  }'
```

**Resposta esperada (201):**

```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "nome_completo": "João Silva",
      "email": "joao@teste.com",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

**⚠️ Teste de erro (email duplicado):**

```bash
# Tente registrar o mesmo email novamente
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome_completo": "João Silva",
    "email": "joao@teste.com",
    "senha": "senha123"
  }'
```

**Resposta esperada (409):**

```json
{
  "success": false,
  "message": "Este email já está cadastrado"
}
```

#### 2.3. Testar Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@teste.com",
    "senha": "senha123"
  }'
```

**Resposta esperada (200):**

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

**⚠️ Teste de erro (credenciais inválidas):**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@teste.com",
    "senha": "senha_errada"
  }'
```

**Resposta esperada (401):**

```json
{
  "success": false,
  "message": "Email ou senha inválidos"
}
```

#### 2.4. Testar Validações

**Teste com dados inválidos:**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome_completo": "A",
    "email": "email-invalido",
    "senha": "123"
  }'
```

**Resposta esperada (400):**

```json
{
  "success": false,
  "message": "Erro de validação",
  "errors": [
    {
      "field": "nome_completo",
      "message": "O nome deve ter pelo menos 2 caracteres"
    },
    {
      "field": "email",
      "message": "Email inválido"
    },
    {
      "field": "senha",
      "message": "A senha deve ter pelo menos 6 caracteres"
    }
  ]
}
```

### Opção 3: Usando Postman/Insomnia

1. **Importar Collection** (veja `tests/postman-collection.json`)
2. Ou criar manualmente:

#### Collection: SafeBite API

**1. Health Check**

- Method: `GET`
- URL: `http://localhost:3001/api/health`

**2. Register**

- Method: `POST`
- URL: `http://localhost:3001/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "nome_completo": "Maria Santos",
  "email": "maria@teste.com",
  "senha": "senha123",
  "telefone": "11988888888",
  "idade": 25
}
```

**3. Login**

- Method: `POST`
- URL: `http://localhost:3001/api/auth/login`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "email": "maria@teste.com",
  "senha": "senha123"
}
```

**4. Refresh Token**

- Method: `POST`
- URL: `http://localhost:3001/api/auth/refresh`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "refreshToken": "SEU_REFRESH_TOKEN_AQUI"
}
```

## 🔐 Passo 3: Testar Middleware de Autenticação

Para testar o middleware, voê precisará de uma rota protegida. Por enquanto, você pode criar uma rota de teste:

**Criar arquivo:** `src/routes/test.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.get('/protected', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Rota protegida acessada com sucesso!',
    user: req.user
  });
});

module.exports = router;
```

**Adicionar em `src/routes/index.js`:**

```javascript
const testRoutes = require('./test.routes');
router.use('/test', testRoutes);
```

**Testar:**

```bash
# Sem token (deve falhar)
curl http://localhost:3001/api/test/protected

# Com token (deve funcionar)
curl http://localhost:3001/api/test/protected \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## ✅ Checklist de Testes

- [x] Servidor inicia sem erros
- [ ] Conexão com banco de dados funciona
- [ ] Health check retorna status OK
- [ ] Registro de usuário funciona
- [ ] Registro com email duplicado retorna erro
- [ ] Validações de dados funcionam
- [ ] Login com credenciais corretas funciona
- [ ] Login com credenciais incorretas retorna erro
- [ ] Token JWT é gerado corretamente
- [ ] Refresh token funciona
- [ ] Middleware de autenticação protege rotas

## 🐛 Troubleshooting

### Erro: "JWT_SECRET não configurado"

- Verifique se `JWT_SECRET` está no arquivo `.env`

### Erro: "Conexão com banco de dados falhou"

- Verifique se PostgreSQL está rodando
- Confirme credenciais no `.env`
- Teste: `npm run test:db`

### Erro: "Cannot find module"

- Execute: `npm install`

### Erro: "Port already in use"

- Altere a porta no `.env` ou pare o processo na porta 3001

## 📝 Próximos Passos

Após validar que tudo está funcionando:

1. Criar rotas protegidas para usuários
2. Implementar CRUD de receitas
3. Implementar sistema de restrições
