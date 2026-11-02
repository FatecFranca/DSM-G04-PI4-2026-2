import { useColorScheme } from 'react-native';

const claro = {
  fundo: '#eef2f7',
  cartao: '#ffffff',
  cartao2: '#f6f8fb',
  texto: '#0f172a',
  mudo: '#64748b',
  borda: '#e2e8f0',
  trilho: '#e5eaf2',
  primaria: '#2563eb',
  primariaSuave: '#dbeafe',
  ok: '#16a34a',
  okSuave: '#dcfce7',
  aviso: '#d97706',
  avisoSuave: '#fef3c7',
  perigo: '#dc2626',
  perigoSuave: '#fee2e2',
  cabecalho: '#0b2150',
};

const escuro = {
  fundo: '#0a1020',
  cartao: '#111a2f',
  cartao2: '#0d1528',
  texto: '#e6ebf5',
  mudo: '#94a3bd',
  borda: '#1f2c48',
  trilho: '#1e2b47',
  primaria: '#4f8cff',
  primariaSuave: '#15305f',
  ok: '#34d399',
  okSuave: '#0f3a2c',
  aviso: '#fbbf24',
  avisoSuave: '#3d2f0b',
  perigo: '#f87171',
  perigoSuave: '#451a1a',
  cabecalho: '#0b2150',
};

export function useTema() {
  return useColorScheme() === 'dark' ? escuro : claro;
}