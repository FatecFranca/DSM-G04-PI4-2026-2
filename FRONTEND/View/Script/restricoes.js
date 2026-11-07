/**
 * Script para página de seleção de restrições alimentares
 * Integra com a API do backend para buscar e salvar restrições
 */

// Verificar se as dependências estão carregadas
if (!window.apiService || !window.utils) {
  console.error('Erro: apiService e utils devem ser carregados antes deste script.');
}

let todasRestricoes = [];
let restricoesSelecionadas = new Set();

let container = null;
let btnAvancar = null;

async function init() {
  // Obter referências aos elementos
  container = document.querySelector('.container .card');
  btnAvancar = document.getElementById('btn-avancar');

  if (!container) {
    console.error('Container .card não encontrado');
    return;
  }

  // Verificar se o usuário está autenticado
  if (!window.apiService?.isAuthenticated()) {
    console.warn('Usuário não autenticado. Redirecionando para login...');
    window.location.href = window.ROUTES?.authPage?.('inicio') || '/Index/autenticacao/inicio.html';
    return;
  }

  // Verificar se o usuário tem tem_restricao=true
  try {
    const profileResponse = await window.apiService.getCurrentUserProfile();
    const user = profileResponse?.data?.user;
    
    if (user && user.tem_restricao) {
      // Usuário marcou que tem restrição - tornar obrigatório cadastrar
      // Carregar restrições e verificar se já tem cadastradas
      const restrictionsResponse = await window.apiService.getUserRestrictions();
      const hasRestrictions = restrictionsResponse && restrictionsResponse.success 
        && restrictionsResponse.data && restrictionsResponse.data.length > 0;

      if (!hasRestrictions) {
        // Não tem restrições cadastradas - tornar obrigatório
        mostrarAvisoObrigatorio();
      }
    }
  } catch (error) {
    console.error('Erro ao verificar perfil do usuário:', error);
  }

  // Carregar restrições da API
  carregarRestricoes();

  // Adicionar listener ao botão Avançar
  if (btnAvancar) {
    btnAvancar.addEventListener('click', handleAvancar);
  }
}

async function carregarRestricoes() {
  try {
    mostrarLoading();

    // Buscar todas as restrições disponíveis
    const response = await window.apiService.listRestrictions();
    
    if (response && response.success && response.data) {
      todasRestricoes = response.data;
      renderizarRestricoes();
    } else {
      mostrarErro('Erro ao carregar restrições. Tente novamente.');
    }
  } catch (error) {
    console.error('Erro ao carregar restrições:', error);
    mostrarErro('Erro ao carregar restrições. Verifique sua conexão.');
  } finally {
    removerLoading();
  }
}

function renderizarRestricoes() {
  if (!container) {
    console.error('Container não encontrado');
    return;
  }

  // Agrupar restrições por categoria
  const restricoesPorCategoria = {};
  todasRestricoes.forEach(restricao => {
    const categoria = restricao.categoria || 'Outras';
    if (!restricoesPorCategoria[categoria]) {
      restricoesPorCategoria[categoria] = [];
    }
    restricoesPorCategoria[categoria].push(restricao);
  });

  // Limpar conteúdo existente (exceto título e logo)
  const titulo = container.querySelector('h2');
  const logo = container.querySelector('img');
  container.innerHTML = '';
  if (logo) container.appendChild(logo);
  if (titulo) container.appendChild(titulo);

  // Renderizar cada categoria
  Object.keys(restricoesPorCategoria).sort().forEach(categoria => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = categoria;
    details.appendChild(summary);

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';

    restricoesPorCategoria[categoria].forEach(restricao => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = restricao.id;
      checkbox.dataset.restrictionId = restricao.id;
      checkbox.dataset.restrictionNome = restricao.nome;

      // Adicionar listener para rastrear seleções
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          restricoesSelecionadas.add(restricao.id);
        } else {
          restricoesSelecionadas.delete(restricao.id);
        }
      });

      const textNode = document.createTextNode(` ${restricao.nome}`);
      label.appendChild(checkbox);
      label.appendChild(textNode);
      optionsDiv.appendChild(label);
    });

    details.appendChild(optionsDiv);
    container.appendChild(details);
  });
}

async function handleAvancar(e) {
  e.preventDefault();

  // Verificar se o usuário tem tem_restricao=true
  let temRestricao = false;
  try {
    const profileResponse = await window.apiService.getCurrentUserProfile();
    const user = profileResponse?.data?.user;
    temRestricao = user && user.tem_restricao;
  } catch (error) {
    console.error('Erro ao verificar perfil:', error);
  }

  if (restricoesSelecionadas.size === 0) {
    // Se tem_restricao=true, tornar obrigatório cadastrar pelo menos uma restrição
    if (temRestricao) {
      alert('Você indicou que tem restrições alimentares. Por favor, selecione pelo menos uma restrição antes de avançar.');
      return;
    }
    // Se não tem_restricao, pode avançar sem selecionar
    window.location.href = window.ROUTES?.appPage?.('home') || '/Index/home.html';
    return;
  }

  try {
    // Desabilitar botão durante o salvamento
    if (btnAvancar) {
      btnAvancar.disabled = true;
      btnAvancar.textContent = 'Salvando...';
    }

    // Salvar todas as restrições selecionadas
    const promises = Array.from(restricoesSelecionadas).map(restrictionId => {
      return window.apiService.addUserRestriction(restrictionId);
    });

    await Promise.all(promises);

    // Mostrar mensagem de sucesso
    if (window.utils) {
      window.utils.showSuccess('Restrições salvas com sucesso!');
    }

    // Aguardar um pouco antes de redirecionar
    setTimeout(() => {
      window.location.href = window.ROUTES?.appPage?.('home') || '/Index/home.html';
    }, 1000);
  } catch (error) {
    console.error('Erro ao salvar restrições:', error);
    
    // Reabilitar botão
    if (btnAvancar) {
      btnAvancar.disabled = false;
      btnAvancar.textContent = 'Avançar';
    }

    // Mostrar erro
    const errorMsg = error.message || 'Erro ao salvar restrições. Tente novamente.';
    if (window.utils) {
      window.utils.showError(errorMsg);
    } else {
      alert(errorMsg);
    }
  }
}

function mostrarLoading() {
  if (!container) return;
  
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-restricoes';
  loadingDiv.style.textAlign = 'center';
  loadingDiv.style.padding = '40px';
  loadingDiv.style.color = '#666';
  loadingDiv.textContent = 'Carregando restrições...';
  
  // Manter título e logo
  const titulo = container.querySelector('h2');
  const logo = container.querySelector('img');
  const existingContent = Array.from(container.children).filter(
    child => child.id !== 'loading-restricoes' && child.tagName !== 'H2' && child.tagName !== 'IMG'
  );
  existingContent.forEach(child => child.remove());
  
  container.appendChild(loadingDiv);
}

function removerLoading() {
  if (!container) return;
  const loadingDiv = document.getElementById('loading-restricoes');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

function mostrarErro(mensagem) {
  if (!container) return;
  
  removerLoading();
  
  const errorDiv = document.createElement('div');
  errorDiv.style.textAlign = 'center';
  errorDiv.style.padding = '40px';
  errorDiv.style.color = '#d32f2f';
  errorDiv.textContent = mensagem;
  
  container.appendChild(errorDiv);
}

function mostrarAvisoObrigatorio() {
  if (!container) return;

  const avisoDiv = document.createElement('div');
  avisoDiv.id = 'aviso-obrigatorio';
  avisoDiv.style.background = '#fff3cd';
  avisoDiv.style.border = '1px solid #ffc107';
  avisoDiv.style.borderRadius = '8px';
  avisoDiv.style.padding = '15px';
  avisoDiv.style.marginBottom = '20px';
  avisoDiv.style.color = '#856404';
  avisoDiv.style.textAlign = 'center';
  avisoDiv.innerHTML = '<strong>⚠️ Atenção:</strong> Você indicou que tem restrições alimentares. Por favor, selecione suas restrições antes de continuar.';
  
  // Inserir após o título
  const titulo = container.querySelector('h2');
  if (titulo) {
    titulo.insertAdjacentElement('afterend', avisoDiv);
  } else {
    container.insertBefore(avisoDiv, container.firstChild);
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

