const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { gerarRegistros } = require('../data/dashboardData');
const {
  analisarRegistros,
  csvRegistros,
  dataValida,
  desvioAmostral,
  regressao,
  validarFiltros,
} = require('../utils/dashboardAnalytics');

const registros = gerarRegistros();
const filtrosPadrao = {
  alimento: 'Todos',
  inicio: registros[0].data,
  fim: registros[registros.length - 1].data,
  meta: 2000,
};

// Valida paridade dos dados mobile e web com a mesma semente.
const codigoWeb = fs.readFileSync(path.join(__dirname, '../../FRONTEND/View/Dashboard/js/dados.js'), 'utf8');
const contexto = { window: {}, Date, Math };
vm.runInNewContext(codigoWeb, contexto);

test('base mobile corresponde aos 10.000 registros do dashboard web', () => {
  assert.equal(registros.length, 10000);
  assert.deepEqual(registros, JSON.parse(JSON.stringify(contexto.window.SafeBiteDados)));
});

test('filtros incluem limites e isolam alimento', () => {
  const data = registros[0].data;
  const resultado = analisarRegistros(registros, { ...filtrosPadrao, alimento: 'Ovo', inicio: data, fim: data });
  assert.ok(resultado.quantidade > 0);
  assert.ok(resultado.registros.every(item => item.alimento === 'Ovo' && item.data === data));
});

test('indicadores, desvio amostral, alarmes e dias dentro da meta', () => {
  const analise = analisarRegistros(registros, filtrosPadrao);
  assert.equal(analise.quantidade, 10000);
  assert.equal(analise.alarmes, registros.filter(d => d.calorias > 300).length);
  assert.ok(analise.desvio > 0);
  assert.ok(analise.diasNaMeta <= analise.dias.length);
  const somaAlimentos = Object.values(analise.porAlimento).reduce((a, item) => a + item.kcal, 0);
  assert.ok(Math.abs(somaAlimentos - analise.total) < 0.001);
  assert.equal(desvioAmostral([1, 2, 3]), 1);
});

test('histograma possui todos os pratos, regressão consistente', () => {
  const analise = analisarRegistros(registros, filtrosPadrao);
  assert.equal(analise.histograma.reduce((a, b) => a + b, 0), 10000);
  assert.equal(analise.curvaNormal.length, 65);
  assert.ok(Number.isFinite(analise.modelo.r2));
  assert.ok(analise.modelo.r2 >= 0 && analise.modelo.r2 <= 1.000000001);
  const modelo = regressao([{ peso: 1, calorias: 2 }, { peso: 2, calorias: 4 }]);
  assert.ok(Math.abs(modelo.b - 2) < 0.0000001);
});

test('intervalos, datas inválidas e metas são validados', () => {
  assert.equal(dataValida('2026-02-29'), false);
  assert.equal(dataValida('2026-02-28'), true);
  assert.equal(dataValida('2026-2-8'), false);
  assert.match(validarFiltros({ ...filtrosPadrao, inicio: '2026-12-01', fim: '2026-01-01' }), /anterior/);
  assert.match(validarFiltros({ ...filtrosPadrao, meta: 0 }), /meta/);
  assert.equal(validarFiltros(filtrosPadrao), null);
});

test('filtro sem dados não provoca divisões por zero ou números inválidos', () => {
  const vazio = analisarRegistros(registros, { ...filtrosPadrao, inicio: '2030-01-01', fim: '2030-01-02' });
  assert.equal(vazio.quantidade, 0);
  assert.equal(vazio.media, 0);
  assert.equal(vazio.percentualAlarmes, 0);
  assert.equal(vazio.modelo.r, 0);
  assert.equal(vazio.diasNaMeta, 0);
});

test('CSV utiliza cabeçalho, ponto-e-vírgula e valores filtrados', () => {
  const texto = csvRegistros(registros.slice(0, 2));
  assert.ok(texto.startsWith('\uFEFFID;Data;Alimento;Peso (g);'));
  assert.equal(texto.split('\r\n').length, 3);
  assert.ok(texto.includes('Calorias (kcal)'));
});