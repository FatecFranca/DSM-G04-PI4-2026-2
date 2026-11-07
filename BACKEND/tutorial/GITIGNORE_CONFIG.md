# 📝 Configuração do .gitignore

Este documento explica a configuração do `.gitignore` para o projeto SafeBite Backend.

## ✅ O que está sendo ignorado

### 🔒 Arquivos Sensíveis
- `.env` e variações (`.env.local`, `.env.production`, etc.)
- Arquivos de chaves e certificados (`.pem`, `.key`, `.cert`, `.crt`)
- Pasta `secrets/` e `.secrets`

### 📦 Dependências
- `node_modules/` - Dependências do npm
- Arquivos de lock de backup (`package-lock.json.backup`, `yarn.lock.backup`)
- Cache de package managers (`.pnp`, `.pnp.js`, `.pnpm-store/`)

### 🗄️ Banco de Dados
- Arquivos de dump (`.sql`, `.dump`)
- Bancos de dados locais (`.db`, `.sqlite`, `.sqlite3`)
- Pastas de dados do PostgreSQL (`pgdata/`, `postgres-data/`)

### 📁 Uploads e Arquivos de Usuário
- Todos os arquivos em `uploads/` (exceto `.gitkeep`)
- Arquivos temporários (`.tmp`, `.temp`)

### 🧪 Testes e Coverage
- Pasta `coverage/` - Relatórios de cobertura de testes
- Cache do Jest (`.jest/`)
- Arquivos de snapshot de teste (`.test.js.snap`)
- Relatórios LCOV (`.lcov`)

### 🏗️ Build e Compilação
- Pastas de build (`dist/`, `build/`, `out/`)
- Cache de frameworks (`.next/`, `.nuxt/`, `.cache/`, `.parcel-cache/`)

### 💻 IDE e Editores
- Configurações do VS Code (`.vscode/`)
- Configurações do IntelliJ/WebStorm (`.idea/`)
- Arquivos temporários de editores (`.swp`, `.swo`, `*~`)
- Workspaces (`.code-workspace`, `.sublime-workspace`)

### 📝 Logs
- Todos os arquivos de log (`.log`)
- Logs do npm, yarn, pnpm
- Pasta `logs/`

### 🖥️ Sistema Operacional
- Arquivos do macOS (`.DS_Store`, `.Spotlight-V100`, `.Trashes`)
- Arquivos do Windows (`Thumbs.db`, `Desktop.ini`)
- Arquivos ocultos do sistema (`.AppleDouble`, `.LSOverride`)

### 🔄 Backups e Temporários
- Arquivos de backup (`.bak`, `.backup`, `.old`)
- Pastas temporárias (`tmp/`, `temp/`)
- Backups de migrações e seeds (`migrations/backup/`, `seeds/backup/`)

## ✅ O que NÃO está sendo ignorado (será commitado)

### 📋 Arquivos do Projeto
- ✅ `package.json` e `package-lock.json`
- ✅ Código-fonte em `src/`
- ✅ Arquivos de configuração (`.gitignore`, `README.md`)
- ✅ Migrações em `migrations/` (arquivos `.js` de migração)
- ✅ Seeds em `seeds/` (arquivos `.js` de seed)
- ✅ Testes em `tests/`
- ✅ Arquivos `.gitkeep` em pastas vazias

### 📁 Estrutura de Pastas
As seguintes pastas são mantidas no Git através de arquivos `.gitkeep`:
- `uploads/.gitkeep` - Mantém a pasta de uploads
- `migrations/.gitkeep` - Mantém a pasta de migrações
- `seeds/.gitkeep` - Mantém a pasta de seeds

## 🔍 Como verificar o que está sendo ignorado

### Verificar se um arquivo está sendo ignorado:
```bash
git check-ignore -v caminho/do/arquivo
```

### Ver todos os arquivos ignorados:
```bash
git status --ignored
```

### Ver arquivos que serão commitados:
```bash
git status
```

## ⚠️ Importante

### Arquivos que NUNCA devem ser commitados:
1. **`.env`** - Contém credenciais e informações sensíveis
2. **`node_modules/`** - Dependências (instaladas via `npm install`)
3. **Arquivos de chaves privadas** - `.pem`, `.key`, certificados
4. **Dumps de banco de dados** - Podem conter dados sensíveis
5. **Arquivos de upload** - Podem ser grandes e conter dados de usuários

### Arquivos que DEVEM ser commitados:
1. **`package.json`** - Lista de dependências
2. **`package-lock.json`** - Versões exatas das dependências
3. **Código-fonte** - Todo o código em `src/`
4. **Migrações** - Arquivos de migração do banco de dados
5. **Seeds** - Arquivos de dados iniciais
6. **Testes** - Arquivos de teste
7. **Configurações** - `.gitignore`, `README.md`, etc.

## 🔧 Personalização

Se precisar adicionar mais padrões ao `.gitignore`:

1. Abra o arquivo `.gitignore`
2. Adicione o padrão na seção apropriada
3. Use comentários para documentar (`# Comentário`)

### Exemplos de padrões:
```gitignore
# Ignorar um arquivo específico
arquivo.txt

# Ignorar uma pasta
pasta/

# Ignorar todos os arquivos com extensão
*.extensao

# Ignorar arquivos em qualquer pasta
**/arquivo.txt

# Não ignorar (exceção)
!arquivo.txt
```

## 📚 Referências

- [Documentação do Git - gitignore](https://git-scm.com/docs/gitignore)
- [Gitignore templates](https://github.com/github/gitignore)

## ✅ Checklist de Segurança

Antes de fazer commit, verifique:

- [ ] `.env` não está no repositório
- [ ] `node_modules/` não está no repositório
- [ ] Não há chaves privadas ou certificados
- [ ] Não há dumps de banco de dados
- [ ] Não há arquivos de upload grandes
- [ ] Credenciais não estão hardcoded no código
- [ ] `package.json` e `package-lock.json` estão commitados
- [ ] Migrações e seeds estão commitados (se existirem)

## 🚀 Próximos Passos

1. Verifique o status do Git: `git status`
2. Adicione os arquivos necessários: `git add .`
3. Verifique novamente: `git status`
4. Certifique-se de que `.env` não está na lista
5. Faça o commit: `git commit -m "Initial commit"`

