// Cálculos puros para uso na tela mobile e em testes Node.js.
const MEDIA_VAZIA = 0;
const numero = (valor, casas = 0) => Number(valor || 0).toLocaleString('pt-BR', {
  minimumFractionDigits: casas,
  maximumFractionDigits: casas,
});

const media = valores => valores.length
  ? valores.reduce((total, valor) => total + valor, 0) / valores.length
  : MEDIA_VAZIA;

function desvioAmostral(valores) {
  if (valores.length < 2) return 0;
  const m = media(valores);
  return Math.sqrt(valores.reduce((soma, valor) => soma + (valor - m) ** 2, 0)
    / (valores.length - 1));
}

function regressao(registros) {
  if (registros.length < 2) return { a: 0, b: 0, r: 0, r2: 0 };
  const mx = media(registros.map(item => item.peso));
  const my = media(registros.map(item => item.calorias));
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const item of registros) {
    const x = item.peso - mx;
    const y = item.calorias - my;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  const b = sxx ? sxy / sxx : 0;
  const a = my - b * mx;
  const r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
  return { a, b, r, r2: r * r };
}

function dataValida(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const [ano, mes, dia] = data.split('-').map(Number);
  const normalizada = new Date(Date.UTC(ano, mes - 1, dia));
  return normalizada.getUTCFullYear() === ano
    && normalizada.getUTCMonth() === mes - 1
    && normalizada.getUTCDate() === dia;
}

function validarFiltros({ inicio, fim, meta }) {
  if (!dataValida(inicio) || !dataValida(fim)) {
    return 'Informe datas válidas no formato AAAA-MM-DD.';
  }
  if (inicio > fim) return 'A data inicial deve ser anterior ou igual à data final.';
  if (!Number.isFinite(meta) || meta <= 0 || meta > 100000) {
    return 'A meta deve ser maior que zero e de até 100.000 kcal.';
  }
  return null;
}

function analisarRegistros(registros, filtros) {
  const { alimento = 'Todos', inicio = '', fim = '', meta = 2000 } = filtros;
  const filtrados = registros.filter(item =>
    (alimento === 'Todos' || item.alimento === alimento)
    && (!inicio || item.data >= inicio)
    && (!fim || item.data <= fim));

  const calorias = filtrados.map(item => item.calorias);
  const total = calorias.reduce((soma, kcal) => soma + kcal, 0);
  const alarmes = filtrados.reduce((quantidade, item) => quantidade + Number(item.alarme), 0);
  const porAlimento = { Arroz: 0, Frango: 0, Ovo: 0 };
  const porDia = new Map();

  for (const item of filtrados) {
    porAlimento[item.alimento] += item.calorias;
    porDia.set(item.data, (porDia.get(item.data) || 0) + item.calorias);
  }

  const dias = [...porDia.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([data, kcal]) => ({ data, kcal }));
  const diasNaMeta = dias.filter(d => d.kcal <= meta).length;
  const minimo = calorias.length ? Math.min(...calorias) : 0;
  const maximo = calorias.length ? Math.max(...calorias) : 0;
  const mu = media(calorias);
  const sigma = desvioAmostral(calorias);
  const numeroClasses = 16;
  const passo = (maximo - minimo || 1) / numeroClasses;
  const histograma = Array(numeroClasses).fill(0);
  calorias.forEach(valor => {
    const i = Math.min(numeroClasses - 1, Math.floor((valor - minimo) / passo));
    histograma[i]++;
  });
  const normal = x => sigma
    ? calorias.length * passo * Math.exp(-0.5 * ((x - mu) / sigma) ** 2)
      / (sigma * Math.sqrt(2 * Math.PI))
    : 0;
  const curvaNormal = Array.from({ length: 65 }, (_, i) => normal(
    minimo + (maximo - minimo) * (i / 64)));

  return {
    registros: filtrados,
    quantidade: filtrados.length,
    total,
    media: mu,
    desvio: sigma,
    alarmes,
    percentualAlarmes: filtrados.length ? alarmes * 100 / filtrados.length : 0,
    temperatura: media(filtrados.map(item => item.temperatura)),
    umidade: media(filtrados.map(item => item.umidade)),
    dias,
    diasNaMeta,
    porAlimento: Object.fromEntries(Object.entries(porAlimento)
      .map(([nome, kcal]) => [nome, { kcal, percentual: total ? kcal / total * 100 : 0 }])),
    minimo,
    maximo,
    histograma,
    curvaNormal,
    modelo: regressao(filtrados),
    recentes: filtrados.slice(-15).reverse(),
  };
}

function csvRegistros(registros) {
  const cabecalho = [
    'ID', 'Data', 'Alimento', 'Peso (g)', 'Calorias (kcal)', 'Calorias do dia',
    'Meta', 'Temperatura (°C)', 'Umidade (%)', 'Alarme', 'Alarmes no dia',
  ];
  const linhas = registros.map(item => [
    item.id, item.data, item.alimento, item.peso, item.calorias, item.caloriasDia,
    item.meta, item.temperatura, item.umidade, item.alarme ? 'SIM' : 'NAO', item.alarmesDia,
  ].join(';'));
  return '\uFEFF' + [cabecalho.join(';'), ...linhas].join('\r\n');
}

module.exports = { numero, media, desvioAmostral, regressao, dataValida, validarFiltros, analisarRegistros, csvRegistros };