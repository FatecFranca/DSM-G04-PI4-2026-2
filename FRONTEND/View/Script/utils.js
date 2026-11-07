/**
 * Utilitários para tratamento de erros e loading states
 */

/**
 * Verifica se o usuário está autenticado e redireciona se necessário
 * @param {string} redirectUrl - URL para redirecionar se não autenticado (padrão: tela inicial)
 * @returns {boolean} - true se autenticado, false caso contrário
 */
function requireAuth(redirectUrl = null) {
  if (!redirectUrl) {
    redirectUrl = window.ROUTES?.authPage?.('inicio')
      || window.ROUTES?.url?.(window.ROUTES?.auth?.inicio || 'autenticacao/inicio.html')
      || '/Index/autenticacao/inicio.html';
  }
  // Verificar se apiService está disponível
  if (!window.apiService) {
    console.warn('apiService não disponível. Redirecionando para tela inicial...');
    window.location.href = redirectUrl;
    return false;
  }

  // Verificar se está autenticado
  if (!window.apiService.isAuthenticated()) {
    console.warn('Usuário não autenticado. Redirecionando para tela inicial...');
    window.location.href = redirectUrl;
    return false;
  }

  return true;
}

// Exportar para uso global
window.utils = window.utils || {};
window.utils.requireAuth = requireAuth;

/**
 * Resolve URL de mídia retornada pela API (imagens de receitas, perfil, etc.)
 */
function resolveMediaUrl(path) {
  if (window.CONFIG?.resolveMediaUrl) {
    return window.CONFIG.resolveMediaUrl(path);
  }
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const server = (window.CONFIG?.SERVER_URL || 'http://localhost:3001').replace(/\/$/, '');
  if (path.startsWith('/')) return `${server}${path}`;
  return `${server}/uploads/${path}`;
}

/**
 * Exibe uma mensagem de erro amigável para o usuário
 * @param {Error|string} error - Erro ou mensagem de erro
 * @param {HTMLElement} container - Container onde exibir a mensagem (opcional)
 * @param {object} options - Opções (skipSessionRedirect: não redirecionar em 401)
 */
function showError(error, container = null, options = {}) {
  let message = 'Ocorreu um erro inesperado. Tente novamente.';

  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message || message;

    if (error.status === 401) {
      const apiMessage = (error.data?.message || error.message || '').toLowerCase();
      const isCredentialError = /inválid|invalid|incorret|credencial|email ou senha|senha incorreta/.test(apiMessage);
      const onAuthPage = /login|cadastro|inicio|autenticacao/.test(window.location.pathname);

      if (options.skipSessionRedirect || isCredentialError || onAuthPage) {
        message = error.data?.message || error.message || 'Email ou senha inválidos.';
      } else {
        message = 'Sessão expirada. Por favor, faça login novamente.';
        setTimeout(() => {
          const loginPath = window.ROUTES?.authPage?.('login')
            || window.ROUTES?.url?.(window.ROUTES?.auth?.login || 'autenticacao/login.html')
            || '/Index/autenticacao/login.html';
          window.location.href = loginPath;
        }, 2000);
      }
    } else if (error.status === 403) {
      message = 'Você não tem permissão para realizar esta ação.';
    } else if (error.status === 404) {
      message = 'Recurso não encontrado.';
    } else if (error.status === 409) {
      message = 'Este item já existe.';
    } else if (error.status === 422) {
      message = 'Dados inválidos. Verifique os campos e tente novamente.';
    } else if (error.status >= 500) {
      message = 'Erro no servidor. Tente novamente mais tarde.';
    }
  }

  // Exibir mensagem no container ou como alert
  if (container) {
    container.innerHTML = `
      <div class="error-message" style="
        background-color: #fee;
        color: #c33;
        padding: 12px;
        border-radius: 4px;
        margin: 10px 0;
        border: 1px solid #fcc;
      ">
        <strong>Erro:</strong> ${message}
      </div>
    `;
    container.style.display = 'block';
    
    // Remover mensagem após 5 segundos
    setTimeout(() => {
      container.style.display = 'none';
      container.innerHTML = '';
    }, 5000);
  } else {
    alert(message);
  }

  console.error('Erro:', error);
}

/**
 * Exibe uma mensagem de sucesso
 * @param {string} message - Mensagem de sucesso
 * @param {HTMLElement} container - Container onde exibir a mensagem (opcional)
 */
function showSuccess(message, container = null) {
  if (container) {
    container.innerHTML = `
      <div class="success-message" style="
        background-color: #efe;
        color: #3c3;
        padding: 12px;
        border-radius: 4px;
        margin: 10px 0;
        border: 1px solid #cfc;
      ">
        <strong>Sucesso:</strong> ${message}
      </div>
    `;
    container.style.display = 'block';
    
    // Remover mensagem após 3 segundos
    setTimeout(() => {
      container.style.display = 'none';
      container.innerHTML = '';
    }, 3000);
  } else {
    alert(message);
  }
}

/**
 * Cria um indicador de loading
 * @param {string} message - Mensagem a exibir durante o loading
 * @returns {HTMLElement} - Elemento de loading
 */
function createLoadingIndicator(message = 'Carregando...') {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-indicator';
  loadingDiv.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      gap: 10px;
    ">
      <div class="spinner" style="
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <span>${message}</span>
    </div>
  `;

  // Adicionar animação CSS se não existir
  if (!document.getElementById('loading-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  return loadingDiv;
}

/**
 * Mostra loading em um container
 * @param {HTMLElement} container - Container onde exibir o loading
 * @param {string} message - Mensagem do loading
 * @returns {Function} - Função para remover o loading
 */
function showLoading(container, message = 'Carregando...') {
  const loadingIndicator = createLoadingIndicator(message);
  container.appendChild(loadingIndicator);
  
  return () => {
    if (loadingIndicator.parentNode) {
      loadingIndicator.parentNode.removeChild(loadingIndicator);
    }
  };
}

/**
 * Desabilita um botão e mostra loading
 * @param {HTMLElement} button - Botão a desabilitar
 * @param {string} loadingText - Texto a exibir durante o loading
 * @returns {Function} - Função para restaurar o botão
 */
function disableButtonWithLoading(button, loadingText = 'Carregando...') {
  const originalText = button.textContent;
  const originalDisabled = button.disabled;
  
  button.disabled = true;
  button.textContent = loadingText;
  button.style.opacity = '0.6';
  button.style.cursor = 'not-allowed';
  
  return () => {
    button.disabled = originalDisabled;
    button.textContent = originalText;
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
  };
}

/**
 * Wrapper para executar funções assíncronas com tratamento de erro e loading
 * @param {Function} asyncFunction - Função assíncrona a executar
 * @param {object} options - Opções (loadingContainer, button, errorContainer, successMessage)
 * @returns {Promise} - Promise da função executada
 */
async function executeWithLoading(asyncFunction, options = {}) {
  const {
    loadingContainer = null,
    button = null,
    errorContainer = null,
    successMessage = null,
    loadingMessage = 'Carregando...',
    skipSessionRedirect = false
  } = options;

  let removeLoading = null;
  let restoreButton = null;

  try {
    // Mostrar loading
    if (loadingContainer) {
      removeLoading = showLoading(loadingContainer, loadingMessage);
    }
    
    if (button) {
      restoreButton = disableButtonWithLoading(button, loadingMessage);
    }

    // Executar função
    const result = await asyncFunction();

    // Mostrar mensagem de sucesso se fornecida
    if (successMessage) {
      showSuccess(successMessage, errorContainer);
    }

    return result;
  } catch (error) {
    showError(error, errorContainer, {
      skipSessionRedirect: options.skipSessionRedirect
    });
    throw error;
  } finally {
    // Remover loading
    if (removeLoading) {
      removeLoading();
    }
    
    if (restoreButton) {
      restoreButton();
    }
  }
}

/**
 * Extrai as iniciais do nome completo
 * Considera nomes compostos: primeira letra do primeiro nome + primeira letra do último nome
 * @param {string} nomeCompleto - Nome completo do usuário
 * @returns {string} - Iniciais (ex: "SB" para "Sebastião Barbosa Torres")
 */
function extrairIniciais(nomeCompleto) {
  if (!nomeCompleto || typeof nomeCompleto !== 'string') {
    return 'U'; // Default para "Usuário"
  }
  
  // Remover espaços extras e dividir em palavras
  const palavras = nomeCompleto.trim().split(/\s+/).filter(p => p.length > 0);
  
  if (palavras.length === 0) {
    return 'U';
  }
  
  if (palavras.length === 1) {
    // Se só tem uma palavra, usar as duas primeiras letras
    const primeiraPalavra = palavras[0];
    return primeiraPalavra.substring(0, 2).toUpperCase();
  }
  
  // Pegar primeira letra do primeiro nome e primeira letra do último nome
  const primeiroNome = palavras[0];
  const ultimoNome = palavras[palavras.length - 1];
  
  const primeiraInicial = primeiroNome.charAt(0).toUpperCase();
  const ultimaInicial = ultimoNome.charAt(0).toUpperCase();
  
  return primeiraInicial + ultimaInicial;
}

/**
 * Carrega a foto de perfil ou iniciais no botão do header
 * Esta função pode ser chamada em qualquer tela que tenha o botão de perfil
 */
async function carregarFotoPerfilHeader() {
  try {
    if (!window.apiService || !window.apiService.isAuthenticated()) {
      // Se não estiver autenticado, manter iniciais padrão
      const iniciaisPerfil = document.getElementById('iniciais-perfil-header');
      if (iniciaisPerfil) {
        iniciaisPerfil.textContent = 'U';
        iniciaisPerfil.style.display = 'flex';
      }
      return;
    }

    const fotoPerfilImg = document.getElementById('foto-perfil-header');
    const iniciaisPerfil = document.getElementById('iniciais-perfil-header');
    const btnPerfil = document.getElementById('btn_perfil');

    if (!fotoPerfilImg || !iniciaisPerfil || !btnPerfil) {
      console.warn('Elementos do perfil não encontrados no header');
      return;
    }

    // Buscar dados do perfil
    const response = await window.apiService.getCurrentUserProfile();
    
    if (!response || !response.success) {
      console.warn('Erro ao buscar perfil:', response?.message);
      return;
    }

    const userData = response.data?.user || response.data;
    
    if (!userData) {
      console.warn('Dados do usuário não encontrados');
      return;
    }

    // Se tem foto, mostrar foto e esconder iniciais
    if (userData.foto_perfil) {
      fotoPerfilImg.src = resolveMediaUrl(userData.foto_perfil);
      fotoPerfilImg.alt = `Foto de ${userData.nome_completo || 'perfil'}`;
      fotoPerfilImg.style.display = 'block';
      iniciaisPerfil.style.display = 'none';
      btnPerfil.classList.add('has-photo');
    } else {
      // Se não tem foto, mostrar iniciais
      fotoPerfilImg.style.display = 'none';
      iniciaisPerfil.style.display = 'flex';
      btnPerfil.classList.remove('has-photo');
      
      if (userData.nome_completo) {
        const iniciais = extrairIniciais(userData.nome_completo);
        iniciaisPerfil.textContent = iniciais;
      } else {
        iniciaisPerfil.textContent = 'U'; // Default
      }
    }
  } catch (error) {
    console.error('Erro ao carregar foto de perfil no header:', error);
    // Em caso de erro, manter as iniciais padrão
    const iniciaisPerfil = document.getElementById('iniciais-perfil-header');
    if (iniciaisPerfil) {
      iniciaisPerfil.textContent = 'U';
      iniciaisPerfil.style.display = 'flex';
    }
  }
}

/**
 * Aplica efeitos visuais de hover e press em um elemento
 * @param {HTMLElement} element - Elemento a receber os efeitos
 */
function attachInteractiveEffects(element) {
  if (!element) return;

  element.addEventListener('mouseenter', () => element.classList.add('hovered'));
  element.addEventListener('mouseleave', () => {
    element.classList.remove('hovered');
    element.classList.remove('pressed');
  });
  element.addEventListener('mousedown', () => element.classList.add('pressed'));
  element.addEventListener('mouseup', () => element.classList.remove('pressed'));
  element.addEventListener('touchstart', () => element.classList.add('pressed'), { passive: true });
  element.addEventListener('touchend', () => {
    element.classList.remove('pressed');
    element.classList.remove('hovered');
  }, { passive: true });
}

// Exportar funções para uso global
window.utils = {
  showError,
  showSuccess,
  createLoadingIndicator,
  showLoading,
  disableButtonWithLoading,
  executeWithLoading,
  extrairIniciais,
  carregarFotoPerfilHeader,
  attachInteractiveEffects,
  requireAuth,
  resolveMediaUrl
};

window.attachInteractiveEffects = attachInteractiveEffects;

// Exportar também globalmente para facilitar acesso
window.extrairIniciais = extrairIniciais;
window.carregarFotoPerfilHeader = carregarFotoPerfilHeader;
window.resolveMediaUrl = resolveMediaUrl;