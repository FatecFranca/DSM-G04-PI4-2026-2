/**
 * Script para página de login
 * Integra com a API do backend
 */

// Verificar se as dependências estão carregadas
if (!window.apiService || !window.utils) {
  console.error('Erro: apiService e utils devem ser carregados antes deste script.');
}

// Variáveis globais
let formLogin = null;
let btnSubmit = null;
let inputEmail = null;
let inputSenha = null;
let messageContainer = null;

function init() {
  // Buscar elementos após DOM estar pronto
  formLogin = document.querySelector('form') || document.getElementById('form-login');
  btnSubmit = formLogin?.querySelector('button[type="submit"]');
  inputEmail = document.getElementById('email') || formLogin?.querySelector('input[type="email"]');
  inputSenha = document.getElementById('senha') || formLogin?.querySelector('input[type="password"]');

  // Debug: verificar se elementos foram encontrados
  if (!formLogin) {
    console.error('Formulário não encontrado!');
    return;
  }
  if (!inputEmail) {
    console.error('Campo de email não encontrado!');
  }
  if (!inputSenha) {
    console.error('Campo de senha não encontrado!');
  }

  // Criar container para mensagens
  if (formLogin && !messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.id = 'login-messages';
    messageContainer.style.marginBottom = '15px';
    messageContainer.style.minHeight = '20px';
    
    // Inserir após o h2, antes dos campos
    const h2 = formLogin.querySelector('h2');
    if (h2) {
      h2.insertAdjacentElement('afterend', messageContainer);
    } else {
      // Se não encontrar h2, inserir no início do form
      formLogin.insertBefore(messageContainer, formLogin.firstChild);
    }
  }

  // Verificar se já está logado
  if (window.apiService?.isAuthenticated()) {
        window.location.href = window.ROUTES?.appPage?.('home') || '/Index/home.html';
    return;
  }

  // Event listener do formulário
  if (formLogin) {
    formLogin.addEventListener('submit', handleLogin);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  e.stopPropagation();

  // Buscar elementos diretamente pelo ID (mais confiável)
  const emailEl = document.getElementById('email');
  const senhaEl = document.getElementById('senha');

  // Verificar se elementos existem
  if (!emailEl) {
    console.error('Campo de email não encontrado!');
    alert('Erro: Campo de email não encontrado. Recarregue a página.');
    return;
  }

  if (!senhaEl) {
    console.error('Campo de senha não encontrado!');
    alert('Erro: Campo de senha não encontrado. Recarregue a página.');
    return;
  }

  // Buscar valores diretamente
  const email = (emailEl.value || '').trim();
  const senha = senhaEl.value || '';

  // Debug detalhado
  console.log('=== DEBUG LOGIN ===');
  console.log('Email elemento:', emailEl);
  console.log('Senha elemento:', senhaEl);
  console.log('Email valor bruto:', emailEl.value);
  console.log('Email valor processado:', email);
  console.log('Email length:', email.length);
  console.log('Senha valor bruto:', senhaEl.value ? '***' : '(vazio)');
  console.log('Senha length:', senha.length);
  console.log('==================');

  // Validação básica - verificar se está vazio
  if (email === '' || email.length === 0) {
    console.warn('Email vazio detectado');
    if (window.utils && messageContainer) {
      window.utils.showError('Por favor, preencha o campo de email.', messageContainer);
    } else {
      alert('Por favor, preencha o campo de email.');
    }
    emailEl.focus();
    return;
  }

  if (senha === '' || senha.length === 0) {
    console.warn('Senha vazia detectada');
    if (window.utils && messageContainer) {
      window.utils.showError('Por favor, preencha o campo de senha.', messageContainer);
    } else {
      alert('Por favor, preencha o campo de senha.');
    }
    senhaEl.focus();
    return;
  }

  console.log('Validação passou! Prosseguindo com login...');

  // Validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    window.utils?.showError('Por favor, insira um email válido.', messageContainer);
    return;
  }

  try {
    const response = await window.utils.executeWithLoading(
      async () => await window.apiService.login(email, senha),
      {
        button: btnSubmit,
        errorContainer: messageContainer,
        loadingMessage: 'Entrando...',
        successMessage: 'Login realizado com sucesso!',
        skipSessionRedirect: true
      }
    );

    if (!response?.data?.token && !window.apiService.isAuthenticated()) {
      window.utils?.showError('Login não retornou token válido. Tente novamente.', messageContainer, { skipSessionRedirect: true });
      return;
    }

    if (response && response.data) {
      const user = response.data.user;
      const homeUrl = window.ROUTES?.appPage?.('home') || '/Index/home.html';
      const restricoesUrl = window.ROUTES?.authPage?.('restricoes') || '/Index/autenticacao/restricoes.html';

      if (user && user.tem_restricao) {
        try {
          const restrictionsResponse = await window.apiService.getUserRestrictions();
          const hasRestrictions = restrictionsResponse?.success
            && Array.isArray(restrictionsResponse.data)
            && restrictionsResponse.data.length > 0;

          setTimeout(() => {
            window.location.href = hasRestrictions ? homeUrl : restricoesUrl;
          }, 500);
        } catch (restrictionsError) {
          console.warn('Não foi possível verificar restrições após login:', restrictionsError);
          setTimeout(() => {
            window.location.href = homeUrl;
          }, 500);
        }
      } else {
        setTimeout(() => {
          window.location.href = homeUrl;
        }, 500);
      }
    }
  } catch (error) {
    // Erro já foi tratado pelo executeWithLoading
    console.error('Erro no login:', error);
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

