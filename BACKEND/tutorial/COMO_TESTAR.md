# 🚀 Como Testar - Guia Rápido

## Passo 1: Verificar Configuração

1. **Verifique se o arquivo `.env` existe e está configurado:**

   ```bash
   # Deve conter pelo menos:
   JWT_SECRET=seu_jwt_secret_super_seguro_mude_em_producao_123456789
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=safebite_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```

2. **Verifique se o PostgreSQL está rodando e a tabela `users` existe**

## Passo 2: Iniciar o Servidor

```bash
npm run dev
```

**Você deve ver:**

```
🚀 Servidor rodando na porta 3001
✅ Conexão com o banco de dados estabelecida com sucesso.
```

## Passo 3: Executar Testes Automatizados

### Opção A: Teste Completo de Autenticação

```bash
npm run test:auth
```

Este script testa:

- ✅ Health check
- ✅ Registro de usuário
- ✅ Validações
- ✅ Login
- ✅ Refresh token

### Opção B: Teste de Rota Protegida

```bash
npm run test:protected
```

Este script testa:

- ✅ Middleware de autenticação
- ✅ Proteção de rotas

## Passo 4: Testes Manuais com cURL

### 1. Health Check

```bash
curl http://localhost:3001/api/health
```

### 2. Registrar Usuário

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

**Salve o token retornado!**

### 3. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@teste.com",
    "senha": "senha123"
  }'
```

### 4. Testar Rota Protegida (com token)

```bash
curl http://localhost:3001/api/test/protected \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 5. Testar Rota Protegida (sem token - deve falhar)

```bash
curl http://localhost:3001/api/test/protected
```

## Passo 5: Usar Postman/Insomnia

1. **Importe as requisições:**
   - GET `http://localhost:3001/api/health`
   - POST `http://localhost:3001/api/auth/register`
   - POST `http://localhost:3001/api/auth/login`
   - GET `http://localhost:3001/api/test/protected` (com header Authorization)

2. **Para rotas protegidas, adicione o header:**
   ```
   Authorization: Bearer SEU_TOKEN_AQUI
   ```

## ✅ Checklist de Validação

- [ ] Servidor inicia sem erros
- [ ] Health check retorna `{"status": "ok"}`
- [ ] Registro cria usuário e retorna token
- [ ] Login retorna token
- [ ] Rota protegida funciona com token
- [ ] Rota protegida rejeita sem token (401)
- [ ] Validações funcionam (email inválido, senha curta, etc.)

## 🐛 Problemas Comuns

**Erro: "JWT_SECRET não configurado"**

- Adicione `JWT_SECRET` no arquivo `.env`

**Erro: "Conexão com banco falhou"**

- Verifique se PostgreSQL está rodando
- Teste: `npm run test:db`

**Erro: "Port already in use"**

- Altere `PORT` no `.env` ou pare o processo na porta 3001

**Erro: "Cannot find module"**

- Execute: `npm install`

## 📚 Documentação Completa

Veja `TESTES.md` para documentação detalhada de todos os testes.
