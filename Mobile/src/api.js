import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, SERVER_URL } from './config';

const CHAVES = {
  token: 'sb_token',
  refresh: 'sb_refresh',
  usuario: 'sb_usuario',
};

let aoExpirarSessao = null;
export function definirAoExpirarSessao(fn) {
  aoExpirarSessao = fn;
}

// Monta a URL completa de uma imagem vinda do backend.
// Aceita caminho relativo (/uploads/a.jpg) ou URL com localhost.
export function urlImagem(caminho) {
  if (!caminho || typeof caminho !== 'string') return null;

  if (/^https?:\/\//i.test(caminho)) {
    return caminho.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
      SERVER_URL
    );
  }

  return `${SERVER_URL}${caminho.startsWith('/') ? '' : '/'}${caminho}`;
}

// Transporte único: XMLHttpRequest funciona com JSON e com FormData
// (upload de imagem) em qualquer versão do Expo.
function enviarXHR(url, { method, headers, body, timeout = 20000 }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.timeout = timeout;
    xhr.onload = () =>
      resolve({ status: xhr.status, texto: xhr.responseText || '' });
    xhr.onerror = () => reject(new Error('falha de rede'));
    xhr.ontimeout = () => reject(new Error('tempo esgotado'));
    xhr.send(body);
  });
}

function interpretar(texto) {
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch (e) {
    return texto;
  }
}

async function limparSessao() {
  await AsyncStorage.multiRemove([
    CHAVES.token,
    CHAVES.refresh,
    CHAVES.usuario,
  ]);
}

// Renova o token de acesso usando o refreshToken (o backend já oferece /auth/refresh).
let renovacaoEmAndamento = null;
function renovarToken() {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = (async () => {
      try {
        const refresh = await AsyncStorage.getItem(CHAVES.refresh);
        if (!refresh) return false;

        const r = await enviarXHR(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        const dados = interpretar(r.texto);

        if (r.status === 200 && dados?.data?.token) {
          await AsyncStorage.setItem(CHAVES.token, dados.data.token);
          if (dados.data.refreshToken) {
            await AsyncStorage.setItem(CHAVES.refresh, dados.data.refreshToken);
          }
          return true;
        }
        return false;
      } catch (e) {
        return false;
      } finally {
        renovacaoEmAndamento = null;
      }
    })();
  }
  return renovacaoEmAndamento;
}

async function request(caminho, { method = 'GET', body = null, auth = true } = {}) {
  const ehForm = typeof FormData !== 'undefined' && body instanceof FormData;

  async function tentar() {
    const headers = { Accept: 'application/json' };
    let payload = null;

    if (body !== null) {
      if (ehForm) {
        payload = body;
      } else {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
      }
    }

    if (auth) {
      const token = await AsyncStorage.getItem(CHAVES.token);
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    try {
      return await enviarXHR(`${API_URL}${caminho}`, {
        method,
        headers,
        body: payload,
        timeout: ehForm ? 60000 : 20000,
      });
    } catch (e) {
      const erro = new Error(
        `Não foi possível falar com o servidor (${SERVER_URL}). ` +
          'Verifique se o backend está rodando e se o celular está na mesma rede. ' +
          `Detalhe: ${e.message}`
      );
      erro.rede = true;
      throw erro;
    }
  }

  let resp = await tentar();

  if (resp.status === 401 && auth) {
    const renovou = await renovarToken();
    if (renovou) resp = await tentar();

    if (resp.status === 401) {
      await limparSessao();
      if (aoExpirarSessao) aoExpirarSessao();
      const erro = new Error('Sua sessão expirou. Faça login novamente.');
      erro.status = 401;
      erro.sessaoExpirada = true;
      throw erro;
    }
  }

  const dados = interpretar(resp.texto);

  if (resp.status < 200 || resp.status >= 300) {
    let mensagem = dados?.message || `Erro ${resp.status}`;

    if (Array.isArray(dados?.errors) && dados.errors.length > 0) {
      mensagem = dados.errors.map((e) => e.message || String(e)).join('\n');
    }
    if (resp.status >= 500 && typeof dados?.error === 'string') {
      mensagem += ` (${dados.error})`;
    }

    const erro = new Error(mensagem);
    erro.status = resp.status;
    erro.dados = dados;
    throw erro;
  }

  return dados;
}

// Tenta várias rotas em sequência (o backend tem nomes diferentes nos comentários
// e nas rotas reais; assim o app funciona nos dois casos).
async function tentarRotas(caminhos, opcoes, continuarEm) {
  let ultimo = null;
  for (const caminho of caminhos) {
    try {
      return await request(caminho, opcoes);
    } catch (e) {
      if (!continuarEm.includes(e.status)) throw e;
      ultimo = e;
    }
  }
  throw ultimo;
}

const restricoesUsuario = (sufixo, opcoes = {}) =>
  tentarRotas(
    [`/restrictions/users${sufixo}`, `/restrictions/user${sufixo}`],
    opcoes,
    [404]
  );

async function salvarSessao(resposta) {
  const { token, refreshToken, user } = resposta?.data || {};
  if (!token) throw new Error('O servidor não devolveu o token de acesso.');

  await AsyncStorage.multiSet([
    [CHAVES.token, token],
    [CHAVES.refresh, refreshToken || ''],
    [CHAVES.usuario, JSON.stringify(user || {})],
  ]);

  return user || {};
}

export const api = {
  // SESSÃO

  async sessaoSalva() {
    const token = await AsyncStorage.getItem(CHAVES.token);
    if (!token) return null;

    const bruto = await AsyncStorage.getItem(CHAVES.usuario);
    try {
      return bruto ? JSON.parse(bruto) : {};
    } catch (e) {
      return {};
    }
  },

  async login(email, senha) {
    const resposta = await request('/auth/login', {
      method: 'POST',
      body: { email, senha },
      auth: false,
    });
    return salvarSessao(resposta);
  },

  async cadastrar(dados) {
    const resposta = await request('/auth/register', {
      method: 'POST',
      body: dados,
      auth: false,
    });
    return salvarSessao(resposta);
  },

  async sair() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // mesmo sem conseguir avisar o servidor, encerramos a sessão local
    }
    await limparSessao();
  },

  // RECEITAS

  listarReceitas({ search, compatible, limit = 50 } = {}) {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    if (search) params.append('search', search);
    if (compatible) params.append('compatible', 'true');
    return request(`/recipes?${params.toString()}`);
  },

  obterReceita(id) {
    return request(`/recipes/${id}`);
  },

  criarReceita(campos, imagem) {
    const form = new FormData();

    Object.entries(campos).forEach(([chave, valor]) => {
      if (valor !== null && valor !== undefined) {
        form.append(chave, String(valor));
      }
    });

    if (imagem) form.append('image', imagem);

    return request('/recipes', { method: 'POST', body: form });
  },

  excluirReceita(id) {
    return request(`/recipes/${id}`, { method: 'DELETE' });
  },

  async minhasReceitas() {
    try {
      return await tentarRotas(
        ['/users/recipes', '/recipes/user'],
        {},
        [400, 404]
      );
    } catch (e) {
      if (e.status !== 400 && e.status !== 404) throw e;

      // Último recurso: filtra no app as receitas publicadas do próprio usuário.
      const usuario = await api.sessaoSalva();
      const meuId = String(usuario?.id ?? '');
      const resp = await request('/recipes?limit=100');
      const minhas = (resp?.data || []).filter(
        (r) => String(r.author?.id ?? r.author?._id ?? '') === meuId
      );
      return { success: true, data: minhas };
    }
  },

  // RESTRIÇÕES

  listarRestricoes() {
    return request('/restrictions', { auth: false });
  },

  restricoesDoUsuario() {
    return restricoesUsuario('');
  },

  adicionarRestricao(restrictionId) {
    return restricoesUsuario('', {
      method: 'POST',
      body: { restriction_id: restrictionId },
    });
  },

  removerRestricao(associacaoId) {
    return restricoesUsuario(`/${associacaoId}`, { method: 'DELETE' });
  },

  // PERFIL

  perfil() {
    return request('/users/profile');
  },
};
