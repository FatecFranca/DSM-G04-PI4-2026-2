/** Redireciona imediatamente para a nova URL da página. */
(function redirectPage(target) {
  const url = new URL(target, window.location.href).href;
  window.location.replace(url);
})(document.currentScript?.dataset?.target || '/');
