function abrirReceita(receitaId) {
    const base = window.ROUTES?.appPage?.('receitaDetalhe') || '/Index/receita-detalhe.html';
    window.location.href = `${base}?receita=${receitaId}`;
}

// --- Carregar receitas da API ---
async function carregarReceitas(termoBusca = '') {
    const gridReceitas = document.getElementById('grid-receitas');
    const tituloSecao = document.getElementById('titulo-secao');
    const resultadoBusca = document.getElementById('resultado-busca');
    const nenhumResultado = document.getElementById('nenhum-resultado');
    const termoBuscado = document.getElementById('termo-buscado');

    if (!gridReceitas) return;

    try {
        // Mostrar loading
        gridReceitas.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Carregando receitas...</div>';
        
        // Ocultar mensagens durante carregamento
        if (nenhumResultado) nenhumResultado.style.display = 'none';
        if (resultadoBusca) resultadoBusca.style.display = 'none';

        const filters = {
            status: 'publicada' // Apenas receitas publicadas (ativas)
        };

        // Adicionar busca apenas se houver termo
        if (termoBusca && termoBusca.trim()) {
            filters.search = termoBusca.trim();
        }

        console.log('Buscando receitas com filtros:', filters);

        const response = await window.apiService.listRecipes(filters);

        console.log('Resposta completa da API:', response);
        console.log('Tipo de response.data:', typeof response?.data);
        console.log('É array?', Array.isArray(response?.data));

        // A API retorna { success: true, data: [array de receitas] }
        // Não é response.data.recipes, é response.data diretamente
        let receitas = [];
        
        if (response && response.data) {
            // Verificar se data é um array ou se tem uma propriedade recipes
            if (Array.isArray(response.data)) {
                receitas = response.data;
            } else if (response.data.recipes && Array.isArray(response.data.recipes)) {
                receitas = response.data.recipes;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                receitas = response.data.data;
            }
        }
        
        console.log('Receitas extraídas:', receitas);
        console.log('Quantidade de receitas:', receitas.length);
        
        if (receitas.length > 0) {
            renderizarReceitas(receitas, termoBusca);
        } else {
            // Nenhuma receita encontrada - limpar grid e mostrar mensagem apropriada
            gridReceitas.innerHTML = '';
            
            if (termoBusca && termoBusca.trim()) {
                // Mostrar mensagem de busca sem resultados
                if (tituloSecao) tituloSecao.style.display = 'none';
                if (resultadoBusca) {
                    resultadoBusca.style.display = 'block';
                    if (termoBuscado) termoBuscado.textContent = termoBusca.trim() + '...';
                }
                if (nenhumResultado) nenhumResultado.style.display = 'flex';
            } else {
                // Sem busca, apenas não há receitas
                if (tituloSecao) tituloSecao.style.display = 'block';
                if (resultadoBusca) resultadoBusca.style.display = 'none';
                if (nenhumResultado) nenhumResultado.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar receitas:', error);
        gridReceitas.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #c33;">
                <p><strong>Erro ao carregar receitas.</strong></p>
                <p style="font-size: 0.9em; margin-top: 10px;">${error.message || 'Tente novamente mais tarde.'}</p>
                <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

// --- Renderizar receitas no grid ---
function renderizarReceitas(receitas, termoBusca = '') {
    const gridReceitas = document.getElementById('grid-receitas');
    const tituloSecao = document.getElementById('titulo-secao');
    const resultadoBusca = document.getElementById('resultado-busca');
    const nenhumResultado = document.getElementById('nenhum-resultado');
    const termoBuscado = document.getElementById('termo-buscado');

    if (!gridReceitas) return;

    if (receitas.length === 0) {
        // Não colocar mensagem aqui, deixar o elemento nenhum-resultado do HTML fazer isso
        gridReceitas.innerHTML = '';
        return;
    }

    // Atualizar UI baseado na busca
    if (termoBusca && termoBusca.trim()) {
        // Há busca ativa
        if (tituloSecao) tituloSecao.style.display = 'none';
        if (resultadoBusca) {
            resultadoBusca.style.display = 'block';
            if (termoBuscado) termoBuscado.textContent = termoBusca.trim() + '...';
        }
        if (nenhumResultado) nenhumResultado.style.display = 'none';
    } else {
        // Sem busca
        if (tituloSecao) tituloSecao.style.display = 'block';
        if (resultadoBusca) resultadoBusca.style.display = 'none';
        if (nenhumResultado) nenhumResultado.style.display = 'none';
    }

    // Renderizar cards de receitas
    console.log('Iniciando renderização de', receitas.length, 'receitas');
    
    const cardsHTML = receitas.map((receita, index) => {
        try {
            // Construir URL da imagem
            let imagemUrl = '../Images/suco_detox.jpg'; // Imagem padrão
            
            if (receita.imagem_url) {
                imagemUrl = resolveMediaUrl(receita.imagem_url);
            }

            // O backend pode retornar 'nome' ou 'titulo', verificar ambos
            const titulo = receita.titulo || receita.nome || 'Receita sem título';
            const descricao = receita.descricao || '';
            
            console.log(`Receita ${index + 1}:`, { 
                id: receita.id, 
                titulo, 
                temImagem: !!receita.imagem_url,
                imagemUrl 
            });
            
            return `
                <div class="card-receita" data-receita-id="${receita.id}">
                    <img src="${imagemUrl}" alt="${titulo}" onerror="this.src='../Images/suco_detox.jpg'">
                    <p class="nome-receita">${titulo}</p>
                    ${descricao ? `<p class="descricao-receita" style="font-size: 0.85em; color: #666; margin-top: 5px;">${descricao.substring(0, 60)}${descricao.length > 60 ? '...' : ''}</p>` : ''}
                </div>
            `;
        } catch (error) {
            console.error('Erro ao renderizar receita:', receita, error);
            return '';
        }
    }).filter(html => html !== '').join('');
    
    console.log('HTML gerado:', cardsHTML.substring(0, 200) + '...');
    console.log('Tamanho do HTML:', cardsHTML.length);
    
    gridReceitas.innerHTML = cardsHTML;

    // Adicionar event listeners aos novos cards
    const cardsReceita = document.querySelectorAll('.card-receita');
    cardsReceita.forEach((card) => {
        const receitaId = card.getAttribute('data-receita-id');
        if (receitaId) {
            card.addEventListener('click', () => abrirReceita(receitaId));
            card.style.cursor = 'pointer';
            
            // Adicionar efeitos visuais
            attachInteractiveEffects(card);
        }
    });

    console.log(`${receitas.length} receita(s) renderizada(s)`);
}

// --- Inicialização ---
function init() {
    setTimeout(() => {
        if (window.apiService) {
            console.log('Carregando receitas da API...');
            carregarReceitas();
        } else {
            console.error('apiService não disponível! Verifique se os scripts foram carregados corretamente.');
            const gridReceitas = document.getElementById('grid-receitas');
            if (gridReceitas) {
                gridReceitas.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #c33;">
                        <p><strong>Erro:</strong> Serviço de API não disponível.</p>
                        <p style="font-size: 0.9em; margin-top: 10px;">Recarregue a página.</p>
                    </div>
                `;
            }
        }
    }, 100);

    // --- Funcionalidade de busca ---
    const campoPesquisa = document.getElementById('campo-pesquisa');
    const gridReceitas = document.getElementById('grid-receitas');
    const nenhumResultado = document.getElementById('nenhum-resultado');
    const resultadoBusca = document.getElementById('resultado-busca');
    const termoBuscado = document.getElementById('termo-buscado');
    const tituloSecao = document.getElementById('titulo-secao');

    let timeoutBusca = null;

    function realizarBusca() {
        const termoPesquisa = campoPesquisa.value.trim();
        
        // Debounce - aguardar 500ms após parar de digitar
        clearTimeout(timeoutBusca);
        timeoutBusca = setTimeout(() => {
            if (window.apiService) {
                // Buscar na API
                console.log('Buscando receitas com termo:', termoPesquisa);
                carregarReceitas(termoPesquisa);
            } else {
                console.warn('apiService não disponível, usando busca local');
                // Fallback para busca local (se houver cards já renderizados)
                const cards = document.querySelectorAll('.card-receita');
                
                if (cards.length === 0) {
                    // Se não há cards, tentar carregar da API novamente
                    if (window.apiService) {
                        carregarReceitas(termoPesquisa);
                    }
                    return;
                }

                let encontrados = 0;
                const termoLower = termoPesquisa.toLowerCase();

                cards.forEach((card) => {
                    const nomeReceita = card.querySelector('.nome-receita')?.textContent.toLowerCase() || '';
                    
                    if (termoLower === '' || nomeReceita.includes(termoLower)) {
                        card.style.display = 'flex';
                        encontrados++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Mostrar/ocultar mensagens
                if (termoPesquisa === '') {
                    if (tituloSecao) tituloSecao.style.display = 'block';
                    if (resultadoBusca) resultadoBusca.style.display = 'none';
                    if (nenhumResultado) nenhumResultado.style.display = 'none';
                } else if (encontrados === 0) {
                    if (tituloSecao) tituloSecao.style.display = 'none';
                    if (resultadoBusca) {
                        resultadoBusca.style.display = 'block';
                        if (termoBuscado) termoBuscado.textContent = termoPesquisa + '...';
                    }
                    if (nenhumResultado) nenhumResultado.style.display = 'flex';
                } else {
                    if (tituloSecao) tituloSecao.style.display = 'none';
                    if (resultadoBusca) {
                        resultadoBusca.style.display = 'block';
                        if (termoBuscado) termoBuscado.textContent = termoPesquisa + '...';
                    }
                    if (nenhumResultado) nenhumResultado.style.display = 'none';
                }
            }
        }, 500);
    }

    // Event listener para busca em tempo real
    if (campoPesquisa) {
        campoPesquisa.addEventListener('input', realizarBusca);
        campoPesquisa.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                realizarBusca();
            }
        });
    }
}

window.abrirReceita = abrirReceita;
window.onSafeBiteReady(init);
