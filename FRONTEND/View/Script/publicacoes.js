// Layout gerenciado por Script/components/layout.js

let receitaSelecionadaId = null;

// --- Função auxiliar para verificar página de registro ---
function isRegistroReceitaPage() {
    return window.location.pathname.includes('receita-formulario');
}

// ==================== FUNÇÕES DE CARREGAMENTO DE RECEITAS ====================

/**
 * Carrega todas as receitas do usuário logado (incluindo rascunhos)
 */
async function carregarReceitasPublicadas() {
    const containerReceitas = document.getElementById('container-receitas');
    const loadingReceitas = document.getElementById('loading-receitas');
    const mensagemVazia = document.getElementById('mensagem-vazia');

    if (!containerReceitas) {
        console.error('Container de receitas não encontrado');
        return;
    }

    // Mostrar loading
    if (loadingReceitas) loadingReceitas.style.display = 'block';
    if (mensagemVazia) mensagemVazia.style.display = 'none';

    try {
        // Verificar se apiService está disponível
        if (!window.apiService) {
            throw new Error('Serviço de API não disponível. Verifique se os scripts foram carregados corretamente.');
        }

        console.log('📡 Buscando receitas do usuário (incluindo rascunhos)...');
        
        // Buscar todas as receitas do usuário (incluindo rascunhos)
        const response = await window.apiService.getUserRecipes();
        
        console.log('✅ Resposta recebida da API:', response);

        // Processar resposta
        let receitas = [];
        if (response.success !== undefined) {
            if (!response.success) {
                throw new Error(response.message || 'Erro ao buscar receitas.');
            }
            receitas = response.data || [];
        } else if (response.data) {
            receitas = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
            receitas = response;
        }

        console.log(`📋 ${receitas.length} receita(s) encontrada(s)`);

        // Esconder loading
        if (loadingReceitas) loadingReceitas.style.display = 'none';

        // Renderizar receitas
        if (receitas.length === 0) {
            if (mensagemVazia) mensagemVazia.style.display = 'block';
            containerReceitas.innerHTML = '';
            if (mensagemVazia) containerReceitas.appendChild(mensagemVazia);
        } else {
            if (mensagemVazia) mensagemVazia.style.display = 'none';
            renderizarReceitas(receitas);
        }

    } catch (error) {
        console.error('❌ Erro ao carregar receitas:', error);
        if (loadingReceitas) loadingReceitas.style.display = 'none';
        
        // Mostrar mensagem de erro
        containerReceitas.innerHTML = `
            <div class="mensagem-erro" style="text-align: center; padding: 20px; color: #c33;">
                <p><strong>Erro ao carregar receitas</strong></p>
                <p style="font-size: 0.9em; margin-top: 10px;">${error.message || 'Erro desconhecido'}</p>
                <button onclick="carregarReceitasPublicadas()" style="margin-top: 15px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

/**
 * Renderiza os cards de receitas no container
 */
function renderizarReceitas(receitas) {
    const containerReceitas = document.getElementById('container-receitas');
    if (!containerReceitas) return;

    // Limpar container (exceto loading e mensagem vazia)
    const loadingReceitas = document.getElementById('loading-receitas');
    const mensagemVazia = document.getElementById('mensagem-vazia');
    
    containerReceitas.innerHTML = '';
    if (loadingReceitas) containerReceitas.appendChild(loadingReceitas);
    if (mensagemVazia) containerReceitas.appendChild(mensagemVazia);

    // Criar cards para cada receita
    receitas.forEach(receita => {
        console.log('📋 Processando receita:', receita);
        const card = criarCardReceita(receita);
        if (card) {
            containerReceitas.appendChild(card);
        } else {
            console.warn('⚠️ Card não criado para receita:', receita);
        }
    });
}

/**
 * Cria um card HTML para uma receita
 */
function criarCardReceita(receita) {
    const card = document.createElement('div');
    card.className = 'card-receita';
    
    // Garantir que temos um ID válido
    const receitaId = receita.id || receita.recipe_id;
    if (!receitaId) {
        console.error('Receita sem ID:', receita);
        return null;
    }
    
    card.setAttribute('data-receita-id', receitaId);

    // Processar imagem
    let imagemUrl = '../Images/suco_detox.jpg'; // Imagem padrão
    if (receita.imagem_url) {
            imagemUrl = resolveMediaUrl(receita.imagem_url);
        }

    // Nome da receita
    const nomeReceita = receita.nome || receita.titulo || 'Receita sem nome';

    // Criar estrutura do card
    card.innerHTML = `
        <img src="${imagemUrl}" alt="${nomeReceita}" onerror="this.src='../Images/suco_detox.jpg'">
        <p>${nomeReceita}</p>
    `;

    // Adicionar evento de clique - usar closure para garantir que o ID seja capturado
    card.addEventListener('click', (e) => {
        e.stopPropagation(); // Evitar propagação do evento
        const id = receitaId; // Usar a variável local
        console.log('📌 Card clicado - ID da receita:', id);
        receitaSelecionadaId = id;
        console.log('📌 receitaSelecionadaId definido como:', receitaSelecionadaId);
        abrirPopupReceita();
    });

    // Aplicar efeitos interativos
    attachInteractiveEffects(card);

    return card;
}

// ==================== FUNÇÕES DE POPUP ====================

const popupReceita = document.getElementById('popup-receita');

// Função para abrir o popup
function abrirPopupReceita() {
    if (!popupReceita) return;
    popupReceita.classList.add('ativo');
}

// Função para fechar o popup
function fecharPopupReceita() {
    if (!popupReceita) return;
    popupReceita.classList.remove('ativo');
    receitaSelecionadaId = null;
}

// Fechar popup ao clicar fora da caixa
if (popupReceita) {
    popupReceita.addEventListener('click', function (event) {
        // Se o clique for no fundo escuro (overlay) e não dentro do popup, fecha
        if (event.target === popupReceita) {
            fecharPopupReceita();
        }
    });
}

// Ações dos botões
function visualizarReceita() {
    console.log('👁️ Visualizar receita - receitaSelecionadaId:', receitaSelecionadaId);
    if (!receitaSelecionadaId) {
        alert('Erro: ID da receita não encontrado.');
        return;
    }
    
    // Salvar o ID antes de fechar o popup (para não perder o valor)
    const idParaVisualizar = receitaSelecionadaId;
    console.log('💾 ID salvo para visualização:', idParaVisualizar);
    
    fecharPopupReceita();
    
    // Usar o ID salvo para o redirecionamento
    console.log('🔗 Redirecionando para visualização com ID:', idParaVisualizar);
    window.location.href = `${window.ROUTES?.appPage?.('receitaDetalhe') || '/Index/receita-detalhe.html'}?receita=${idParaVisualizar}`;
}

function editarReceita() {
    console.log('✏️ Editar receita - receitaSelecionadaId:', receitaSelecionadaId);
    if (!receitaSelecionadaId) {
        alert('Erro: ID da receita não encontrado.');
        return;
    }
    
    // Salvar o ID antes de fechar o popup (para não perder o valor)
    const idParaEditar = receitaSelecionadaId;
    console.log('💾 ID salvo para edição:', idParaEditar);
    
    fecharPopupReceita();
    
    // Usar o ID salvo para o redirecionamento
    console.log('🔗 Redirecionando para edição com ID:', idParaEditar);
    window.location.href = `${window.ROUTES?.appPage?.('receitaFormulario') || '/Index/receita-formulario.html'}?editar=${idParaEditar}`;
}

const popupConfirmarExclusao = document.getElementById('popup-confirmar-exclusao');

// Atualiza a função do primeiro pop-up
function excluirReceita() {
    console.log('🗑️ Excluir receita - receitaSelecionadaId:', receitaSelecionadaId);
    if (!receitaSelecionadaId) {
        alert('Erro: ID da receita não encontrado.');
        fecharPopupReceita();
        return;
    }
    
    // Salvar o ID antes de fechar o popup (para não perder o valor)
    const idParaExcluir = receitaSelecionadaId;
    console.log('💾 ID salvo para exclusão:', idParaExcluir);
    
    fecharPopupReceita(); // fecha o pop-up das opções
    
    // Restaurar o ID após fechar (pois fecharPopupReceita() define como null)
    receitaSelecionadaId = idParaExcluir;
    
    setTimeout(() => {
        abrirPopupExcluir(); // abre o pop-up de confirmação
    }, 250); // pequeno delay para uma transição mais suave
}

// Abre o novo pop-up de confirmação
function abrirPopupExcluir() {
    if (!popupConfirmarExclusao) return;
    popupConfirmarExclusao.classList.add('ativo');
}

// Fecha o novo pop-up de exclusão
function fecharPopupExcluir() {
    if (!popupConfirmarExclusao) return;
    popupConfirmarExclusao.classList.remove('ativo');
    receitaSelecionadaId = null;
}

// Fecha ao clicar fora do pop-up
if (popupConfirmarExclusao) {
    popupConfirmarExclusao.addEventListener('click', function (event) {
        if (event.target === popupConfirmarExclusao) {
            fecharPopupExcluir();
        }
    });
}

/**
 * Confirma e executa a exclusão da receita
 */
async function confirmarExclusaoReceita() {
    console.log('🗑️ ========== Confirmar exclusão chamado ==========');
    console.log('📋 receitaSelecionadaId:', receitaSelecionadaId);
    console.log('📋 Tipo:', typeof receitaSelecionadaId);
    
    // Verificar se temos um ID válido (pode estar em window.receitaSelecionadaId também)
    let idParaExcluir = receitaSelecionadaId || window.receitaSelecionadaId;
    
    if (!idParaExcluir) {
        console.error('❌ ID da receita não encontrado!');
        console.error('❌ receitaSelecionadaId:', receitaSelecionadaId);
        console.error('❌ window.receitaSelecionadaId:', window.receitaSelecionadaId);
        alert('Erro: ID da receita não encontrado.');
        fecharPopupExcluir();
        return;
    }

    try {
        // Verificar se apiService está disponível
        if (!window.apiService) {
            throw new Error('Serviço de API não disponível.');
        }

        console.log(`🗑️ Excluindo receita ID: ${idParaExcluir}`);

        // Chamar API para excluir receita
        await window.apiService.deleteRecipe(idParaExcluir);

        console.log('✅ Receita excluída com sucesso');

        // Fechar popup
        fecharPopupExcluir();

        // Limpar ID selecionado
        receitaSelecionadaId = null;
        window.receitaSelecionadaId = null;

        // Recarregar lista de receitas
        await carregarReceitasPublicadas();

        // Mostrar mensagem de sucesso (opcional)
        // alert('Receita excluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao excluir receita:', error);
        alert(`Erro ao excluir receita: ${error.message || 'Erro desconhecido'}`);
    }
}

// ==================== INICIALIZAÇÃO ====================

function init() {
    const popupReceita = document.getElementById('popup-receita');
    const popupConfirmarExclusao = document.getElementById('popup-confirmar-exclusao');

    window.SafeBiteLayout.customGoBack = function customGoBack() {
        if (isRegistroReceitaPage()) {
            window.location.href = window.ROUTES?.appPage?.('publicacoes') || '/Index/publicacoes.html';
        } else if (history.length > 1) {
            history.back();
        } else {
            window.location.href = window.ROUTES?.appPage?.('home') || '/Index/home.html';
        }
    };

    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') {
            if (popupReceita && popupReceita.classList.contains('ativo')) {
                fecharPopupReceita();
            }
            if (popupConfirmarExclusao && popupConfirmarExclusao.classList.contains('ativo')) {
                fecharPopupExcluir();
            }
        }
    });

    if (!isRegistroReceitaPage()) {
        setTimeout(() => {
            if (window.apiService) {
                carregarReceitasPublicadas();
            } else {
                console.error('apiService não disponível! Verifique se os scripts foram carregados corretamente.');
            }
        }, 200);
    } else {
        initRegistroReceita();
    }
}

// Exportar funções globais
window.abrirRegistroReceita = function() {
    window.location.href = window.ROUTES?.appPage?.('receitaFormulario') || '/Index/receita-formulario.html';
};
window.abrirPopupReceita = abrirPopupReceita;
window.fecharPopupReceita = fecharPopupReceita;
window.visualizarReceita = visualizarReceita;
window.editarReceita = editarReceita;
window.excluirReceita = excluirReceita;
window.abrirPopupExcluir = abrirPopupExcluir;
window.fecharPopupExcluir = fecharPopupExcluir;
window.confirmarExclusaoReceita = confirmarExclusaoReceita;
window.carregarReceitasPublicadas = carregarReceitasPublicadas;

// Exportar variável para debug (opcional)
Object.defineProperty(window, 'receitaSelecionadaId', {
    get: () => receitaSelecionadaId,
    set: (value) => {
        receitaSelecionadaId = value;
        console.log('🔧 receitaSelecionadaId atualizado para:', value);
    }
});

// ==================== FUNÇÕES DE REGISTRO/EDIÇÃO DE RECEITA ====================

/**
 * Inicializa a página de registro/edição de receita
 */
async function initRegistroReceita() {
    if (!isRegistroReceitaPage()) {
        console.log('ℹ️ Não é página de registro, ignorando inicialização');
        return;
    }

    console.log('🚀 Inicializando página de registro/edição de receita...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const editarId = urlParams.get('editar');
    
    console.log('📝 ID de edição:', editarId);
    
    // Prevenir submit do formulário
    const formReceita = document.getElementById('form-receita');
    if (formReceita) {
        formReceita.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚠️ Submit do formulário prevenido');
            return false;
        });
        console.log('✅ Submit do formulário prevenido');
    }
    
    // Configurar upload de imagem
    console.log('📷 Configurando upload de imagem...');
    setupImageUpload();
    
    // Configurar botão salvar
    console.log('💾 Configurando botão salvar...');
    setupSalvarButton();
    
    // Se há ID de edição, carregar receita
    if (editarId) {
        console.log('📥 Carregando receita para edição...');
        await carregarReceitaParaEdicao(editarId);
    } else {
        console.log('➕ Modo de criação de nova receita');
    }
    
    console.log('✅ Inicialização da página de registro concluída');
}

/**
 * Configura o upload de imagem
 */
function setupImageUpload() {
    const inputFoto = document.getElementById('foto');
    const uploadArea = document.getElementById('upload-area');
    const previewImagem = document.getElementById('preview-imagem');
    const placeholderCamera = document.getElementById('placeholder-camera');
    const nomeArquivo = document.getElementById('nome-arquivo');

    if (!inputFoto || !uploadArea) return;

    // Clique na área de upload
    uploadArea.addEventListener('click', () => {
        inputFoto.click();
    });

    // Mudança no input de arquivo
    inputFoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/')) {
                mostrarMensagemForm('Por favor, selecione um arquivo de imagem válido.', 'erro');
                inputFoto.value = '';
                return;
            }

            // Validar tamanho (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                mostrarMensagemForm('A imagem deve ter no máximo 5MB.', 'erro');
                inputFoto.value = '';
                return;
            }

            // Mostrar preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImagem.src = e.target.result;
                previewImagem.style.display = 'block';
                if (placeholderCamera) placeholderCamera.style.display = 'none';
                if (nomeArquivo) {
                    nomeArquivo.textContent = file.name;
                    nomeArquivo.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Configura o botão de salvar
 */
function setupSalvarButton() {
    const btnSalvar = document.getElementById('btn-salvar');
    if (!btnSalvar) {
        console.error('❌ Botão btn-salvar não encontrado!');
        return;
    }

    console.log('✅ Botão salvar encontrado, configurando evento...');
    console.log('📋 Estado atual - receitaEditandoId:', window.receitaEditandoId);
    
    // Remover event listeners anteriores para evitar duplicação
    // Criar um novo botão para substituir o antigo
    const novoBtnSalvar = btnSalvar.cloneNode(true);
    
    // Preservar estado do botão (disabled, textContent)
    novoBtnSalvar.disabled = btnSalvar.disabled;
    novoBtnSalvar.textContent = btnSalvar.textContent;
    
    // Substituir o botão antigo pelo novo
    btnSalvar.parentNode.replaceChild(novoBtnSalvar, btnSalvar);
    
    // Adicionar novo event listener no botão novo
    novoBtnSalvar.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ ========== Botão salvar clicado! ==========');
        console.log('📋 receitaEditandoId no momento do clique:', window.receitaEditandoId);
        console.log('📋 Tipo:', typeof window.receitaEditandoId);
        
        // Verificar se o botão não está desabilitado
        if (novoBtnSalvar.disabled) {
            console.warn('⚠️ Botão está desabilitado, ignorando clique');
            return;
        }
        
        // Verificar se a função salvarReceita existe
        if (typeof salvarReceita !== 'function') {
            console.error('❌ Função salvarReceita não encontrada!');
            alert('Erro: Função de salvar não encontrada. Recarregue a página.');
            return;
        }
        
        console.log('✅ Chamando função salvarReceita...');
        try {
            await salvarReceita();
        } catch (err) {
            console.error('❌ Erro ao executar salvarReceita:', err);
            alert('Erro ao salvar receita: ' + (err.message || 'Erro desconhecido'));
        }
    });
    
    // Também adicionar como onclick direto como fallback
    novoBtnSalvar.onclick = async function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ [FALLBACK] Botão clicado via onclick direto');
        if (!novoBtnSalvar.disabled && typeof salvarReceita === 'function') {
            await salvarReceita();
        }
    };
    
    console.log('✅ Evento de clique configurado no botão salvar');
    console.log('📋 Botão configurado - disabled:', novoBtnSalvar.disabled, 'text:', novoBtnSalvar.textContent);
    console.log('📋 ID do botão:', novoBtnSalvar.id);
}

/**
 * Carrega receita para edição
 */
async function carregarReceitaParaEdicao(receitaId) {
    try {
        // Mostrar loading
        const btnSalvar = document.getElementById('btn-salvar');
        if (btnSalvar) {
            btnSalvar.disabled = true;
            btnSalvar.textContent = 'Carregando...';
        }

        // Verificar se apiService está disponível
        if (!window.apiService) {
            throw new Error('Serviço de API não disponível.');
        }

        console.log(`📡 Carregando receita ID: ${receitaId} para edição...`);

        // Buscar receita
        const response = await window.apiService.getRecipeById(receitaId);
        
        // Processar resposta
        let receitaData = null;
        if (response.success !== undefined) {
            if (!response.success) {
                throw new Error(response.message || 'Erro ao buscar receita.');
            }
            receitaData = response.data;
        } else if (response.data) {
            receitaData = response.data;
        } else {
            receitaData = response;
        }

        if (!receitaData) {
            throw new Error('Dados da receita não encontrados.');
        }

        console.log('✅ Receita carregada:', receitaData);
        console.log('📋 Restrições da receita:', receitaData.restrictions);
        console.log('📋 restricoes_detectadas:', receitaData.restricoes_detectadas);

        // Preencher formulário
        preencherFormularioReceita(receitaData);

        // Atualizar título da página
        const tituloPagina = document.getElementById('titulo-pagina');
        if (tituloPagina) {
            tituloPagina.textContent = 'Editar Receita';
        }

        // Atualizar botão e reconfigurar evento (pois o botão pode ter sido clonado)
        const btnSalvarAtualizado = document.getElementById('btn-salvar');
        if (btnSalvarAtualizado) {
            btnSalvarAtualizado.disabled = false;
            btnSalvarAtualizado.textContent = 'Atualizar Receita';
            // Reconfigurar evento após carregar receita
            console.log('🔄 Reconfigurando evento do botão após carregar receita...');
            setupSalvarButton();
        }

    } catch (error) {
        console.error('❌ Erro ao carregar receita:', error);
        mostrarMensagemForm(`Erro ao carregar receita: ${error.message || 'Erro desconhecido'}`, 'erro');
        
        const btnSalvar = document.getElementById('btn-salvar');
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar';
            // Reconfigurar evento mesmo em caso de erro
            setupSalvarButton();
        }
    }
}

/**
 * Preenche o formulário com dados da receita
 */
function preencherFormularioReceita(receita) {
    // Nome (titulo)
    const inputNome = document.getElementById('nome');
    if (inputNome) {
        inputNome.value = receita.nome || receita.titulo || '';
    }

    // Descrição (propriedades)
    const inputPropriedades = document.getElementById('propriedades');
    if (inputPropriedades) {
        inputPropriedades.value = receita.propriedades || receita.descricao || '';
    }

    // Ingredientes
    const textareaIngredientes = document.getElementById('ingredientes');
    if (textareaIngredientes) {
        let ingredientesTexto = '';
        if (Array.isArray(receita.ingredientes)) {
            ingredientesTexto = receita.ingredientes.join(', ');
        } else if (typeof receita.ingredientes === 'string') {
            try {
                const parsed = JSON.parse(receita.ingredientes);
                ingredientesTexto = Array.isArray(parsed) ? parsed.join(', ') : receita.ingredientes;
            } catch {
                ingredientesTexto = receita.ingredientes;
            }
        }
        textareaIngredientes.value = ingredientesTexto;
    }

    // Tempo
    const inputTempo = document.getElementById('tempo');
    if (inputTempo) {
        inputTempo.value = receita.tempo_preparo || '';
    }

    // Rendimento
    const inputRendimento = document.getElementById('rendimento');
    if (inputRendimento) {
        inputRendimento.value = receita.rendimento || '';
    }

    // Modo de preparo
    const textareaModo = document.getElementById('modo');
    if (textareaModo) {
        textareaModo.value = receita.modo_preparo || '';
    }

    // As restrições são detectadas automaticamente pelo backend
    // Não há necessidade de carregar restrições manualmente
    if (receita.restrictions && receita.restrictions.length > 0) {
        console.log('📋 Restrições detectadas automaticamente:', receita.restrictions.length);
    } else {
        console.log('ℹ️ Nenhuma restrição detectada na receita');
    }

    // Status
    const selectStatus = document.getElementById('status');
    if (selectStatus) {
        selectStatus.value = receita.status || 'rascunho';
    }

    // Imagem
    const previewImagem = document.getElementById('preview-imagem');
    const placeholderCamera = document.getElementById('placeholder-camera');
    if (receita.imagem_url) {
        const imagemUrl = resolveMediaUrl(receita.imagem_url);
        if (previewImagem) {
            previewImagem.src = imagemUrl;
            previewImagem.style.display = 'block';
            previewImagem.onerror = () => {
                previewImagem.style.display = 'none';
                if (placeholderCamera) placeholderCamera.style.display = 'block';
            };
        }
        if (placeholderCamera) placeholderCamera.style.display = 'none';
    }

    // Armazenar ID da receita para atualização
    window.receitaEditandoId = receita.id;
    console.log('💾 ID da receita armazenado para edição:', window.receitaEditandoId);
}

/**
 * Salva ou atualiza a receita
 */
async function salvarReceita() {
    console.log('💾 Função salvarReceita chamada');
    console.log('📋 receitaEditandoId:', window.receitaEditandoId);
    
    try {
        // Validar campos obrigatórios
        const nome = document.getElementById('nome')?.value.trim();
        const ingredientes = document.getElementById('ingredientes')?.value.trim();
        const modoPreparo = document.getElementById('modo')?.value.trim();

        console.log('📝 Campos do formulário:');
        console.log('  - Nome:', nome);
        console.log('  - Ingredientes:', ingredientes ? ingredientes.substring(0, 50) + '...' : 'vazio');
        console.log('  - Modo preparo:', modoPreparo ? modoPreparo.substring(0, 50) + '...' : 'vazio');

        if (!nome || nome.length < 3) {
            mostrarMensagemForm('O nome da receita é obrigatório e deve ter pelo menos 3 caracteres.', 'erro');
            return;
        }

        if (!ingredientes) {
            mostrarMensagemForm('Os ingredientes são obrigatórios.', 'erro');
            return;
        }

        if (!modoPreparo || modoPreparo.length < 10) {
            mostrarMensagemForm('O modo de preparo é obrigatório e deve ter pelo menos 10 caracteres.', 'erro');
            return;
        }

        // Verificar se apiService está disponível
        if (!window.apiService) {
            throw new Error('Serviço de API não disponível.');
        }
        
        console.log('✅ Validações passadas, preparando dados...');

        // Preparar dados
        const propriedades = document.getElementById('propriedades')?.value.trim() || '';
        const tempoPreparo = document.getElementById('tempo')?.value.trim() || '';
        const rendimento = document.getElementById('rendimento')?.value.trim() || '';
        const status = document.getElementById('status')?.value || 'rascunho';
        const inputFoto = document.getElementById('foto');
        const arquivoImagem = inputFoto?.files[0] || null;

        // Processar ingredientes (converter para array)
        const ingredientesArray = ingredientes
            .split(',')
            .map(i => i.trim())
            .filter(i => i);

        const receitaData = {
            titulo: nome,
            descricao: propriedades,
            ingredientes: ingredientesArray,
            modo_preparo: modoPreparo,
            tempo_preparo: tempoPreparo,
            rendimento: rendimento,
            status: status
            // Restrições serão detectadas automaticamente pelo backend
        };

        // Mostrar loading
        const btnSalvar = document.getElementById('btn-salvar');
        const textoOriginal = btnSalvar?.textContent;
        if (btnSalvar) {
            btnSalvar.disabled = true;
            btnSalvar.textContent = window.receitaEditandoId ? 'Atualizando...' : 'Salvando...';
        }

        let response;
        if (window.receitaEditandoId) {
            // Atualizar receita existente
            console.log(`🔄 Atualizando receita ID: ${window.receitaEditandoId}`);
            response = await window.apiService.updateRecipe(
                window.receitaEditandoId,
                receitaData,
                arquivoImagem
            );
        } else {
            // Criar nova receita
            console.log('➕ Criando nova receita...');
            response = await window.apiService.createRecipe(receitaData, arquivoImagem);
        }

        console.log('✅ Receita salva com sucesso:', response);

        // Mostrar mensagem de sucesso
        mostrarMensagemForm(
            window.receitaEditandoId 
                ? 'Receita atualizada com sucesso!' 
                : 'Receita criada com sucesso!',
            'sucesso'
        );

        // Redirecionar após 1.5 segundos
        setTimeout(() => {
            window.location.href = window.ROUTES?.appPage?.('publicacoes') || '/Index/publicacoes.html';
        }, 1500);

    } catch (error) {
        console.error('❌ Erro ao salvar receita:', error);
        
        // Restaurar botão
        const btnSalvar = document.getElementById('btn-salvar');
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.textContent = window.receitaEditandoId ? 'Atualizar Receita' : 'Salvar';
            console.log('✅ Botão restaurado após erro');
        } else {
            console.error('❌ Botão salvar não encontrado para restaurar!');
        }

        // Mostrar erro
        const mensagemErro = error.message || 'Erro ao salvar receita. Tente novamente.';
        console.error('❌ Mensagem de erro:', mensagemErro);
        mostrarMensagemForm(mensagemErro, 'erro');
    }
}

/**
 * Mostra mensagem no formulário
 */
function mostrarMensagemForm(mensagem, tipo) {
    const mensagemForm = document.getElementById('mensagem-form');
    if (!mensagemForm) return;

    mensagemForm.style.display = 'block';
    mensagemForm.textContent = mensagem;
    
    // Remover classes anteriores
    mensagemForm.classList.remove('mensagem-sucesso', 'mensagem-erro');
    
    // Adicionar classe apropriada
    if (tipo === 'sucesso') {
        mensagemForm.classList.add('mensagem-sucesso');
        mensagemForm.style.backgroundColor = '#d4edda';
        mensagemForm.style.color = '#155724';
        mensagemForm.style.border = '1px solid #c3e6cb';
    } else {
        mensagemForm.classList.add('mensagem-erro');
        mensagemForm.style.backgroundColor = '#f8d7da';
        mensagemForm.style.color = '#721c24';
        mensagemForm.style.border = '1px solid #f5c6cb';
    }

    // Scroll para mensagem
    mensagemForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

window.onSafeBiteReady(init);
