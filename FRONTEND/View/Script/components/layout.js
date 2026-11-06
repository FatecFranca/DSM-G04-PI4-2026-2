/**
 * Layout compartilhado: cabeçalho, menu lateral, overlay e botão voltar.
 */
const SafeBiteLayout = {
  get navItems() {
    const r = window.ROUTES?.app || {};
    const to = (path) => window.ROUTES?.url?.(path) || path;
    return [
      { id: 'inicio', href: to(r.home || 'home.html'), label: 'Início' },
      { id: 'dashboard', href: to(r.dashboard || 'dashboard.html'), label: 'Dashboard' },
      { id: 'instrucoes', href: to(r.instrucoes || 'instrucoes.html'), label: 'Instruções' },
      { id: 'receitas', href: to(r.receitas || 'receitas.html'), label: 'Receitas' },
      { id: 'publicacoes', href: to(r.publicacoes || 'publicacoes.html'), label: 'Publicações' },
      { id: 'suporte', href: to(r.suporte || 'suporte.html'), label: 'Suporte' }
    ];
  },

  DEVELOPERS: [
    'Amanda C. Olegário',
    'Gabriel Sanches Martins',
    'Luis Eduardo de Campos',
    'Lauana dos Santos'
  ],

  customGoBack: null,
  ready: false,

  getAssetPath(relativePath) {
    const base = document.body?.dataset.assetBase || '../';
    return `${base}${relativePath}`;
  },

  ensureStylesheet() {
    const alreadyLoaded = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some((link) => /app-shell\.css/i.test(link.getAttribute('href') || link.href));
    if (alreadyLoaded) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = this.getAssetPath('Estilos/app-shell.css');
    document.head.appendChild(link);
  },

  renderShell() {
    const shell = document.getElementById('app-shell');
    if (!shell) return;

    const activeNav = document.body?.dataset.activeNav || '';
    const showBack = document.body?.dataset.showBack === 'true';

    const navLinks = this.navItems.map((item) => {
      const isActive = activeNav === item.id;
      return `<li><a href="${item.href}"${isActive ? ' aria-current="page"' : ''}>${item.label}</a></li>`;
    }).join('');

    const devList = this.DEVELOPERS.map((name) => `<p>${name}</p>`).join('');

    shell.innerHTML = `
      <header class="titulo" role="banner">
        <button id="btn_menu_vertical" aria-expanded="false" aria-controls="menu_vertical"
                class="menu-alternar" type="button" data-menu-button>
          <img src="${this.getAssetPath('Images/menu_vertical.png')}" alt="Abrir menu">
        </button>
        <div class="safe-bite" aria-hidden="false">
          <img src="${this.getAssetPath('Images/titulo.png')}" alt="Safe Bite">
          <p><strong>Uma mordida sempre pode ser saudável!</strong></p>
        </div>
        <button id="btn_perfil" class="perfil" aria-label="Perfil" type="button">
          <img id="foto-perfil-header" src="" alt="Foto de perfil" style="display: none;">
          <div id="iniciais-perfil-header" class="iniciais-perfil-header"></div>
        </button>
      </header>
      <div class="overlay" id="overlay" tabindex="-1" hidden></div>
      <nav class="menu_vertical" id="menu_vertical" aria-hidden="true" role="navigation">
        <ul>${navLinks}</ul>
        <div class="devs">
          <h3>Desenvolvedores:</h3>
          ${devList}
        </div>
      </nav>
      ${showBack ? '<button id="btn_voltar" class="btn-voltar" aria-label="Voltar">Voltar</button>' : ''}
    `;
  },

  openMenu() {
    const menu = document.getElementById('menu_vertical');
    const overlay = document.getElementById('overlay');
    const btnMenu = document.getElementById('btn_menu_vertical');
    if (!menu || !overlay || !btnMenu) return;

    menu.classList.add('active');
    overlay.classList.add('active');
    overlay.hidden = false;
    document.body.classList.add('menu-open');
    btnMenu.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
  },

  closeMenu() {
    const menu = document.getElementById('menu_vertical');
    const overlay = document.getElementById('overlay');
    const btnMenu = document.getElementById('btn_menu_vertical');
    if (!menu || !overlay || !btnMenu) return;

    menu.classList.remove('active');
    overlay.classList.remove('active');
    overlay.hidden = true;
    document.body.classList.remove('menu-open');
    btnMenu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  },

  toggleMenu() {
    const menu = document.getElementById('menu_vertical');
    if (!menu) return;
    if (menu.classList.contains('active')) this.closeMenu();
    else this.openMenu();
  },

  goBack() {
    if (typeof this.customGoBack === 'function') {
      this.customGoBack();
      return;
    }
    if (history.length > 1) history.back();
    else window.location.href = window.ROUTES?.appPage?.('home') || window.ROUTES?.url?.('home.html') || '/Index/home.html';
  },

  perfilClick() {
    window.location.href = window.ROUTES?.appPage?.('perfil') || window.ROUTES?.url?.('perfil.html') || '/Index/perfil.html';
  },

  bindEvents() {
    const btnMenu = document.getElementById('btn_menu_vertical');
    const overlay = document.getElementById('overlay');
    const btnVoltar = document.getElementById('btn_voltar');
    const btnPerfil = document.getElementById('btn_perfil');
    const menu = document.getElementById('menu_vertical');
    const menuLinks = menu ? Array.from(menu.querySelectorAll('a')) : [];

    btnMenu?.addEventListener('click', () => this.toggleMenu());
    overlay?.addEventListener('click', () => this.closeMenu());
    btnVoltar?.addEventListener('click', () => this.goBack());
    btnPerfil?.addEventListener('click', () => this.perfilClick());

    if (window.attachInteractiveEffects) {
      attachInteractiveEffects(btnMenu);
      attachInteractiveEffects(btnVoltar);
      attachInteractiveEffects(btnPerfil);
      menuLinks.forEach((link) => attachInteractiveEffects(link));
    }

    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && menu?.classList.contains('active')) {
        this.closeMenu();
      }
    });

    if (menu && !menu.classList.contains('active')) {
      overlay.hidden = true;
      overlay?.classList.remove('active');
      document.body.classList.remove('menu-open');
      btnMenu?.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }
  },

  async init() {
    this.ensureStylesheet();
    this.renderShell();
    this.bindEvents();

    window.toggleMenu = () => this.toggleMenu();
    window.closeMenu = () => this.closeMenu();
    window.goBack = () => this.goBack();
    window.perfilClick = () => this.perfilClick();

    if (window.carregarFotoPerfilHeader) {
      await window.carregarFotoPerfilHeader();
    }

    this.ready = true;
    document.dispatchEvent(new Event('safebite:layout-ready'));
  }
};

window.SafeBiteLayout = SafeBiteLayout;

window.onSafeBiteReady = function onSafeBiteReady(callback) {
  if (typeof callback !== 'function') return;
  if (SafeBiteLayout.ready) {
    callback();
    return;
  }
  document.addEventListener('safebite:layout-ready', callback, { once: true });
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('app-shell')) {
    SafeBiteLayout.init();
  } else {
    SafeBiteLayout.ready = true;
    document.dispatchEvent(new Event('safebite:layout-ready'));
  }
});
