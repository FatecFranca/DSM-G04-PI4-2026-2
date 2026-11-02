
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANTE:
// Substitua pelo IPv4 do computador que está rodando o backend.
// Exemplo: http://192.168.1.10:3001
const SERVER_URL = 'http://192.168.24.5:3001';
const API_BASE_URL = `${SERVER_URL}/api`;

const TOKEN_KEY = 'safebite_token';
const USER_KEY = 'safebite_user';

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
      response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    } catch (error) {
      throw new Error(
        `Não foi possível conectar ao backend em ${SERVER_URL}. ` +
        'Verifique o endereço, se o backend está ligado e se o celular ' +
        'está na mesma rede Wi-Fi do computador.'
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
