import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANTE:
// Substitua pelo IPv4 do computador que está rodando o backend.
// Exemplo: http://192.168.1.10:3001
// ALTERADO: agora é exportado para as telas montarem a URL das imagens.
export const SERVER_URL = 'http://192.168.24.5:3001';
const API_BASE_URL = `${SERVER_URL}/api`;

const TOKEN_KEY = 'safebite_token';
const USER_KEY = 'safebite_user';

// ALTERADO: o fetch das versões novas do Expo não aceita { uri, name, type }
// dentro do FormData. Para uploads usamos XMLHttpRequest, que o React Native
// ainda suporta. Devolve um objeto com a mesma interface usada pelo request().
function enviarComXHR(url, { method, headers, body }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);

    Object.entries(headers).forEach(([nome, valor]) => {
      xhr.setRequestHeader(nome, valor);
    });

    xhr.onload = () => {
      const texto = xhr.responseText || '';
      const tipo = xhr.getResponseHeader('content-type') || '';

      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        headers: {
          get: (nome) =>
            nome.toLowerCase() === 'content-type'
              ? tipo
              : xhr.getResponseHeader(nome),
        },
        json: async () => (texto ? JSON.parse(texto) : null),
        text: async () => texto,
      });
    };

    xhr.onerror = () => reject(new Error('Erro de rede durante o envio (XHR).'));
    xhr.ontimeout = () => reject(new Error('Tempo esgotado durante o envio (XHR).'));

    xhr.send(body);
  });
}

class ApiService {
  async getToken() {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  async setToken(token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }

  async removeToken() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }

  async getCurrentUser() {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      includeAuth = true,
      contentType = 'application/json',
    } = options;

    const headers = {};

    if (contentType !== null) {
      headers['Content-Type'] = contentType;
    }

    if (includeAuth) {
      const token = await this.getToken();

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const config = {
      method,
      headers,
    };

    if (body !== null && method !== 'GET') {
      if (contentType === 'application/json') {
        config.body = JSON.stringify(body);
      } else {
        config.body = body;
      }
    }

    let response;

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const ehFormData =
        typeof FormData !== 'undefined' && config.body instanceof FormData;

      // ALTERADO: FormData (upload de imagem) vai por XHR; o resto segue no fetch.
      response = ehFormData
        ? await enviarComXHR(url, config)
        : await fetch(url, config);
    } catch (error) {
      // ALTERADO: mostra o erro real do fetch (aparece no terminal do Expo)
      // e na mensagem, em vez de sempre culpar o Wi-Fi.
      console.log('FETCH FALHOU:', method, endpoint, error?.message);

      throw new Error(
        `Falha na requisição ${method} ${endpoint} em ${SERVER_URL}. ` +
        `Detalhe: ${error?.message || 'sem detalhe'}. ` +
        'Se as outras chamadas funcionam, o problema pode estar no corpo ' +
        'enviado (por exemplo, upload de imagem).'
      );
    }

    const responseType = response.headers.get('content-type') || '';
    const isJson = responseType.includes('application/json');

    let data;

    if (isJson) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // ALTERADO: token expirado/inválido em rota autenticada limpa a sessão
      // e sinaliza para a tela mandar o usuário para o Login.
      if (response.status === 401 && includeAuth) {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);

        const sessionError = new Error(
          'Sua sessão expirou. Faça login novamente.'
        );
        sessionError.status = 401;
        sessionError.data = data;
        sessionError.sessionExpired = true;

        throw sessionError;
      }

      const message =
        data?.message ||
        `Erro ${response.status}: ${response.statusText}`;

      const error = new Error(message);
      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  }

  // AUTENTICAÇÃO

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
      includeAuth: false,
    });
  }

  async login(email, senha) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, senha },
      includeAuth: false,
    });

    if (response?.data?.token) {
      await this.setToken(response.data.token);

      if (response.data.user) {
        await AsyncStorage.setItem(
          USER_KEY,
          JSON.stringify(response.data.user)
        );
      }
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    }
  }

  async isAuthenticated() {
    return !!(await this.getToken());
  }

  // RECEITAS

  async listRecipes(filters = {}) {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);

    const query = params.toString();
    const endpoint = `/recipes${query ? `?${query}` : ''}`;

    return this.request(endpoint, {
      includeAuth: false,
    });
  }

  async getRecipeById(recipeId) {
    return this.request(`/recipes/${recipeId}`, {
      includeAuth: false,
    });
  }

  async createRecipe(recipeData, imageFile = null) {
    const formData = new FormData();

    Object.entries(recipeData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)));
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.request('/recipes', {
      method: 'POST',
      body: formData,
      contentType: null,
    });
  }

  async updateRecipe(recipeId, recipeData, imageFile = null) {
    const formData = new FormData();

    Object.entries(recipeData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)));
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.request(`/recipes/${recipeId}`, {
      method: 'PUT',
      body: formData,
      contentType: null,
    });
  }

  async deleteRecipe(recipeId) {
    return this.request(`/recipes/${recipeId}`, {
      method: 'DELETE',
    });
  }

  // RESTRIÇÕES ALIMENTARES

  async listRestrictions() {
    return this.request('/restrictions', {
      includeAuth: false,
    });
  }

  async getUserRestrictions() {
    return this.request('/restrictions/users');
  }

  async addUserRestriction(restrictionData) {
    const body =
      typeof restrictionData === 'string' ||
      typeof restrictionData === 'number'
        ? { restriction_id: restrictionData }
        : restrictionData;

    return this.request('/restrictions/users', {
      method: 'POST',
      body,
    });
  }

  async removeRestriction(restrictionId) {
    return this.request(`/restrictions/users/${restrictionId}`, {
      method: 'DELETE',
    });
  }

  async updateRestriction(restrictionId, palavrasChave) {
    return this.request(`/restrictions/users/${restrictionId}`, {
      method: 'PUT',
      body: {
        palavras_chave_personalizadas: palavrasChave,
      },
    });
  }

  // PERFIL E RECEITAS DO USUÁRIO

  async getCurrentUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(userData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: userData,
    });
  }

  async getUserPublishedRecipes() {
    return this.request('/users/published-recipes');
  }

  async getUserRecipes(status = null) {
    const params = new URLSearchParams();

    if (status) {
      params.append('status', status);
    }

    const query = params.toString();

    return this.request(`/users/recipes${query ? `?${query}` : ''}`);
  }

  async updateProfilePhoto(photoFile) {
    const formData = new FormData();
    formData.append('photo', photoFile);

    return this.request('/users/profile/photo', {
      method: 'PUT',
      body: formData,
      contentType: null,
    });
  }

  async removeProfilePhoto() {
    return this.request('/users/profile/photo', {
      method: 'DELETE',
    });
  }
}

const apiService = new ApiService();

export default apiService;