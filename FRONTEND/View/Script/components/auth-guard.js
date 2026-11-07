/**
 * Verifica autenticação antes de carregar páginas protegidas.
 * Desative com data-require-auth="false" no <body>.
 */
(function authGuard() {
  if (document.body?.dataset.requireAuth === 'false') return;

  const tokenKey = window.CONFIG?.STORAGE_KEYS?.TOKEN || 'safebite_token';
  if (!localStorage.getItem(tokenKey)) {
    const destino = window.ROUTES?.authPage?.('inicio')
      || window.ROUTES?.url?.(window.ROUTES?.auth?.inicio || 'autenticacao/inicio.html')
      || '/Index/autenticacao/inicio.html';
    window.location.href = destino;
  }
})();
