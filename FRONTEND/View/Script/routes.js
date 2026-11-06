/**
 * Rotas centralizadas do frontend.
 * Use ROUTES.authPage() / ROUTES.appPage() para navegação (caminhos absolutos).
 */
const ROUTES = {
  /** Prefixo HTTP quando o servidor aponta para a pasta View/ */
  BASE: '/Index',

  auth: {
    inicio: 'autenticacao/inicio.html',
    cadastro: 'autenticacao/cadastro.html',
    login: 'autenticacao/login.html',
    restricoes: 'autenticacao/restricoes.html',
    recuperarSenha: 'autenticacao/recuperar-senha.html',
    confirmarCodigo: 'autenticacao/confirmar-codigo.html',
    senhaAlterada: 'autenticacao/senha-alterada.html'
  },

  app: {
    home: 'home.html',
    dashboard: 'dashboard.html',
    instrucoes: 'instrucoes.html',
    receitas: 'receitas.html',
    receitaDetalhe: 'receita-detalhe.html',
    publicacoes: 'publicacoes.html',
    receitaFormulario: 'receita-formulario.html',
    suporte: 'suporte.html',
    perfil: 'perfil.html'
  },

  /** Caminho absoluto a partir da raiz do servidor (View/) */
  url(path) {
    const normalized = String(path || '').replace(/^\//, '');
    return `${this.BASE}/${normalized}`;
  },

  authPage(key) {
    return this.url(this.auth[key]);
  },

  appPage(key) {
    return this.url(this.app[key]);
  }
};

window.ROUTES = ROUTES;
