/**
 * Script para página de cadastro
 * Integra com a API do backend
 */

// Verificar se as dependências estão carregadas
if (!window.apiService || !window.utils) {
  console.error('Erro: apiService e utils devem ser carregados antes deste script.');
}

const formCadastro = document.querySelector('form');
const btnSubmit = formCadastro?.querySelector('button[type="submit"]');
const inputNome = formCadastro?.querySelector('input[type="text"]');
const inputEmail = formCadastro?.querySelector('input[type="email"]');
const inputSenha = formCadastro?.querySelector('input[type="password"]');
const inputConfirmar = formCadastro?.querySelectorAll('input[type="password"]')[1];

// Container para mensagens
let messageContainer = null;

function init() {
  // Criar container para mensagens
  if (formCadastro && !messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.id = 'cadastro-messages';
    messageContainer.style.marginBottom = '15px';
    formCadastro.insertBefore(messageContainer, formCadastro.firstChild.nextSibling);
  }

  // Verificar se já está logado - se sim, redirecionar para menu principal
  if (window.apiService?.isAuthenticated()) {
    window.location.href = window.ROUTES?.appPage?.('home') || '/Index/home.html';
    return;
  }

  // Event listener do formulário
  if (formCadastro) {
    formCadastro.addEventListener('submit', handleCadastro);
  }
}

async function handleCadastro(e) {
  e.preventDefault();

  const nome = inputNome?.value.trim();
  const email = inputEmail?.value.trim();
  const senha = inputSenha?.value;
  const confirmar = inputConfirmar?.value;

  // Validação básica
  if (!nome || !email || !senha || !confirmar) {
    window.utils?.showError('Por favor, preencha todos os campos.', messageContainer);
    return;
  }

  // Validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    window.utils?.showError('Por favor, insira um email válido.', messageContainer);
    return;
  }

  // Validação de senha
  if (senha.length < 6) {
    window.utils?.showError('A senha deve ter pelo menos 6 caracteres.', messageContainer);
    return;
  }

  // Verificar se as senhas coincidem
  if (senha !== confirmar) {
    window.utils?.showError('As senhas não coincidem.', messageContainer);
    return;
  }

  try {
    // Buscar checkbox no momento do envio para garantir que está disponível
    const checkboxRestricao = document.getElementById('tem-restricao') || 
                               formCadastro?.querySelector('input[type="checkbox"]');
    
    // Garantir que tem_restricao seja um boolean
    const temRestricao = checkboxRestricao ? checkboxRestricao.checked : false;
    
    console.log('Checkbox encontrado:', checkboxRestricao);
    console.log('Checkbox estado:', checkboxRestricao?.checked);
    console.log('tem_restricao enviado:', temRestricao);
    console.log('Tipo do valor:', typeof temRestricao);
    
    const userData = {
      nome_completo: nome,
      email: email,
      senha: senha,
      tem_restricao: temRestricao
    };

    console.log('Dados completos enviados:', JSON.stringify({ ...userData, senha: '***' }));

    const response = await window.utils.executeWithLoading(
      async () => await window.apiService.register(userData),
      {
        button: btnSubmit,
        errorContainer: messageContainer,
        loadingMessage: 'Criando conta...',
        successMessage: 'Conta criada com sucesso!'
      }
    );

    if (response && response.data) {
      // Salvar token de autenticação
      if (response.data.token) {
        window.apiService.setToken(response.data.token);
      }

      // Sempre redirecionar para o menu principal
      // Se tem_restricao=true, o modal de restrições será aberto automaticamente
      setTimeout(() => {
        window.location.href = window.ROUTES?.appPage?.('home') || '/Index/home.html';
      }, 1000);
    }
  } catch (error) {
    // Erro já foi tratado pelo executeWithLoading
    console.error('Erro no cadastro:', error);
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

