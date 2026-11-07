# 📝 Guia de Configuração do .env

Este documento explica como configurar as variáveis de ambiente do projeto SafeBite Backend.

## 🚀 Configuração Rápida

1. O arquivo `.env` já foi criado na raiz do projeto
2. Edite o arquivo `.env` e ajuste as variáveis conforme necessário
3. As variáveis marcadas com valores padrão podem ser mantidas para desenvolvimento local

## 📋 Variáveis de Ambiente

### Servidor

```env
PORT=3001
NODE_ENV=development
```

- **PORT**: Porta em que o servidor irá rodar (padrão: 3001)
- **NODE_ENV**: Ambiente de execução (`development`, `production`, `test`)

### Banco de Dados PostgreSQL

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=safebite_db
DB_USER=postgres
DB_PASSWORD=postgres
```

- **DB_HOST**: Host do banco de dados (geralmente `localhost` em desenvolvimento)
- **DB_PORT**: Porta do PostgreSQL (padrão: 5432)
- **DB_NAME**: Nome do banco de dados
- **DB_USER**: Usuário do banco de dados
- **DB_PASSWORD**: Senha do banco de dados

⚠️ **Importante**: 
- Certifique-se de que o PostgreSQL está instalado e rodando
- Crie o banco de dados antes de iniciar a aplicação:
  ```sql
  CREATE DATABASE safebite_db;
  ```

### Autenticação JWT

```env
JWT_SECRET=seu_jwt_secret_super_seguro_mude_em_producao_123456789
JWT_EXPIRES_IN=24h
```

- **JWT_SECRET**: Chave secreta para assinar os tokens JWT
  - ⚠️ **CRÍTICO**: Use uma string longa e aleatória em produção
  - Pode gerar uma chave segura com: `openssl rand -base64 32`
- **JWT_EXPIRES_IN**: Tempo de expiração do token (ex: `24h`, `7d`, `30m`)

### Email (Nodemailer)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app
EMAIL_FROM=noreply@safebite.com
```

- **EMAIL_HOST**: Servidor SMTP (Gmail: `smtp.gmail.com`)
- **EMAIL_PORT**: Porta SMTP (Gmail: `587` para TLS)
- **EMAIL_USER**: Email do remetente
- **EMAIL_PASSWORD**: Senha ou senha de app (para Gmail, use senha de app)
- **EMAIL_FROM**: Nome/email que aparecerá como remetente

📧 **Configuração do Gmail**:
1. Ative a verificação em duas etapas
2. Gere uma senha de app: https://myaccount.google.com/apppasswords
3. Use a senha de app no campo `EMAIL_PASSWORD`

### Upload de Arquivos

```env
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,image/webp
```

- **UPLOAD_PATH**: Caminho onde os arquivos serão salvos
- **MAX_FILE_SIZE**: Tamanho máximo em bytes (5MB = 5242880)
- **ALLOWED_FILE_TYPES**: Tipos de arquivo permitidos (separados por vírgula)

### CORS

```env
CORS_ORIGIN=http://localhost:3000
```

- **CORS_ORIGIN**: URL do frontend que terá permissão para acessar a API
- Para desenvolvimento local, geralmente é `http://localhost:3000`
- Para produção, use a URL do seu frontend

### Rate Limiting

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

- **RATE_LIMIT_WINDOW_MS**: Janela de tempo em milissegundos (900000 = 15 minutos)
- **RATE_LIMIT_MAX_REQUESTS**: Número máximo de requisições por IP na janela de tempo

### URLs

```env
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

- **API_BASE_URL**: URL base da API (usado em links gerados)
- **FRONTEND_URL**: URL do frontend (usado em links de emails)

## 🔒 Segurança

### ⚠️ Importante

1. **Nunca commite o arquivo `.env` no Git**
   - O arquivo já está no `.gitignore`
   - Use `env.example` como referência

2. **Em produção**:
   - Use variáveis de ambiente do sistema ou serviço de deploy
   - Gere um `JWT_SECRET` seguro e único
   - Use credenciais de banco de dados seguras
   - Configure CORS apenas para o domínio do frontend

3. **Senhas e secrets**:
   - Use senhas fortes
   - Não compartilhe o arquivo `.env`
   - Rotacione as senhas periodicamente

## ✅ Verificação

Após configurar o `.env`, teste a conexão:

```bash
# Inicie o servidor
npm start

# Ou em modo desenvolvimento
npm run dev
```

O servidor irá:
1. Carregar as variáveis de ambiente
2. Testar a conexão com o banco de dados
3. Exibir mensagens de status no console

## 🐛 Troubleshooting

### Erro de conexão com o banco de dados

- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env`
- Verifique se o banco de dados foi criado
- Teste a conexão manualmente: `psql -U postgres -d safebite_db`

### Erro de porta em uso

- Altere a `PORT` no `.env`
- Ou pare o processo que está usando a porta

### Erro de CORS

- Verifique se a `CORS_ORIGIN` está correta
- Em desenvolvimento, pode usar `*` temporariamente (não recomendado em produção)

## 📚 Referências

- [Documentação do dotenv](https://github.com/motdotla/dotenv)
- [Documentação do Sequelize](https://sequelize.org/)
- [Documentação do JWT](https://jwt.io/)

