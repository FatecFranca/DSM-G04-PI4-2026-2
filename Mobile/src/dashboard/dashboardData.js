// Base demonstrativa idêntica à usada em FRONTEND/View/Dashboard/js/dados.js.
// Não representa leituras do dispositivo IoT nem informações reais do usuário.
const TAXAS = Object.freeze({ Arroz: 1.28, Frango: 1.65, Ovo: 1.55 });
const ALIMENTOS = Object.keys(TAXAS);

function gerarRegistros() {
  let semente = 2026;
  const aleatorio = () => {
    semente = (Math.imul(1664525, semente) + 1013904223) >>> 0;
    return semente / 4294967296;
  };

  const registros = [];
  let diaAnterior = '';
  let caloriasDia = 0;
  let alarmesDia = 0;

  for (let i = 0; i < 10000; i++) {
    const data = new Date(Date.UTC(2026, 0, 1 + Math.floor(i / 33)))
      .toISOString().slice(0, 10);
    const alimento = ALIMENTOS[Math.floor(aleatorio() * 3)];
    const peso = 50 + Math.floor(aleatorio() * 301);
    const calorias = Number((peso * TAXAS[alimento]).toFixed(2));
    const temperatura = Number((18 + aleatorio() * 17).toFixed(1));
    const umidade = 35 + Math.floor(aleatorio() * 51);
    const alarme = calorias > 300;

    if (data !== diaAnterior) {
      diaAnterior = data;
      caloriasDia = 0;
      alarmesDia = 0;
    }
    caloriasDia += calorias;
    if (alarme) alarmesDia++;

    registros.push({
      id: i + 1,
      data,
      alimento,
      peso,
      calorias,
      caloriasDia: Number(caloriasDia.toFixed(2)),
      meta: 2000,
      temperatura,
      umidade,
      alarme,
      alarmesDia,
    });
  }
  return registros;
}

module.exports = { TAXAS, ALIMENTOS, gerarRegistros };