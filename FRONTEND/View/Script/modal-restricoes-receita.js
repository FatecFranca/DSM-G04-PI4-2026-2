/**
 * Script para gerenciar a modal de seleção de restrições na receita
 */

// Variáveis globais
let todasRestricoes = [];
let restricoesSelecionadas = new Set(); // IDs das restrições selecionadas
let restricoesIniciais = new Set(); // Para comparar mudanças

// Elementos DOM (serão inicializados quando o DOM estiver pronto)
let modalRestricoes;
let modalBody;
let restricoesLista;
let loadingRestricoes;
let btnSelecionarRestricoes;
let btnFecharModal;
let btnCancelar;
let btnSalvar;
let restricoesTexto;
let restricoesContador;

/**
 * Inicializa os elementos DOM
 */
function inicializarElementosDOM() {
    modalRestricoes = document.getElementById('modal-restricoes-receita');
    modalBody = document.getElementById('modal-restricoes-body');
    restricoesLista = document.getElementById('restricoes-lista');
    loadingRestricoes = document.getElementById('loading-restricoes');
    btnSelecionarRestricoes = document.getElementById('btn-selecionar-restricoes');
    btnFecharModal = document.getElementById('btn-fechar-modal-restricoes');
    btnCancelar = document.getElementById('btn-cancelar-restricoes');
    btnSalvar = document.getElementById('btn-salvar-restricoes');
    restricoesTexto = document.getElementById('restricoes-selecionadas-texto');
    restricoesContador = document.getElementById('restricoes-contador');
    
    // Configurar event listeners após inicializar
    configurarEventListeners();
}

/**
 * Configura os event listeners
 */
function configurarEventListeners() {
    if (btnSelecionarRestricoes) {
        btnSelecionarRestricoes.addEventListener('click', abrirModalRestricoes);
    }

    if (btnFecharModal) {
        btnFecharModal.addEventListener('click', fecharModalRestricoes);
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            // Restaurar seleção inicial
            restricoesSelecionadas = new Set(restricoesIniciais);
            renderizarRestricoes();
            fecharModalRestricoes();
        });
    }

    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvarRestricoesSelecionadas);
    }

    // Fechar modal ao clicar fora
    if (modalRestricoes) {
        modalRestricoes.addEventListener('click', (e) => {
            if (e.target === modalRestricoes) {
                fecharModalRestricoes();
            }
        });
    }

    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalRestricoes && modalRestricoes.classList.contains('active')) {
            fecharModalRestricoes();
        }
    });
}

/**
 * Abre a modal de restrições
 */
function abrirModalRestricoes() {
    if (!modalRestricoes) {
        console.error('Modal de restrições não encontrada');
        return;
    }

    modalRestricoes.classList.add('active');
    modalRestricoes.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevenir scroll do body

    // Salvar estado inicial para comparação
    restricoesIniciais = new Set(restricoesSelecionadas);

    // Carregar restrições se ainda não foram carregadas
    if (todasRestricoes.length === 0) {
        carregarRestricoes();
    } else {
        renderizarRestricoes();
    }
}

/**
 * Fecha a modal de restrições
 */
function fecharModalRestricoes() {
    if (!modalRestricoes) return;

    modalRestricoes.classList.remove('active');
    modalRestricoes.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restaurar scroll

    // Se cancelou, restaurar seleção inicial
    restricoesSelecionadas = new Set(restricoesIniciais);
}

/**
 * Carrega todas as restrições disponíveis da API
 */
async function carregarRestricoes() {
    try {
        if (loadingRestricoes) loadingRestricoes.style.display = 'block';
        if (restricoesLista) restricoesLista.style.display = 'none';

        if (!window.apiService) {
            throw new Error('Serviço de API não disponível');
        }

        const response = await window.apiService.listRestrictions();

        // Processar resposta
        if (response.success !== undefined) {
            todasRestricoes = response.data || [];
        } else if (Array.isArray(response)) {
            todasRestricoes = response;
        } else if (response.data) {
            todasRestricoes = Array.isArray(response.data) ? response.data : [];
        } else {
            todasRestricoes = [];
        }

        console.log(`✅ ${todasRestricoes.length} restrições carregadas`);

        if (loadingRestricoes) loadingRestricoes.style.display = 'none';
        if (restricoesLista) restricoesLista.style.display = 'block';

        renderizarRestricoes();

    } catch (error) {
        console.error('❌ Erro ao carregar restrições:', error);
        if (loadingRestricoes) {
            loadingRestricoes.innerHTML = `
                <p style="color: #c33;">Erro ao carregar restrições: ${error.message || 'Erro desconhecido'}</p>
                <button onclick="carregarRestricoes()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #fdb447; border: none; border-radius: 8px; cursor: pointer;">
                    Tentar Novamente
                </button>
            `;
        }
    }
}

/**
 * Renderiza as restrições na modal, agrupadas por categoria
 */
function renderizarRestricoes() {
    if (!restricoesLista) return;

    // Agrupar por categoria
    const restricoesPorCategoria = {};
    todasRestricoes.forEach(restricao => {
        const categoria = restricao.categoria || 'Outras';
        if (!restricoesPorCategoria[categoria]) {
            restricoesPorCategoria[categoria] = [];
        }
        restricoesPorCategoria[categoria].push(restricao);
    });

    // Criar HTML
    let html = '';
    const categoriasOrdenadas = Object.keys(restricoesPorCategoria).sort();

    categoriasOrdenadas.forEach(categoria => {
        html += `<div class="categoria-restricoes">`;
        html += `<h3 class="categoria-titulo">${categoria}</h3>`;
        html += `<div class="restricoes-grid">`;

        restricoesPorCategoria[categoria].forEach(restricao => {
            const isChecked = restricoesSelecionadas.has(restricao.id);
            html += `
                <label class="restricao-item">
                    <input 
                        type="checkbox" 
                        value="${restricao.id}" 
                        data-restriction-id="${restricao.id}"
                        data-restriction-nome="${restricao.nome || ''}"
                        ${isChecked ? 'checked' : ''}
                    >
                    <span>${restricao.nome || 'Restrição sem nome'}</span>
                </label>
            `;
        });

        html += `</div></div>`;
    });

    restricoesLista.innerHTML = html;

    // Adicionar event listeners aos checkboxes
    const checkboxes = restricoesLista.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const restrictionId = parseInt(e.target.value);
            if (e.target.checked) {
                restricoesSelecionadas.add(restrictionId);
            } else {
                restricoesSelecionadas.delete(restrictionId);
            }
            atualizarContador();
        });
    });

    atualizarContador();
}

/**
 * Atualiza o contador de restrições selecionadas
 */
function atualizarContador() {
    const count = restricoesSelecionadas.size;
    
    if (restricoesContador) {
        if (count > 0) {
            restricoesContador.textContent = count;
            restricoesContador.style.display = 'inline-block';
        } else {
            restricoesContador.style.display = 'none';
        }
    }

    if (restricoesTexto) {
        if (count > 0) {
            const nomes = Array.from(restricoesSelecionadas).map(id => {
                const restricao = todasRestricoes.find(r => r.id === id);
                return restricao ? restricao.nome : '';
            }).filter(n => n);
            restricoesTexto.textContent = nomes.length > 0 
                ? `${nomes.slice(0, 2).join(', ')}${nomes.length > 2 ? ` +${nomes.length - 2}` : ''}`
                : `${count} restrição(ões) selecionada(s)`;
        } else {
            restricoesTexto.textContent = 'Selecionar Restrições';
        }
    }
}

/**
 * Salva a seleção de restrições
 */
function salvarRestricoesSelecionadas() {
    // Atualizar estado inicial
    restricoesIniciais = new Set(restricoesSelecionadas);
    
    // Fechar modal
    fecharModalRestricoes();
    
    console.log('✅ Restrições selecionadas:', Array.from(restricoesSelecionadas));
}

/**
 * Obtém as restrições selecionadas
 * @returns {Array<number>} Array de IDs das restrições selecionadas
 */
function getRestricoesSelecionadas() {
    return Array.from(restricoesSelecionadas);
}

/**
 * Define as restrições selecionadas (útil ao carregar receita para edição)
 * @param {Array<number>} restrictionIds - Array de IDs das restrições
 */
function setRestricoesSelecionadas(restrictionIds) {
    if (!restrictionIds || !Array.isArray(restrictionIds) || restrictionIds.length === 0) {
        console.log('⚠️ setRestricoesSelecionadas chamado com dados inválidos:', restrictionIds);
        return;
    }
    
    // Converter para números e filtrar valores inválidos
    const ids = restrictionIds
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id) && id > 0);
    
    if (ids.length === 0) {
        console.log('⚠️ Nenhum ID válido encontrado após processamento');
        return;
    }
    
    restricoesSelecionadas = new Set(ids);
    restricoesIniciais = new Set(restricoesSelecionadas);
    atualizarContador();
    
    console.log('✅ Restrições definidas:', Array.from(restricoesSelecionadas));
    
    // Re-renderizar se a modal estiver aberta
    if (modalRestricoes && modalRestricoes.classList.contains('active')) {
        renderizarRestricoes();
    }
}

/**
 * Limpa todas as restrições selecionadas
 */
function limparRestricoesSelecionadas() {
    restricoesSelecionadas.clear();
    restricoesIniciais.clear();
    atualizarContador();
    console.log('🧹 Restrições limpas');
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarElementosDOM);
} else {
    // DOM já está pronto
    inicializarElementosDOM();
}

// Exportar funções globais
window.abrirModalRestricoes = abrirModalRestricoes;
window.fecharModalRestricoes = fecharModalRestricoes;
window.getRestricoesSelecionadas = getRestricoesSelecionadas;
window.setRestricoesSelecionadas = setRestricoesSelecionadas;
window.limparRestricoesSelecionadas = limparRestricoesSelecionadas;

