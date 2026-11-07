/**
 * Configuração central do frontend e conexão com o backend.
 *
 * Em produção, ajuste API_BASE_URL e SERVER_URL para o domínio do backend.
 * O backend deve ter CORS_ORIGIN apontando para a URL deste frontend (ex: http://localhost:3000).
 */
const CONFIG = {
  /** URL base da API REST (inclui /api) */
  API_BASE_URL: 'http://localhost:3001/api',

  /** URL do servidor backend sem /api — usada para imagens e uploads */
  SERVER_URL: 'http://localhost:3001',

  /** Timeout para requisições HTTP (ms) */
  REQUEST_TIMEOUT: 30000,

  /** Chaves do localStorage */
  STORAGE_KEYS: {
    TOKEN: 'safebite_token',
    USER: 'safebite_user'
  }
};

/**
 * Monta URL absoluta para imagens retornadas pela API.
 * @param {string|null|undefined} path - Caminho ou URL da mídia
 * @returns {string}
 */
CONFIG.resolveMediaUrl = function resolveMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const server = CONFIG.SERVER_URL.replace(/\/$/, '');
  if (path.startsWith('/')) return `${server}${path}`;
  return `${server}/uploads/${path}`;
};

window.CONFIG = CONFIG;
