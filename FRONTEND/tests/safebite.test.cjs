
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const raiz = path.resolve(__dirname, "..", "View");

const codigo = fs.readFileSync(
  path.join(raiz, "Dashboard/js/dados.js"),
  "utf8"
);

const contexto = {
  window: {},
  Date,
  Math
};

vm.runInNewContext(codigo, contexto);

const dados = contexto.window.SafeBiteDados;

// Teste 1
test("possui 10 mil registros", () => {
  assert.equal(dados.length, 10000);
});

// Teste 2
test("tipos de alimento permitidos", () => {
  assert.ok(
    dados.every(d =>
      ["Arroz", "Frango", "Ovo"].includes(d.alimento)
    )
  );
});

// Teste 3
test("calorias calculadas pelo peso", () => {
  const taxas = {
    Arroz: 1.28,
    Frango: 1.65,
    Ovo: 1.55
  };

  assert.ok(
    dados.every(d =>
      Math.abs(d.calorias - d.peso * taxas[d.alimento]) < 0.011
    )
  );
});

// Teste 4
test("alarme apenas acima de 300 kcal", () => {
  assert.ok(
    dados.every(d => d.alarme === (d.calorias > 300))
  );
});

// Teste 5
test("contagem de alarmes reinicia por dia", () => {
  const porDia = new Map();

  for (const d of dados) {
    const n = (porDia.get(d.data) || 0) + Number(d.alarme);

    assert.equal(d.alarmesDia, n);
    porDia.set(d.data, n);
  }
});

// Teste 6
test("dashboard possui exportação sem importação", () => {
  const html = fs.readFileSync(
    path.join(raiz, "Dashboard/index.html"),
    "utf8"
  );

  assert.match(html, /id="exportar"/);
  assert.doesNotMatch(html, /id="importar"/);
});

// Teste 7
test("página integrada usa menu e autenticação", () => {
  const html = fs.readFileSync(
    path.join(raiz, "Index/dashboard.html"),
    "utf8"
  );

  assert.match(html, /components\/auth-guard\.js/);
  assert.match(html, /components\/layout\.js/);
});
