
# Dashboard SafeBite

Dashboard acadêmico desenvolvido com HTML, CSS e JavaScript.

## Objetivo

Apresentar informações de consumo alimentar por meio de
gráficos, indicadores e análises estatísticas.

## Funcionalidades

- Cálculo de calorias pelo peso e tipo do alimento.
- Consumo diário e participação percentual por alimento.
- Média e desvio padrão amostral.
- Histograma e curva normal teórica.
- Correlação de Pearson e regressão linear.
- Alarme para pratos com mais de 300 kcal.
- Filtros por alimento e período.
- Exportação dos dados em CSV.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Git e GitHub
- Node.js para testes
- GitHub Actions

## Executar

Abra o projeto com um servidor local, como Live Server.

Dashboard direto:
`/Dashboard/index.html`

Dashboard integrado:
`/Index/dashboard.html`

## Testes

Execute na raiz do frontend:

```bash
node --test tests/safebite.test.cjs
```

## CI/CD

O GitHub Actions valida o JavaScript, executa os testes
e disponibiliza o frontend como artefato do workflow.

O deploy automático em produção não está configurado.

## Observações

A base inicial é gerada localmente para demonstração.
Os coeficientes calóricos são aproximados.
A curva normal é uma aproximação teórica.
Correlação não significa causalidade.
