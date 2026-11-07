# 📥 Guia Git Clone - SafeBite Backend

Este guia explica como clonar o repositório do SafeBite Backend e configurá-lo para desenvolvimento.

## 📋 Pré-requisitos

- Git instalado: [Download Git](https://git-scm.com/downloads)
- Conta no GitHub/GitLab/Bitbucket (dependendo de onde o repositório está hospedado)
- Acesso ao repositório (permissões de leitura)

## 🚀 Clonando o Repositório

### Método 1: HTTPS (Recomendado para iniciantes)

1. **Copie a URL do repositório:**
   - Acesse o repositório no GitHub/GitLab
   - Clique no botão verde "Code" ou "Clone"
   - Copie a URL HTTPS (exemplo: `https://github.com/usuario/safebite-backend.git`)

2. **Abra o terminal/PowerShell:**
   - Windows: PowerShell ou Git Bash
   - Mac/Linux: Terminal

3. **Navegue até o diretório onde deseja clonar:**

   ```bash
   cd C:\Users\supre\Documents
   ```

4. **Execute o comando git clone:**

   ```bash
   git clone https://github.com/usuario/safebite-backend.git
   ```

5. **Entre no diretório clonado:**
   ```bash
   cd safebite-backend
   ```

### Método 2: SSH (Recomendado para desenvolvedores)

1. **Configure sua chave SSH primeiro:**
   - [Guia GitHub SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

2. **Copie a URL SSH do repositório:**
   - Exemplo: `git@github.com:usuario/safebite-backend.git`

3. **Execute o clone:**
   ```bash
   git clone git@github.com:usuario/safebite-backend.git
   ```

### Método 3: GitHub CLI (Alternativa moderna)

Se você tem GitHub CLI instalado:

```bash
gh repo clone usuario/safebite-backend
```

## 📁 Estrutura Após o Clone

Após clonar, você terá uma estrutura similar a:

```
safebite-backend/
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── src/
├── tutorial/
└── ...
```

## ⚙️ Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

ou

```bash
yarn install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
```

Veja o tutorial [CONFIGURACAO_ENV.md](./CONFIGURACAO_ENV.md) para mais detalhes.

### 3. Configurar Banco de Dados

Se estiver usando Docker:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Veja o tutorial [DOCKER.md](./DOCKER.md) para mais detalhes.

### 4. Executar Migrações (se aplicável)

```bash
npm run migrate
```

ou

```bash
npm run db:migrate
```

### 5. Iniciar o Servidor

```bash
npm run dev
```

## 🔧 Comandos Úteis do Git

### Verificar Status

```bash
# Ver o status do repositório
git status

# Ver informações do repositório remoto
git remote -v
```

### Atualizar o Repositório

```bash
# Buscar atualizações do repositório remoto
git fetch

# Atualizar sua branch local
git pull
```

### Trabalhar com Branches

```bash
# Ver todas as branches
git branch -a

# Criar uma nova branch
git checkout -b minha-feature

# Mudar de branch
git checkout main
```

### Ver Histórico

```bash
# Ver commits recentes
git log --oneline

# Ver mudanças em arquivos
git diff
```

## 🐛 Troubleshooting

### Erro: "Repository not found"

**Causa:** Você não tem acesso ao repositório ou a URL está incorreta.

**Solução:**

- Verifique se você tem permissão de acesso
- Confirme que a URL está correta
- Se for privado, certifique-se de estar autenticado

### Erro: "Permission denied (publickey)"

**Causa:** Problema com autenticação SSH.

**Solução:**

```bash
# Teste sua conexão SSH
ssh -T git@github.com

# Se não funcionar, configure sua chave SSH ou use HTTPS
```

### Erro: "fatal: destination path already exists"

**Causa:** Já existe um diretório com o mesmo nome.

**Solução:**

```bash
# Opção 1: Remover o diretório existente (cuidado!)
rm -rf safebite-backend

# Opção 2: Clonar em um diretório diferente
git clone https://github.com/usuario/safebite-backend.git safebite-backend-novo
```

### Erro: "SSL certificate problem"

**Causa:** Problema com certificado SSL (geralmente em redes corporativas).

**Solução:**

```bash
# Desabilitar verificação SSL (não recomendado para produção)
git config --global http.sslVerify false

# Ou configurar o certificado corretamente
```

### Clone muito lento

**Soluções:**

- Use SSH em vez de HTTPS
- Clone apenas a branch principal: `git clone --single-branch --branch main <url>`
- Use shallow clone: `git clone --depth 1 <url>`

## 📝 Próximos Passos Após o Clone

1. ✅ Ler o `README.md` do projeto
2. ✅ Configurar o arquivo `.env`
3. ✅ Instalar dependências (`npm install`)
4. ✅ Configurar o banco de dados
5. ✅ Executar migrações
6. ✅ Iniciar o servidor de desenvolvimento
7. ✅ Ler os tutoriais na pasta `tutorial/`

## 👥 Trabalho em Equipe

### Para Novos Desenvolvedores

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/usuario/safebite-backend.git
   cd safebite-backend
   ```

2. **Configure o ambiente:**
   - Instale dependências
   - Configure `.env`
   - Configure banco de dados

3. **Crie uma branch para seu trabalho:**

   ```bash
   git checkout -b feature/minha-feature
   ```

4. **Sincronize regularmente:**
   ```bash
   git pull origin main
   ```

### Boas Práticas

- ✅ Sempre faça `git pull` antes de começar a trabalhar
- ✅ Crie branches para novas features
- ✅ Commit mensagens descritivas
- ✅ Nunca commite arquivos `.env` ou `node_modules`
- ✅ Mantenha sua branch atualizada com `main`

## 🔗 Links Úteis

- [Documentação Git](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Configurar SSH no GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

## 📚 Tutoriais Relacionados

- [CONFIGURACAO_ENV.md](./CONFIGURACAO_ENV.md) - Configurar variáveis de ambiente
- [DOCKER.md](./DOCKER.md) - Configurar Docker para desenvolvimento
- [GITIGNORE_CONFIG.md](./GITIGNORE_CONFIG.md) - Configurar .gitignore
