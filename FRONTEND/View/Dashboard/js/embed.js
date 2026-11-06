
if (new URLSearchParams(location.search).get("embed") === "1") {
  document.documentElement.classList.add("incorporado");

  const ajustarAltura = () => {
    if (!window.frameElement) return;

    const altura = Math.ceil(
      document.documentElement.scrollHeight + 12
    );

    if (Math.abs(window.frameElement.clientHeight - altura) > 8) {
      window.frameElement.style.height = `${altura}px`;
    }
  };

  window.addEventListener("load", ajustarAltura);

  if (window.ResizeObserver) {
    new ResizeObserver(ajustarAltura).observe(document.body);
  }
}
