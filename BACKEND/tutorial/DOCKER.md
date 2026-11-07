# 🐳 Guia Docker - SafeBite Backend

Este guia explica como usar Docker para facilitar o desenvolvimento em equipe, especialmente para o banco de dados PostgreSQL.

## 📋 Pré-requisitos

- Docker instalado: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Docker Compose (geralmente vem com Docker Desktop)

## 🚀 Início Rápido

### Opção 1: Apenas Banco de Dados (Recomendado para desenvolvimento)

1. **Iniciar apenas o PostgreSQL:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Verificar se está rodando:**
   ```bash
   docker ps
   ```

3. **Configurar o `.env`:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=safebite_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```

4. **Iniciar o backend normalmente:**
   ```bash
   npm run dev
   ```

### Opção 2: Banco + pgAdmin (Interface Gráfica)

1. **Iniciar todos os serviços:**
   ```bash
   docker-compose up -d
   ```

2. **Acessar pgAdmin:**
   - URL: http://localhost:5050
   - Email: `admin@safebite.com` (ou o configurado em `.env`)
   - Senha: `admin` (ou o configurado em `.env`)

3. **Conectar ao banco no pgAdmin:**
   - Host: `postgres` (nome do serviço no Docker)
   - Port: `5432`
   - Database: `safebite_db`
   - Username: `postgres`
   - Password: `postgres`

## 📝 Comandos Úteis

### Gerenciar Containers

```bash
# Iniciar serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Parar e remover volumes (⚠️ apaga dados)
docker-compose down -v

# Ver logs
docker-compose logs -f postgres

# Ver status
docker-compose ps
```

### Acessar o Banco de Dados

```bash
# Via psql dentro do container
docker-compose exec postgres psql -U postgres -d safebite_db

# Ou via linha de comando local (se tiver psql instalado)
psql -h localhost -U postgres -d safebite_db
```

### Resetar o Banco de Dados

```bash
# Parar e remover volumes
docker-compose down -v

# Iniciar novamente
docker-compose up -d
```

## ⚙️ Configuração Avançada

### Variáveis de Ambiente no Docker Compose

Você pode criar um arquivo `.env` na raiz do projeto e o Docker Compose irá usar automaticamente:

```env
# .env
DB_NAME=safebite_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432
PGADMIN_EMAIL=admin@safebite.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050
```

### Personalizar Portas

Se a porta 5432 já estiver em uso, você pode alterar no `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Porta externa:porta interna
```

E atualizar o `.env` do backend:
```env
DB_PORT=5433
```

## 🔧 Troubleshooting

### Porta já em uso

```bash
# Verificar o que está usando a porta
netstat -ano | findstr :5432  # Windows
lsof -i :5432                  # Mac/Linux

# Ou alterar a porta no docker-compose.yml
```

### Container não inicia

```bash
# Ver logs
docker-compose logs postgres

# Verificar se o container existe
docker ps -a

# Remover e recriar
docker-compose down
docker-compose up -d
```

### Dados não persistem

Certifique-se de que os volumes estão configurados corretamente. Os dados são salvos em volumes Docker que persistem mesmo após parar os containers.

### Conectar de fora do Docker

Se você precisar conectar de outra máquina ou ferramenta:

- **Host:** `localhost` (ou IP da máquina)
- **Port:** `5432` (ou a porta configurada)
- **Database:** `safebite_db`
- **Username:** `postgres`
- **Password:** `postgres`

## 👥 Trabalho em Equipe

### Para o Time

1. **Cada desenvolvedor clona o repositório**

2. **Inicia o banco de dados:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Configura o `.env` local:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=safebite_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```

4. **Inicia o backend:**
   ```bash
   npm install
   npm run dev
   ```

### Vantagens

- ✅ Todos usam a mesma versão do PostgreSQL
- ✅ Configuração idêntica para todos
- ✅ Não precisa instalar PostgreSQL localmente
- ✅ Fácil de resetar o banco
- ✅ Dados isolados por projeto

## 📚 Próximos Passos

- [ ] Adicionar scripts de migração automática
- [ ] Configurar seeds automáticos
- [ ] Adicionar backup automático
- [ ] Configurar ambiente de produção

## 🔗 Links Úteis

- [Documentação Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [pgAdmin Docker Hub](https://hub.docker.com/r/dpage/pgadmin4)


