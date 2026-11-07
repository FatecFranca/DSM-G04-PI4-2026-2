/**
 * Script para modal de restrições alimentares no menu principal
 * Adaptado do código de restricoes.js
 */

// Verificar se as dependências estão carregadas
if (!window.apiService || !window.utils) {
  console.error('Erro: apiService e utils devem ser carregados antes deste script.');
}

let todasRestricoes = [];
let restricoesSelecionadas = new Set();
let restricoesExistentes = new Set(); // Para marcar checkboxes que já foram selecionadas

const modalRestricoes = document.getElementById('modal-restricoes');
const modalBody = document.getElementById('modal-restricoes-body');
const btnSalvar = document.getElementById('btn-salvar-restricoes');

// Funções para abrir/fechar modal
function abrirModalRestricoes() {
  if (!modalRestricoes) return;
  
  modalRestricoes.classList.add('active');
  modalRestricoes.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Prevenir scroll da página
  
  // Carregar restrições
  carregarRestricoes();
}

function fecharModalRestricoes() {
  if (!modalRestricoes) return;
  
  modalRestricoes.classList.remove('active');
  modalRestricoes.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = ''; // Restaurar scroll
  
  // Limpar seleções ao fechar (opcional)
  // restricoesSelecionadas.clear();
}

// Tornar funções globais
window.abrirModalRestricoes = abrirModalRestricoes;
window.fecharModalRestricoes = fecharModalRestricoes;

async function carregarRestricoes() {
  try {
    mostrarLoading();

    // Buscar todas as restrições disponíveis
    const response = await window.apiService.listRestrictions();
    
    if (response && response.success && response.data) {
      todasRestricoes = response.data;
      
      // Carregar restrições já cadastradas do usuário
      await carregarRestricoesUsuario();
      
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

async function carregarRestricoesUsuario() {
  try {
    const response = await window.apiService.getUserRestrictions();
    
    if (response && response.success && response.data) {
      // Adicionar IDs das restrições já cadastradas
      restricoesExistentes.clear();
      response.data.forEach(ur => {
        restricoesExistentes.add(ur.restriction_id);
        restricoesSelecionadas.add(ur.restriction_id);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar restrições do usuário:', error);
  }
}

function renderizarRestricoes() {
  if (!modalBody) {
    console.error('Modal body não encontrado');
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

  // Limpar conteúdo existente
  modalBody.innerHTML = '';

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

      // Marcar como checked se já estiver cadastrada
      if (restricoesExistentes.has(restricao.id)) {
        checkbox.checked = true;
      }

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
    modalBody.appendChild(details);
  });

  // Adicionar aviso se necessário
  verificarAvisoObrigatorio();
}

async function verificarAvisoObrigatorio() {
  try {
    const profileResponse = await window.apiService.getCurrentUserProfile();
    const user = profileResponse?.data?.user;
    
    if (user && user.tem_restricao && restricoesSelecionadas.size === 0) {
      mostrarAvisoObrigatorio();
    }
  } catch (error) {
    console.error('Erro ao verificar perfil:', error);
  }
}

function mostrarAvisoObrigatorio() {
  if (!modalBody) return;

  // Verificar se o aviso já existe
  let avisoDiv = document.getElementById('aviso-obrigatorio-modal');
  
  if (!avisoDiv) {
    avisoDiv = document.createElement('div');
    avisoDiv.id = 'aviso-obrigatorio-modal';
    modalBody.insertBefore(avisoDiv, modalBody.firstChild);
  }
  
  avisoDiv.className = 'aviso-obrigatorio';
  avisoDiv.innerHTML = '<strong>⚠️ Atenção:</strong> Você indicou que tem restrições alimentares. Por favor, selecione suas restrições antes de continuar.';
}

async function handleSalvar() {
  if (!btnSalvar) return;

  // Verificar se o usuário tem tem_restricao=true
  let temRestricao = false;
  try {
    const profileResponse = await window.apiService.getCurrentUserProfile();
    const user = profileResponse?.data?.user;
    temRestricao = user && user.tem_restricao;
  } catch (error) {
    console.error('Erro ao verificar perfil:', error);
  }

  // Verificar se deve selecionar pelo menos uma
  if (restricoesSelecionadas.size === 0 && temRestricao) {
    alert('Você indicou que tem restrições alimentares. Por favor, selecione pelo menos uma restrição antes de salvar.');
    return;
  }

  try {
    // Desabilitar botão durante o salvamento
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    // Determinar quais adicionar e quais remover
    const paraAdicionar = Array.from(restricoesSelecionadas).filter(id => !restricoesExistentes.has(id));
    const paraRemover = Array.from(restricoesExistentes).filter(id => !restricoesSelecionadas.has(id));

    // Buscar userRestrictions para remover
    const userRestrictionsResponse = await window.apiService.getUserRestrictions();
    const userRestrictions = userRestrictionsResponse?.success && userRestrictionsResponse?.data 
      ? userRestrictionsResponse.data 
      : [];

    // Remover restrições desmarcadas
    const promisesRemover = paraRemover.map(restrictionId => {
      const userRestriction = userRestrictions.find(ur => ur.restriction_id === restrictionId);
      if (userRestriction && userRestriction.id) {
        // Usar o método removeRestriction do api.service
        return window.apiService.removeRestriction(userRestriction.id);
      }
      return Promise.resolve();
    });

    // Adicionar novas restrições
    const promisesAdicionar = paraAdicionar.map(restrictionId => {
      return window.apiService.addUserRestriction(restrictionId);
    });

    await Promise.all([...promisesRemover, ...promisesAdicionar]);

    // Atualizar lista de restrições existentes
    restricoesExistentes = new Set(restricoesSelecionadas);

    // Mostrar mensagem de sucesso
    if (window.utils) {
      window.utils.showSuccess('Restrições salvas com sucesso!');
    }

    // Fechar modal após um breve delay
    setTimeout(() => {
      fecharModalRestricoes();
    }, 1000);
  } catch (error) {
    console.error('Erro ao salvar restrições:', error);
    
    // Reabilitar botão
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar';

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
  if (!modalBody) return;
  
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-restricoes-modal';
  loadingDiv.style.textAlign = 'center';
  loadingDiv.style.padding = '40px';
  loadingDiv.style.color = '#666';
  loadingDiv.textContent = 'Carregando restrições...';
  
  modalBody.innerHTML = '';
  modalBody.appendChild(loadingDiv);
}

function removerLoading() {
  if (!modalBody) return;
  const loadingDiv = document.getElementById('loading-restricoes-modal');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

function mostrarErro(mensagem) {
  if (!modalBody) return;
  
  removerLoading();
  
  const errorDiv = document.createElement('div');
  errorDiv.style.textAlign = 'center';
  errorDiv.style.padding = '40px';
  errorDiv.style.color = '#d32f2f';
  errorDiv.textContent = mensagem;
  
  modalBody.appendChild(errorDiv);
}

// Inicializar
function initModalRestricoes() {
  if (btnSalvar) {
    btnSalvar.addEventListener('click', handleSalvar);
  }

  // Fechar modal ao pressionar Escape
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && modalRestricoes && modalRestricoes.classList.contains('active')) {
      fecharModalRestricoes();
    }
  });
}

// Verificar se deve abrir automaticamente
async function verificarAbrirAutomaticamente() {
  if (!window.apiService?.isAuthenticated()) return;

  try {
    const profileResponse = await window.apiService.getCurrentUserProfile();
    const user = profileResponse?.data?.user;
    
    if (user && user.tem_restricao) {
      // Verificar se já tem restrições cadastradas
      const restrictionsResponse = await window.apiService.getUserRestrictions();
      const hasRestrictions = restrictionsResponse && restrictionsResponse.success 
        && restrictionsResponse.data && restrictionsResponse.data.length > 0;

      if (!hasRestrictions) {
        // Não tem restrições cadastradas - abrir modal automaticamente
        setTimeout(() => {
          abrirModalRestricoes();
        }, 500); // Pequeno delay para garantir que o DOM está pronto
      }
    }
  } catch (error) {
    console.error('Erro ao verificar se deve abrir modal:', error);
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initModalRestricoes();
    verificarAbrirAutomaticamente();
  });
} else {
  initModalRestricoes();
  verificarAbrirAutomaticamente();
}

