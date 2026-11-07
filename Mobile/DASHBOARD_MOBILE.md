

### Arquivo `Mobile/DASHBOARD_MOBILE.md`

```markdown
# Dashboard SafeBite no aplicativo mobile

A tela `screens/DashboardScreen.js` foi integrada à navegação existente em `App.js`.
Pode ser aberta pelo novo cartão **Dashboard alimentar** da tela inicial ou pelo
botão na tela **Balança Nutricional**.

## Recursos

- Base demonstrativa idêntica à versão web (10.000 registros, gerados por semente fixa).
- Filtros: alimento, início/fim (AAAA-MM-DD), meta e atalhos de 7/30/90 dias.
- Oito indicadores de resumo.
- Gráficos nativos: consumo diário e meta, participação por alimento,
  histograma com curva normal, dispersão e regressão linear.
- Histórico recente e meta atingida por dia.
- Compartilhamento do CSV filtrado como texto pelo menu nativo do celular.
  **Observação:** não gera anexo `.csv`; para compartilhar conjuntos acima de
  2.500 registros, reduza o período. A exportação de arquivo físico requer
  integração adicional com um módulo de arquivos nativo.

## Executar e validar

```bash
cd Mobile
npm install
npx expo start
node --test tests/dashboard.test.cjs