/**
 * Serviço de API - Centraliza todas as chamadas à API do backend
 * Inclui tratamento de erros, loading states e gerenciamento de autenticação
 */

class ApiService {
  constructor() {
    this.baseURL = window.CONFIG?.API_BASE_URL || 'http://localhost:3001/api';
    this.timeout = window.CONFIG?.REQUEST_TIMEOUT || 30000;
  }

  /**
   * Obtém o token de autenticação do localStorage
   */
  getToken() {
    return localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.TOKEN || 'safebite_token');
  }

  /**
   * Salva o token de autenticação no localStorage
   */
  setToken(token) {
    localStorage.setItem(window.CONFIG?.STORAGE_KEYS?.TOKEN || 'safebite_token', token);
  }

  /**
   * Remove o token de autenticação do localStorage
   */
  removeToken() {
    localStorage.removeItem(window.CONFIG?.STORAGE_KEYS?.TOKEN || 'safebite_token');
  }

  /**
   * Obtém os headers padrão para requisições
   */
  getHeaders(includeAuth = true, contentType = 'application/json') {
    const headers = {};

    // Só definir Content-Type se não for null (para FormData, deixar o browser definir)
    if (contentType !== null) {
      headers['Content-Type'] = contentType;
    }

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Faz uma requisição HTTP genérica
   * @param {string} endpoint - Endpoint da API (ex: '/auth/login')
   * @param {object} options - Opções da requisição (method, body, headers, etc)
   * @returns {Promise} - Promise com a resposta da API
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      includeAuth = true,
      contentType = 'application/json'
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = {
      ...this.getHeaders(includeAuth, contentType),
      ...headers
    };

    // Se o body for FormData, remover Content-Type dos headers (browser define automaticamente com boundary)
    if (body instanceof FormData) {
      delete requestHeaders['Content-Type'];
    }

    const config = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(this.timeout)
    };

    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        // FormData não deve ser stringificado
        config.body = body;
      } else if (contentType === 'application/json') {
        config.body = JSON.stringify(body);
      } else {
        config.body = body;
      }
    }

    try {
      const response = await fetch(url, config);

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      let data;
      if (isJson) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Se a resposta não foi bem-sucedida, lançar erro
      if (!response.ok) {
        // Tratamento especial para erro de rate limit (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const errorMessage = retryAfter 
            ? `Muitas requisições. Tente novamente em ${retryAfter} segundos.`
            : 'Muitas requisições. Aguarde alguns instantes antes de tentar novamente.';
          const error = new Error(errorMessage);
          error.status = 429;
          error.data = data;
          error.code = 'TOO_MANY_REQUESTS';
          throw error;
        }
        
        const error = new Error(data.message || `Erro ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      // Tratar erros de timeout
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new Error('Tempo de requisição excedido. Verifique sua conexão com a internet.');
      }

      // Tratar erros de rede (incluindo CORS que não conseguiu conectar)
      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        throw new Error(`Erro de conexão. Verifique se o servidor backend está rodando em ${window.CONFIG?.SERVER_URL || 'http://localhost:3001'}`);
      }

      // Tratar erros de CORS
      if (error.message && error.message.includes('CORS')) {
        throw new Error('Erro de CORS. Verifique se o servidor backend está configurado corretamente.');
      }

      // Re-lançar outros erros
      throw error;
    }
  }

  // ==================== AUTENTICAÇÃO ====================

  /**
   * Registra um novo usuário
   */
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
      includeAuth: false
    });
  }

  /**
   * Faz login do usuário
   */
  async login(email, senha) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, senha },
      includeAuth: false
    });

    // Salvar token se a resposta incluir
    if (response.data && response.data.token) {
      this.setToken(response.data.token);
      
      // Salvar dados do usuário
      if (response.data.user) {
        localStorage.setItem(
          window.CONFIG?.STORAGE_KEYS?.USER || 'safebite_user',
          JSON.stringify(response.data.user)
        );
      }
    }

    return response;
  }

  /**
   * Faz logout do usuário
   */
  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Sempre remover token e dados do usuário, mesmo se a requisição falhar
      this.removeToken();
      localStorage.removeItem(window.CONFIG?.STORAGE_KEYS?.USER || 'safebite_user');
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Obtém os dados do usuário logado
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(window.CONFIG?.STORAGE_KEYS?.USER || 'safebite_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // ==================== RESTRIÇÕES DO USUÁRIO ====================

  /**
   * Obtém todas as restrições do usuário logado
   */
  async getUserRestrictions() {
    return this.request('/restrictions/users');
  }

  /**
   * Adiciona uma nova restrição ao usuário
   * @param {string|object} restrictionData - Se string (ObjectId), é restriction_id. Se objeto, pode ter {restriction_id} ou {nome, palavras_chave}
   */
  async addUserRestriction(restrictionData) {
    const body = (typeof restrictionData === 'string' || typeof restrictionData === 'number')
      ? { restriction_id: restrictionData }
      : restrictionData;

    return this.request('/restrictions/users', {
      method: 'POST',
      body
    });
  }

  /**
   * Remove uma restrição do usuário
   */
  async removeRestriction(restrictionId) {
    return this.request(`/restrictions/users/${restrictionId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Atualiza as palavras-chave personalizadas de uma restrição do usuário
   */
  async updateRestriction(restrictionId, palavrasChave) {
    return this.request(`/restrictions/users/${restrictionId}`, {
      method: 'PUT',
      body: { palavras_chave_personalizadas: palavrasChave }
    });
  }

  // ==================== RECEITAS ====================

  /**
   * Lista receitas com filtros opcionais
   */
  async listRecipes(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.status) queryParams.append('status', filters.status);

    const queryString = queryParams.toString();
    const endpoint = `/recipes${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint, {
      includeAuth: false // Receitas podem ser públicas
    });
  }

  /**
   * Obtém uma receita por ID
   */
  async getRecipeById(recipeId) {
    return this.request(`/recipes/${recipeId}`, {
      includeAuth: false // Receitas podem ser públicas
    });
  }

  /**
   * Cria uma nova receita
   */
  async createRecipe(recipeData, imageFile = null) {
    const formData = new FormData();
    
    // Adicionar campos da receita
    Object.keys(recipeData).forEach(key => {
      if (Array.isArray(recipeData[key])) {
        // Para arrays, adicionar cada item separadamente
        recipeData[key].forEach(item => {
          formData.append(key, item);
        });
      } else if (recipeData[key] !== null && recipeData[key] !== undefined) {
        // Para valores simples, converter para string se necessário
        formData.append(key, recipeData[key]);
      }
    });

    // Adicionar imagem se fornecida (backend espera campo 'image')
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.request('/recipes', {
      method: 'POST',
      body: formData,
      contentType: null // FormData define o Content-Type automaticamente
    });
  }

  /**
   * Atualiza uma receita existente
   */
  async updateRecipe(recipeId, recipeData, imageFile = null) {
    const formData = new FormData();
    
    Object.keys(recipeData).forEach(key => {
      if (Array.isArray(recipeData[key])) {
        // Para arrays, adicionar cada item separadamente
        recipeData[key].forEach(item => {
          formData.append(key, item);
        });
      } else if (recipeData[key] !== null && recipeData[key] !== undefined) {
        // Para valores simples, converter para string se necessário
        formData.append(key, recipeData[key]);
      }
    });

    // Adicionar imagem se fornecida (backend espera campo 'image')
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.request(`/recipes/${recipeId}`, {
      method: 'PUT',
      body: formData,
      contentType: null
    });
  }

  /**
   * Deleta uma receita
   */
  async deleteRecipe(recipeId) {
    return this.request(`/recipes/${recipeId}`, {
      method: 'DELETE'
    });
  }

  // ==================== RESTRIÇÕES (GERAL) ====================

  /**
   * Lista todas as restrições disponíveis
   */
  async listRestrictions() {
    return this.request('/restrictions', {
      includeAuth: false
    });
  }

  // ==================== USUÁRIOS ====================

  /**
   * Obtém dados do usuário atual
   */
  async getCurrentUserProfile() {
    return this.request('/users/profile');
  }

  /**
   * Atualiza dados do usuário atual
   */
  async updateUserProfile(userData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: userData
    });
  }

  /**
   * Obtém receitas publicadas do usuário
   */
  async getUserPublishedRecipes() {
    return this.request('/users/published-recipes');
  }

  /**
   * Obtém todas as receitas do usuário (incluindo rascunhos)
   * @param {string} status - Status opcional para filtrar ('publicada' ou 'rascunho'). Se não fornecido, retorna todas.
   */
  async getUserRecipes(status = null) {
    const queryParams = new URLSearchParams();
    if (status) {
      queryParams.append('status', status);
    }
    const queryString = queryParams.toString();
    const endpoint = `/users/recipes${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * Atualiza a foto de perfil do usuário
   * @param {File} photoFile - Arquivo de imagem da foto de perfil
   */
  async updateProfilePhoto(photoFile) {
    if (!photoFile) {
      throw new Error('Arquivo de foto é obrigatório');
    }

    const formData = new FormData();
    formData.append('photo', photoFile);

    return this.request('/users/profile/photo', {
      method: 'PUT',
      body: formData,
      contentType: null // FormData define o Content-Type automaticamente
    });
  }

  /**
   * Remove a foto de perfil do usuário
   */
  async removeProfilePhoto() {
    return this.request('/users/profile/photo', {
      method: 'DELETE'
    });
  }
}

// Criar instância única do serviço
const apiService = new ApiService();

// Exportar para uso global
window.apiService = apiService;

