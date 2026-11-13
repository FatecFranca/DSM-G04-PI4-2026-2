// Formata números no padrão brasileiro: 1.234,5
export function fmt(valor, casas = 0) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '--';
  const [inteiro, decimais] = Math.abs(valor).toFixed(casas).split('.');
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${valor < 0 ? '-' : ''}${comMilhar}${decimais ? ',' + decimais : ''}`;
}

// "agora", "há 5 s", "há 2 min"...
export function relativo(ms) {
  const s = Math.round(ms / 1000);
  if (s < 3) return 'agora';
  if (s < 60) return `há ${s} s`;
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  return `há ${Math.floor(s / 3600)} h`;
}

const dois = (n) => String(n).padStart(2, '0');

// "14:05:09"
export function horaAgora() {
  const d = new Date();
  return `${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}`;
}
