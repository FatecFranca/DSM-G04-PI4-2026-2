export function fmt(valor, casas = 0) {
  if (valor === null || valor === undefined) {
    return '--';
  }

  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function horaAgora() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function relativo(ms) {
  const segundos = Math.floor(ms / 1000);

  if (segundos < 60) return `há ${segundos}s`;

  const minutos = Math.floor(segundos / 60);

  if (minutos < 60) return `há ${minutos}min`;

  return `há ${Math.floor(minutos / 60)}h`;
}