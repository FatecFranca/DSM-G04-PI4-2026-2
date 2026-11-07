/**
 * Painel de Debug - Pode ser ativado em qualquer página
 * Ative pressionando Ctrl+Shift+D ou adicione ?debug=true na URL
 */

class DebugPanel {
  constructor() {
    this.isOpen = false;
    this.panel = null;
    this.init();
  }

  init() {
    // Verificar se deve abrir automaticamente
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
      this.createPanel();
      this.toggle();
    }

    // Atalho de teclado: Ctrl+Shift+D
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        if (!this.panel) {
          this.createPanel();
        }
        this.toggle();
      }
    });
  }

  createPanel() {
    // Criar container do painel
    this.panel = document.createElement('div');
    this.panel.id = 'debug-panel';
    this.panel.innerHTML = `
      <div class="debug-header">
        <h3>🐛 Painel de Debug</h3>
        <button class="debug-close" id="debug-close">×</button>
      </div>
      <div class="debug-tabs">
        <button class="debug-tab active" data-tab="api">API</button>
        <button class="debug-tab" data-tab="storage">Storage</button>
        <button class="debug-tab" data-tab="info">Info</button>
      </div>
      <div class="debug-content">
        <div class="debug-tab-content active" id="tab-api">
          <div class="debug-section">
            <h4>Status da API</h4>
            <div id="debug-api-status">Verificando...</div>
            <button class="debug-btn" id="debug-check-api">Verificar Conexão</button>
          </div>
          <div class="debug-section">
            <h4>Autenticação</h4>
            <div id="debug-auth-info">-</div>
            <button class="debug-btn" id="debug-logout">Logout</button>
          </div>
          <div class="debug-section">
            <h4>Teste Rápido</h4>
            <input type="text" id="debug-endpoint" placeholder="/api/users/restrictions" class="debug-input">
            <select id="debug-method" class="debug-input">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <textarea id="debug-body" placeholder='{"key": "value"}' class="debug-textarea"></textarea>
            <button class="debug-btn" id="debug-send-request">Enviar Requisição</button>
            <div id="debug-response" class="debug-response"></div>
          </div>
        </div>
        <div class="debug-tab-content" id="tab-storage">
          <div class="debug-section">
            <h4>LocalStorage</h4>
            <div id="debug-storage-content"></div>
            <button class="debug-btn" id="debug-clear-storage">Limpar Storage</button>
          </div>
        </div>
        <div class="debug-tab-content" id="tab-info">
          <div class="debug-section">
            <h4>Informações do Sistema</h4>
            <div id="debug-system-info"></div>
          </div>
        </div>
      </div>
    `;

    // Adicionar estilos
    this.addStyles();
    
    // Adicionar ao body
    document.body.appendChild(this.panel);

    // Event listeners
    this.setupEventListeners();
    
    // Atualizar informações
    this.updateInfo();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #debug-panel {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 400px;
        max-height: 80vh;
        background: white;
        border: 2px solid #667eea;
        border-radius: 8px 0 0 0;
        box-shadow: -4px -4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        display: none;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
      }
      
      #debug-panel.open {
        display: flex;
      }
      
      .debug-header {
        background: #667eea;
        color: white;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 6px 0 0 0;
      }
      
      .debug-header h3 {
        margin: 0;
        font-size: 16px;
      }
      
      .debug-close {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
      }
      
      .debug-close:hover {
        background: rgba(255,255,255,0.3);
      }
      
      .debug-tabs {
        display: flex;
        border-bottom: 1px solid #ddd;
      }
      
      .debug-tab {
        flex: 1;
        padding: 10px;
        border: none;
        background: #f5f5f5;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      }
      
      .debug-tab.active {
        background: white;
        border-bottom-color: #667eea;
        font-weight: 600;
      }
      
      .debug-content {
        overflow-y: auto;
        flex: 1;
        padding: 12px;
      }
      
      .debug-tab-content {
        display: none;
      }
      
      .debug-tab-content.active {
        display: block;
      }
      
      .debug-section {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }
      
      .debug-section:last-child {
        border-bottom: none;
      }
      
      .debug-section h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #667eea;
      }
      
      .debug-btn {
        padding: 6px 12px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-top: 8px;
      }
      
      .debug-btn:hover {
        background: #5568d3;
      }
      
      .debug-input, .debug-textarea {
        width: 100%;
        padding: 6px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 12px;
        margin-bottom: 8px;
        font-family: 'Courier New', monospace;
      }
      
      .debug-textarea {
        min-height: 60px;
        resize: vertical;
      }
      
      .debug-response {
        margin-top: 10px;
        padding: 8px;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 11px;
        font-family: 'Courier New', monospace;
        max-height: 200px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }
      
      .debug-response.success {
        background: #d4edda;
        color: #155724;
      }
      
      .debug-response.error {
        background: #f8d7da;
        color: #721c24;
      }
      
      #debug-storage-content {
        font-size: 11px;
        font-family: 'Courier New', monospace;
        background: #f5f5f5;
        padding: 8px;
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        white-space: pre-wrap;
      }
      
      #debug-system-info {
        font-size: 11px;
        font-family: 'Courier New', monospace;
        background: #f5f5f5;
        padding: 8px;
        border-radius: 4px;
        white-space: pre-wrap;
      }
      
      @media (max-width: 768px) {
        #debug-panel {
          width: 100%;
          max-height: 100vh;
          border-radius: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Fechar painel
    const closeBtn = this.panel.querySelector('#debug-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggle());
    }

    // Tabs
    const tabs = this.panel.querySelectorAll('.debug-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Verificar API
    const checkApiBtn = this.panel.querySelector('#debug-check-api');
    if (checkApiBtn) {
      checkApiBtn.addEventListener('click', () => this.checkApi());
    }

    // Logout
    const logoutBtn = this.panel.querySelector('#debug-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Enviar requisição
    const sendBtn = this.panel.querySelector('#debug-send-request');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendRequest());
    }

    // Limpar storage
    const clearStorageBtn = this.panel.querySelector('#debug-clear-storage');
    if (clearStorageBtn) {
      clearStorageBtn.addEventListener('click', () => this.clearStorage());
    }
  }

  toggle() {
    if (!this.panel) return;
    this.isOpen = !this.isOpen;
    this.panel.classList.toggle('open', this.isOpen);
    
    if (this.isOpen) {
      this.updateInfo();
    }
  }

  switchTab(tabName) {
    // Atualizar tabs
    this.panel.querySelectorAll('.debug-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Atualizar conteúdo
    this.panel.querySelectorAll('.debug-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabName}`);
    });

    // Atualizar informações específicas da tab
    if (tabName === 'storage') {
      this.updateStorage();
    } else if (tabName === 'info') {
      this.updateSystemInfo();
    }
  }

  async checkApi() {
    const statusEl = this.panel.querySelector('#debug-api-status');
    if (!statusEl) return;

    statusEl.textContent = 'Verificando...';
    
    try {
      const response = await fetch(`${window.CONFIG?.API_BASE_URL || 'http://localhost:3001/api'}/health`);
      const data = await response.json();
      statusEl.innerHTML = `
        <div style="color: green;">✅ Conectado</div>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">
          Status: ${data.status}<br>
          Uptime: ${Math.floor(data.uptime)}s
        </div>
      `;
    } catch (error) {
      statusEl.innerHTML = `<div style="color: red;">❌ Erro: ${error.message}</div>`;
    }
  }

  updateAuthInfo() {
    const authEl = this.panel.querySelector('#debug-auth-info');
    if (!authEl) return;

    const isAuth = window.apiService?.isAuthenticated();
    const user = window.apiService?.getCurrentUser();

    if (isAuth && user) {
      authEl.innerHTML = `
        <div style="color: green;">✅ Autenticado</div>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">
          Nome: ${user.nome_completo || 'N/A'}<br>
          Email: ${user.email || 'N/A'}<br>
          ID: ${user.id || 'N/A'}
        </div>
      `;
    } else {
      authEl.innerHTML = '<div style="color: red;">❌ Não autenticado</div>';
    }
  }

  async handleLogout() {
    if (!window.apiService) {
      alert('apiService não disponível');
      return;
    }

    try {
      await window.apiService.logout();
      this.updateAuthInfo();
      alert('Logout realizado com sucesso!');
    } catch (error) {
      alert(`Erro ao fazer logout: ${error.message}`);
    }
  }

  async sendRequest() {
    const endpointEl = this.panel.querySelector('#debug-endpoint');
    const methodEl = this.panel.querySelector('#debug-method');
    const bodyEl = this.panel.querySelector('#debug-body');
    const responseEl = this.panel.querySelector('#debug-response');

    if (!endpointEl || !methodEl || !responseEl) return;

    const endpoint = endpointEl.value.trim();
    const method = methodEl.value;
    const bodyText = bodyEl.value.trim();

    if (!endpoint) {
      responseEl.textContent = 'Erro: Endpoint é obrigatório';
      responseEl.className = 'debug-response error';
      return;
    }

    responseEl.textContent = 'Enviando...';
    responseEl.className = 'debug-response';

    try {
      const url = endpoint.startsWith('http') 
        ? endpoint 
        : `${window.CONFIG?.API_BASE_URL || 'http://localhost:3001/api'}${endpoint}`;

      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Adicionar token se disponível
      if (window.apiService?.getToken()) {
        options.headers['Authorization'] = `Bearer ${window.apiService.getToken()}`;
      }

      // Adicionar body se for POST/PUT
      if ((method === 'POST' || method === 'PUT') && bodyText) {
        try {
          options.body = JSON.stringify(JSON.parse(bodyText));
        } catch (e) {
          options.body = bodyText;
        }
      }

      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      let data;
      if (isJson) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      responseEl.textContent = JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      }, null, 2);

      responseEl.className = `debug-response ${response.ok ? 'success' : 'error'}`;
    } catch (error) {
      responseEl.textContent = `Erro: ${error.message}`;
      responseEl.className = 'debug-response error';
    }
  }

  updateStorage() {
    const storageEl = this.panel.querySelector('#debug-storage-content');
    if (!storageEl) return;

    const storage = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        storage[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        storage[key] = localStorage.getItem(key);
      }
    }

    storageEl.textContent = JSON.stringify(storage, null, 2);
  }

  clearStorage() {
    if (confirm('Tem certeza que deseja limpar todo o localStorage?')) {
      localStorage.clear();
      this.updateStorage();
      alert('LocalStorage limpo!');
    }
  }

  updateSystemInfo() {
    const infoEl = this.panel.querySelector('#debug-system-info');
    if (!infoEl) return;

    const info = {
      'URL da API': window.CONFIG?.API_BASE_URL || 'Não configurado',
      'User Agent': navigator.userAgent,
      'URL Atual': window.location.href,
      'Autenticado': window.apiService?.isAuthenticated() ? 'Sim' : 'Não',
      'Token Presente': window.apiService?.getToken() ? 'Sim' : 'Não',
      'Versão do Navegador': navigator.appVersion,
      'Largura da Tela': `${window.innerWidth}px`,
      'Altura da Tela': `${window.innerHeight}px`
    };

    infoEl.textContent = JSON.stringify(info, null, 2);
  }

  updateInfo() {
    this.checkApi();
    this.updateAuthInfo();
    this.updateStorage();
    this.updateSystemInfo();
  }
}

// Inicializar painel de debug
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.debugPanel = new DebugPanel();
  });
} else {
  window.debugPanel = new DebugPanel();
}

