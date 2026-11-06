
const $ = id => document.getElementById(id);

const numero = (n, casas = 0) =>
  Number(n || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });

// Cálculos estatísticos
const media = valores =>
  valores.length
    ? valores.reduce((a, b) => a + b, 0) / valores.length
    : 0;

const desvio = valores => {
  if (valores.length < 2) return 0;

  const m = media(valores);

  return Math.sqrt(
    valores.reduce((s, n) => s + (n - m) ** 2, 0)
    / (valores.length - 1)
  );
};

function regressao(registros) {
  if (registros.length < 2) {
    return { a: 0, b: 0, r: 0, r2: 0 };
  }

  const mx = media(registros.map(d => d.peso));
  const my = media(registros.map(d => d.calorias));

  let sxx = 0;
  let syy = 0;
  let sxy = 0;

  for (const d of registros) {
    const x = d.peso - mx;
    const y = d.calorias - my;

    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }

  const b = sxx ? sxy / sxx : 0;
  const a = my - b * mx;
  const r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;

  return { a, b, r, r2: r * r };
}

// Preparação dos gráficos em Canvas
function superficie(id) {
  const canvas = $(id);
  const largura = Math.max(canvas.clientWidth, 250);
  const altura = 275;
  const dpi = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = largura * dpi;
  canvas.height = altura * dpi;

  const ctx = canvas.getContext("2d");

  ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
  ctx.clearRect(0, 0, largura, altura);

  return {
    ctx,
    w: largura,
    h: altura,
    left: 48,
    top: 20,
    right: 15,
    bottom: 28
  };
}

function eixos(p, maximo) {
  const { ctx, w, h, left, top, right, bottom } = p;

  ctx.font = "11px Arial";
  ctx.textAlign = "right";

  for (let i = 0; i <= 4; i++) {
    const y = top + (h - top - bottom) * i / 4;

    ctx.strokeStyle = "#e4ece8";
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(w - right, y);
    ctx.stroke();

    ctx.fillStyle = "#6b7f75";
    ctx.fillText(
      numero(maximo * (1 - i / 4)),
      left - 6,
      y + 4
    );
  }
}

// Gráfico de consumo diário
function graficoDiario(registros, meta) {
  const p = superficie("grafico-diario");
  const { ctx, w, h, left, top, right, bottom } = p;

  const porDia = new Map();

  for (const d of registros) {
    porDia.set(
      d.data,
      (porDia.get(d.data) || 0) + d.calorias
    );
  }

  const pontos = [...porDia.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]));

  if (!pontos.length) return;

  const max = Math.max(
    meta,
    ...pontos.map(d => d[1]),
    1
  ) * 1.1;

  eixos(p, max);

  const x = i =>
    left + i * (w - left - right)
    / Math.max(pontos.length - 1, 1);

  const y = v =>
    h - bottom - v / max * (h - top - bottom);

  // Linha da meta
  ctx.strokeStyle = "#e3a34b";
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(left, y(meta));
  ctx.lineTo(w - right, y(meta));
  ctx.stroke();
  ctx.setLineDash([]);

  // Linha do consumo
  ctx.strokeStyle = "#15966a";
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  pontos.forEach((d, i) =>
    i
      ? ctx.lineTo(x(i), y(d[1]))
      : ctx.moveTo(x(i), y(d[1]))
  );

  ctx.stroke();
  ctx.lineWidth = 1;

  ctx.fillStyle = "#6b7f75";
  ctx.textAlign = "left";
  ctx.font = "11px Arial";
  ctx.fillText(pontos[0][0].slice(5), left, h - 7);

  ctx.textAlign = "right";
  ctx.fillText(pontos.at(-1)[0].slice(5), w - right, h - 7);
}

// Histograma com curva normal teórica
function graficoNormal(registros) {
  const p = superficie("grafico-normal");
  const { ctx, w, h, left, top, right, bottom } = p;

  if (!registros.length) return;

  const valores = registros.map(d => d.calorias);
  const mu = media(valores);
  const sigma = desvio(valores);

  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const n = 16;

  const passo = (maximo - minimo || 1) / n;
  const contagens = Array(n).fill(0);

  valores.forEach(v => {
    const indice = Math.min(
      n - 1,
      Math.floor((v - minimo) / passo)
    );
    contagens[indice]++;
  });

  // Aproximação pela densidade normal
  const normal = x => sigma
    ? valores.length * passo
      * Math.exp(-0.5 * ((x - mu) / sigma) ** 2)
      / (sigma * Math.sqrt(2 * Math.PI))
    : 0;

  const limite = Math.max(
    ...contagens,
    normal(mu),
    1
  ) * 1.12;

  eixos(p, limite);

  const cw = (w - left - right) / n;
  const area = h - top - bottom;

  // Barras do histograma
  contagens.forEach((c, i) => {
    ctx.fillStyle = "#7fd8b9";
    ctx.fillRect(
      left + i * cw + 1,
      h - bottom - c / limite * area,
      Math.max(cw - 2, 1),
      c / limite * area
    );
  });

  // Curva de distribuição normal
  ctx.beginPath();
  ctx.strokeStyle = "#de8b37";
  ctx.lineWidth = 2.5;

  for (let i = 0; i <= 100; i++) {
    const x = minimo + (maximo - minimo) * i / 100;
    const px = left + (w - left - right) * i / 100;
    const py = h - bottom - normal(x) / limite * area;

    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }

  ctx.stroke();
  ctx.lineWidth = 1;

  ctx.fillStyle = "#6b7f75";
  ctx.font = "11px Arial";
  ctx.textAlign = "left";
  ctx.fillText(numero(minimo), left, h - 7);

  ctx.textAlign = "right";
  ctx.fillText(numero(maximo) + " kcal", w - right, h - 7);
}

// Gráfico de dispersão e reta de regressão
function graficoRegressao(registros, modelo) {
  const p = superficie("grafico-regressao");
  const { ctx, w, h, left, top, right, bottom } = p;

  if (!registros.length) return;

  const xmin = Math.min(...registros.map(d => d.peso));
  const xmax = Math.max(...registros.map(d => d.peso));
  const ymax = Math.max(
    ...registros.map(d => d.calorias),
    1
  ) * 1.1;

  eixos(p, ymax);

  const x = v =>
    left + (v - xmin) / (xmax - xmin || 1)
    * (w - left - right);

  const y = v =>
    h - bottom - v / ymax * (h - top - bottom);

  // Exibimos até aproximadamente 800 pontos no gráfico.
  // O cálculo estatístico utiliza todos os registros filtrados.
  ctx.fillStyle = "#15966a33";

  const salto = Math.max(
    1,
    Math.ceil(registros.length / 800)
  );

  for (let i = 0; i < registros.length; i += salto) {
    const d = registros[i];

    ctx.beginPath();
    ctx.arc(x(d.peso), y(d.calorias), 2.2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Reta da regressão linear
  ctx.strokeStyle = "#db8d3c";
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  ctx.moveTo(
    x(xmin),
    y(modelo.a + modelo.b * xmin)
  );

  ctx.lineTo(
    x(xmax),
    y(modelo.a + modelo.b * xmax)
  );

  ctx.stroke();
  ctx.lineWidth = 1;

  ctx.font = "11px Arial";
  ctx.fillStyle = "#6b7f75";
  ctx.textAlign = "left";
  ctx.fillText(xmin + " g", left, h - 7);

  ctx.textAlign = "right";
  ctx.fillText(xmax + " g", w - right, h - 7);
}

// Porcentagem de cada alimento
function participacao(registros) {
  const soma = registros.reduce(
    (a, d) => a + d.calorias, 0
  );

  $("participacao").replaceChildren();

  for (const nome of ["Arroz", "Frango", "Ovo"]) {
    const total = registros
      .filter(d => d.alimento === nome)
      .reduce((a, d) => a + d.calorias, 0);

    const pct = soma ? 100 * total / soma : 0;

    const linha = document.createElement("div");
    linha.className = "linha-porcentagem";

    const descricao = document.createElement("div");
    const titulo = document.createElement("strong");
    titulo.textContent = nome;

    const valor = document.createElement("span");
    valor.textContent = numero(pct, 1) + "%";

    descricao.append(titulo, valor);

    const fundo = document.createElement("div");
    fundo.className = "barra";

    const barra = document.createElement("span");
    barra.style.width = pct + "%";

    fundo.append(barra);
    linha.append(descricao, fundo);

    $("participacao").append(linha);
  }
}

// Atualização dos filtros e indicadores
function atualizar() {
  const tipo = $("alimento").value;
  const inicio = $("inicio").value;
  const fim = $("fim").value;

  const meta = Number($("meta").value) > 0
    ? Number($("meta").value)
    : 2000;

  const dados = window.SafeBiteDados.filter(d =>
    (tipo === "Todos" || d.alimento === tipo) &&
    (!inicio || d.data >= inicio) &&
    (!fim || d.data <= fim)
  );

  window.SafeBiteFiltrados = dados;

  const calorias = dados.map(d => d.calorias);
  const total = calorias.reduce((a, b) => a + b, 0);
  const alertas = dados.filter(d => d.alarme).length;

  $("total-pratos").textContent = numero(dados.length);
  $("total-kcal").textContent = numero(total, 1) + " kcal";
  $("media-kcal").textContent = numero(media(calorias), 1) + " kcal";
  $("desvio-kcal").textContent = numero(desvio(calorias), 1) + " kcal";
  $("alarmes").textContent = numero(alertas);

  $("percent-alarmes").textContent =
    numero(dados.length ? 100 * alertas / dados.length : 0, 1) + "%";

  $("temperatura").textContent =
    numero(media(dados.map(d => d.temperatura)), 1) + " °C";

  $("umidade").textContent =
    numero(media(dados.map(d => d.umidade)), 1) + "%";

  // Dias dentro da meta
  const dias = new Map();

  for (const d of dados) {
    dias.set(
      d.data,
      (dias.get(d.data) || 0) + d.calorias
    );
  }

  const dentro = [...dias.values()]
    .filter(t => t <= meta).length;

  $("resumo-meta").textContent =
    `${dentro} de ${dias.size} dias ficaram dentro da meta de ${numero(meta)} kcal.`;

  // Regressão e correlação
  const m = regressao(dados);

  $("resultado-regressao").textContent =
    `y = ${numero(m.a, 2)} + ${numero(m.b, 3)} × x | ` +
    `Correlação (r): ${numero(m.r, 3)} | R²: ${numero(m.r2, 3)}.`;

  // Tabela dos últimos 15 registros filtrados
  const tbody = $("tabela-registros");
  tbody.replaceChildren();

  dados.slice(-15).reverse().forEach(d => {
    const tr = document.createElement("tr");

    [
      d.data,
      d.alimento,
      d.peso + " g",
      numero(d.calorias, 2) + " kcal",
      d.alarme ? "Disparou" : "Normal"
    ].forEach(v => {
      const td = document.createElement("td");
      td.textContent = v;
      tr.append(td);
    });

    tbody.append(tr);
  });

  graficoDiario(dados, meta);
  participacao(dados);
  graficoNormal(dados);
  graficoRegressao(dados, m);
}

// Exportação dos registros filtrados
function exportarCSV() {
  const cabecalho = [
    "ID", "Data", "Alimento", "Peso (g)",
    "Calorias (kcal)", "Calorias do dia", "Meta",
    "Temperatura (°C)", "Umidade (%)",
    "Alarme", "Alarmes no dia"
  ];

  const linhas = window.SafeBiteFiltrados.map(d => [
    d.id,
    d.data,
    d.alimento,
    d.peso,
    d.calorias,
    d.caloriasDia,
    d.meta,
    d.temperatura,
    d.umidade,
    d.alarme ? "SIM" : "NAO",
    d.alarmesDia
  ].join(";"));

  const csv = "\uFEFF" + [
    cabecalho.join(";"),
    ...linhas
  ].join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" })
  );

  const a = document.createElement("a");
  a.href = url;
  a.download = "safebite-registros.csv";

  document.body.append(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  const dados = window.SafeBiteDados;

  $("inicio").min = $("fim").min = dados[0].data;
  $("inicio").max = $("fim").max = dados.at(-1).data;

  $("inicio").value = dados[0].data;
  $("fim").value = dados.at(-1).data;

  $("filtrar").addEventListener("click", atualizar);

  ["alimento", "inicio", "fim", "meta"].forEach(id =>
    $(id).addEventListener("change", atualizar)
  );

  $("exportar").addEventListener("click", exportarCSV);
  window.addEventListener("resize", atualizar);

  atualizar();
});
