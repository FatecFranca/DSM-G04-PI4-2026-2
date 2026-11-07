# 🔐 Entendendo o JWT_SECRET

## ❓ O que é JWT_SECRET?

**JWT_SECRET** NÃO é um token JWT. É uma **chave secreta** (uma string aleatória) usada para **ASSINAR** os tokens JWT.

### Analogia Simples

Pense no JWT_SECRET como uma **chave mestra**:

- Você usa a chave mestra para **criar** e **verificar** os tokens
- Os tokens são como **documentos assinados** - você precisa da chave para assinar e verificar a assinatura
- Cada token é único, mas todos são assinados com a mesma chave mestra

## 🔄 Como Funciona?

### 1. Você configura o JWT_SECRET no `.env`

```env
JWT_SECRET=minha_chave_secreta_super_segura_123456789
```

### 2. O sistema usa essa chave para gerar tokens automaticamente

Quando você faz:

- **Registro** (`POST /api/auth/register`) → Sistema gera um token JWT
- **Login** (`POST /api/auth/login`) → Sistema gera um token JWT

### 3. O token JWT é retornado na resposta

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## ✅ Seu JWT_SECRET está correto?

### Opção 1: Usar o valor de exemplo (desenvolvimento)

Se você está usando:

```env
JWT_SECRET=seu_jwt_secret_super_seguro_mude_em_producao_123456789
```

**Está OK para desenvolvimento**, mas:

- ⚠️ NUNCA use em produção
- ⚠️ Gere um novo para produção

### Opção 2: Gerar um JWT_SECRET seguro

Execute:

```bash
npm run generate:jwt-secret
```

Isso vai gerar algo como:

```
JWT_SECRET=Kj8#mP2$vL9@nQ5&wR3!tY7*uI1^oE4%aZ6
```

Copie e cole no seu arquivo `.env`.

## 🔍 Verificar se está configurado

Execute:

```bash
npm run check:env
```

Este script verifica:

- ✅ Se JWT_SECRET está configurado
- ✅ Se tem tamanho adequado (pelo menos 32 caracteres)
- ✅ Se outras variáveis estão configuradas

## 📝 Resumo

| Item           | O que é                | Quando é criado                          |
| -------------- | ---------------------- | ---------------------------------------- |
| **JWT_SECRET** | Chave secreta (string) | Você configura no `.env`                 |
| **Token JWT**  | Token de autenticação  | Gerado automaticamente no login/registro |

## 🚀 Teste Rápido

1. **Verifique sua configuração:**

   ```bash
   npm run check:env
   ```

2. **Se precisar gerar um novo JWT_SECRET:**

   ```bash
   npm run generate:jwt-secret
   ```

3. **Teste se está funcionando:**
   ```bash
   npm run dev        # Terminal 1
   npm run test:auth  # Terminal 2
   ```

Se os testes passarem, seu JWT_SECRET está funcionando corretamente! ✅

## ❓ Perguntas Frequentes

**P: Preciso criar tokens manualmente?**
R: Não! Os tokens são gerados automaticamente quando você faz login ou registro.

**P: Posso usar o JWT_SECRET de exemplo?**
R: Sim, para desenvolvimento. Mas gere um novo para produção.

**P: O que acontece se eu mudar o JWT_SECRET?**
R: Todos os tokens antigos ficarão inválidos. Os usuários precisarão fazer login novamente.

**P: Como sei se meu JWT_SECRET está funcionando?**
R: Execute `npm run test:auth`. Se os testes passarem, está funcionando!
