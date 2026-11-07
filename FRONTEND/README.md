# SafeBite Frontend

Frontend da aplicação SafeBite — plataforma de receitas com foco em restrições alimentares.

## Início rápido (frontend + backend)

### 1. Backend (porta 3001)

```bash
cd BACKEND
npm install
cp env.example .env   # configure MongoDB, JWT, etc.
npm run dev
```

No `.env` do backend, confirme:

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend (porta 3000)

```bash
cd FRONTEND
npm install
npm start
```

O navegador abrirá em `http://localhost:3000/Index/autenticacao/inicio.html`.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm start` | Servidor na porta 3000 + abre a landing |
| `npm run dev` | Igual ao start, sem cache |
| `npm run serve` | Servidor sem abrir o navegador |

## Estrutura

```
FRONTEND/
├── View/
│   ├── Index/
│   │   ├── autenticacao/     # Fluxo público (login, cadastro)
│   │   ├── home.html         # Menu principal (logado)
│   │   ├── receitas.html
│   │   ├── publicacoes.html
│   │   ├── receita-formulario.html
│   │   ├── receita-detalhe.html
│   │   ├── perfil.html
│   │   └── ...
│   ├── Script/
│   │   ├── config.js         # URLs do backend
│   │   ├── routes.js         # Rotas centralizadas
│   │   ├── api.service.js    # Cliente HTTP da API
│   │   ├── components/       # layout.js, auth-guard.js
│   │   └── ...
│   ├── Estilos/
│   └── Images/
├── config.example.js
└── package.json
```

## Mapa de páginas

| Página | Arquivo |
|--------|---------|
| Landing | `autenticacao/inicio.html` |
| Cadastro | `autenticacao/cadastro.html` |
| Login | `autenticacao/login.html` |
| Restrições (onboarding) | `autenticacao/restricoes.html` |
| Home | `home.html` |
| Receitas | `receitas.html` |
| Detalhe da receita | `receita-detalhe.html` |
| Publicações | `publicacoes.html` |
| Criar/editar receita | `receita-formulario.html` |
| Perfil | `perfil.html` |
| Suporte | `suporte.html` |

## Integração com o backend

Toda comunicação passa por `View/Script/api.service.js`, configurado em `View/Script/config.js`:

```javascript
const CONFIG = {
  API_BASE_URL: 'http://localhost:3001/api',  // REST API
  SERVER_URL: 'http://localhost:3001',          // Imagens/uploads
  REQUEST_TIMEOUT: 30000
};
```

- **Autenticação:** token JWT em `localStorage` (`safebite_token`)
- **Imagens:** use `CONFIG.resolveMediaUrl()` ou `resolveMediaUrl()` de `utils.js`
- **Rotas internas:** `View/Script/routes.js` (`ROUTES.auth.*`, `ROUTES.app.*`)

Para outro ambiente, copie `config.example.js` → `config.local.js` e inclua após `config.js` nas páginas.

## Componentes compartilhados

Páginas autenticadas usam:

```html
<body data-active-nav="receitas" data-show-back="false" data-asset-base="../">
  <div id="app-shell"></div>
  ...
  <script src="../Script/config.js"></script>
  <script src="../Script/routes.js"></script>
  <script src="../Script/api.service.js"></script>
  <script src="../Script/utils.js"></script>
  <script src="../Script/components/auth-guard.js"></script>
  <script src="../Script/components/layout.js"></script>
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| CORS | Backend rodando? `CORS_ORIGIN=http://localhost:3000` no `.env` |
| Erro de conexão | Verifique `API_BASE_URL` em `config.js` |
| Imagens não carregam | Verifique `SERVER_URL` e pasta `BACKEND/uploads` |
| 401 / redirect login | Token expirado — faça login novamente |
| CSS antigo / sem mudança visual | Pare o servidor, rode `npm start` (cache desativado) e force recarregar com `Ctrl+Shift+R`. Confirme que a URL é `http://localhost:3000/Index/...` |

---

**SafeBite Team**
Alunos: Amanda Cristina Olegário, Gabriel Sanches Martins, Lauana dos Santos, Luis Eduardo Campos.
