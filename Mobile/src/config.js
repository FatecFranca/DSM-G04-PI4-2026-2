import Constants from 'expo-constants';

// Porta do backend (a mesma do seu server.js).
const PORTA = 3001;

// Se o backend NÃO roda no mesmo computador que está rodando o Expo,
// coloque aqui o endereço dele. Exemplo: 'http://192.168.0.10:3001'
// Deixe vazio ('') para o app descobrir o IP do computador sozinho.
export const SERVER_URL_MANUAL = '';

function descobrirServidor() {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:${PORTA}` : null;
}

export const SERVER_URL =
  SERVER_URL_MANUAL || descobrirServidor() || `http://localhost:${PORTA}`;

export const API_URL = `${SERVER_URL}/api`;
