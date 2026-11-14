const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const arquivos = [
  'src/dashboard/dashboardAnalytics.js',
  'src/dashboard/DashboardCharts.js',
  'src/dashboard/dashboardData.js',
  'src/screens/DashboardScreen.js'
];

for (const arquivo of arquivos) {
  test(`Dashboard: integridade de ${arquivo}`, () => {
    const caminho = path.join(root, arquivo);

    assert.ok(fs.existsSync(caminho), `Arquivo ausente: ${arquivo}`);

    const conteudo = fs.readFileSync(caminho, 'utf8');

    assert.ok(
      conteudo.trim().length > 100,
      `Arquivo vazio ou incompleto: ${arquivo}`
    );

    assert.doesNotMatch(
      conteudo,
      /^(<<<<<<< |=======\s*$|>>>>>>> )/m,
      `Conflito de merge encontrado em: ${arquivo}`
    );
  });
}
