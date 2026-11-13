// Configuração do MQTT da balança (a mesma do projeto antigo).
export const PROJECT_ID = 'bn7k2q9';

export const BASE_TOPIC = `balanca-nutricional/${PROJECT_ID}`;

export const BROKER = {
  host: 'broker.hivemq.com',
  port: 8884,
  path: '/mqtt',
  ssl: true,
};

// ---------------------------------------------------------------------------
// ATENÇÃO: os itens abaixo são SUPOSIÇÕES a partir dos nomes dos tópicos.
// Confira com a tela antiga da balança ou com o código do ESP32 e ajuste aqui.
// Se algum nome estiver errado, nada quebra: o ESP32 só ignora o comando.
// ---------------------------------------------------------------------------

// Comandos enviados para balanca-nutricional/<ID>/cmd/<nome>
export const COMANDOS = {
  alimento: 'alimento',
  tara: 'tara',
};

// Alimentos aceitos pelo hook: valores 0, 1 e 2. Troque rótulos e emojis.
export const ALIMENTOS = [
  { valor: 0, emoji: '🍚', rotulo: 'Alimento 1' },
  { valor: 1, emoji: '🍗', rotulo: 'Alimento 2' },
  { valor: 2, emoji: '🥗', rotulo: 'Alimento 3' },
];

// Significado de tampa/estado (1 ou 0).
export const TEXTO_TAMPA = { 1: 'Aberta', 0: 'Fechada' };
