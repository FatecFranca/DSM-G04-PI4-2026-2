

### Arquivo `DOCS/ATIVIDADE_DASHBOARD_MOBILE_CICD.md`

```markdown
# Atividade Prática — Dashboard Mobile SafeBite com Git, GitHub e CI/CD

## Objetivo

Integrar ao aplicativo **SafeBite (React Native / Expo)** o dashboard alimentar que já existia no frontend web e entregar a melhoria pela metodologia das aulas do Notion:

- Branch para nova funcionalidade;
- Commits pequenos e semânticos (`feat`, `test`, `ci`, `docs`);
- Testes automatizados em GitHub Actions;
- Pull Request e merge na `main`;
- Tag anotada com **Versionamento Semântico — SemVer**;
- CD acionada pela tag **somente quando o projeto Expo EAS estiver configurado**;
- Credenciais em GitHub Secrets, nunca no repositório.

**Importante:** esta atualização é do **aplicativo mobile**. Diferentemente do site estático das aulas, a publicação mobile usa **Expo EAS Update**, não Vercel. Vercel continua sendo uma opção para o frontend web, mas não atualiza o aplicativo instalado. O pipeline aqui não altera a configuração de deploy web.

---

# Situação-problema

O SafeBite possui um dashboard web com 10.000 registros simulados, porém o app mobile não possuía uma tela de análise de dados. O objetivo é disponibilizar o painel no app, validar os resultados, versionar as alterações e preparar a entrega automatizada sem publicar por mero `push`.

## Resultado implementado

- Tela `Mobile/screens/DashboardScreen.js` com filtros por período, alimento e meta.
- Cards com métricas, gráficos nativos, histórico e exportação CSV via compartilhamento de texto.
- Acesso ao dashboard pela Home e pela tela da Balança Nutricional.
- Dados sintéticos com a mesma semente da versão web; **não representam leituras reais da balança**.
- **7 testes mobile + 7 testes web = 14 testes automatizados locais aprovados**.
- Nenhum pacote nativo novo foi necessário para desenhar os gráficos.

A exportação em celular compartilha o CSV como texto e limita a seleção a 2.500 linhas por vez; não gera um arquivo físico `.csv`.

---

# 1. Arquivos entregues

```text
Mobile/
├── App.js                            (alterado)
├── package.json                      (alterado)
├── screens/
│   ├── HomeScreen.js                 (alterado)
│   ├── Balanca.js                    (alterado)
│   └── DashboardScreen.js            (novo)
├── components/DashboardCharts.js     (novo)
├── data/dashboardData.js             (novo)
├── utils/dashboardAnalytics.js       (novo)
├── tests/dashboard.test.cjs          (novo)
└── DASHBOARD_MOBILE.md               (novo)
.github/workflows/
├── safebite-ci.yml                   (alterado)
└── safebite-mobile-release.yml       (novo)
DOCS/ATIVIDADE_DASHBOARD_MOBILE_CICD.md (novo)
README.md                              (alterado)