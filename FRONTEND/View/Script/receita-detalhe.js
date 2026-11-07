// Layout gerenciado por Script/components/layout.js

// --- Função para carregar receita da API ---
async function carregarReceita() {
    const urlParams = new URLSearchParams(window.location.search);
    const receitaId = urlParams.get('receita');
    
    if (!receitaId) {
        mostrarErro('ID da receita não fornecido.');
        return;
    }
    
    // Mostrar loading
    mostrarLoading();
    
    try {
        console.log('🔍 Iniciando carregamento da receita ID:', receitaId);
        
        // Verificar se apiService está disponível
        if (!window.apiService) {
            throw new Error('Serviço de API não disponível. Verifique se os scripts foram carregados corretamente.');
        }
        
        console.log('📡 Buscando receita na API...');
        // Buscar receita da API e restrições do usuário em paralelo
        const [response, userRestrictionsResponse] = await Promise.all([
            window.apiService.getRecipeById(receitaId),
            window.apiService.getUserRestrictions().catch(err => {
                console.warn('⚠️ Erro ao buscar restrições do usuário:', err);
                return { success: false, data: [] };
            })
        ]);
        
        console.log('✅ Resposta recebida da API:', response);
        
        // Verificar se a resposta é válida
        if (!response) {
            throw new Error('Resposta vazia da API.');
        }
        
        // A API retorna { success: true, data: {...} } ou diretamente { data: {...} }
        let receitaData = null;
        
        if (response.success !== undefined) {
            // Formato: { success: true, data: {...} }
            console.log('📦 Formato: { success, data }');
            if (!response.success) {
                throw new Error(response.message || 'Erro ao buscar receita na API.');
            }
            receitaData = response.data;
        } else if (response.data) {
            // Formato: { data: {...} }
            console.log('📦 Formato: { data }');
            receitaData = response.data;
        } else {
            // Pode ser que a resposta já seja os dados diretamente
            console.log('📦 Formato: dados diretos');
            receitaData = response;
        }
        
        console.log('📋 Dados da receita extraídos:', receitaData);
        
        if (!receitaData) {
            throw new Error('Dados da receita não encontrados na resposta da API.');
        }
        
        // Processar restrições do usuário
        let userRestrictionIds = new Set();
        if (userRestrictionsResponse && userRestrictionsResponse.success && userRestrictionsResponse.data) {
            userRestrictionsResponse.data.forEach(ur => {
                if (ur.restriction_id) {
                    userRestrictionIds.add(ur.restriction_id);
                }
            });
        }
        console.log('🔒 IDs das restrições do usuário:', Array.from(userRestrictionIds));
        
        // Remover loading
        removerLoading();
        
        // Mapear dados da API para o formato esperado
        console.log('🔄 Mapeando dados da receita...');
        const receita = mapearDadosReceita(receitaData, userRestrictionIds);
        console.log('✅ Receita mapeada:', receita);
        
        // Preencher a página com os dados
        console.log('🎨 Preenchendo página...');
        preencherReceita(receita);
        console.log('✅ Página preenchida com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao carregar receita:', error);
        console.error('Stack trace:', error.stack);
        removerLoading();
        mostrarErro(error.message || 'Erro ao carregar receita. Tente novamente mais tarde.');
    }
}

// --- Função para mapear dados da API para o formato esperado ---
function mapearDadosReceita(receitaData, userRestrictionIds = new Set()) {
    // Processar ingredientes (pode ser array ou string JSON)
    let ingredientes = [];
    if (Array.isArray(receitaData.ingredientes)) {
        ingredientes = receitaData.ingredientes;
    } else if (typeof receitaData.ingredientes === 'string') {
        try {
            ingredientes = JSON.parse(receitaData.ingredientes);
        } catch {
            const raw = receitaData.ingredientes.trim();
            // Tenta quebrar por linha primeiro; se só tiver uma linha, tenta ponto-e-vírgula, depois vírgula
            const porLinha = raw.split(/\r?\n/).map(i => i.trim().replace(/^[-•*]\s*/, '')).filter(i => i);
            if (porLinha.length > 1) {
                ingredientes = porLinha;
            } else {
                const porPvg = raw.split(';').map(i => i.trim()).filter(i => i);
                if (porPvg.length > 1) {
                    ingredientes = porPvg;
                } else {
                    ingredientes = raw.split(',').map(i => i.trim()).filter(i => i);
                }
            }
        }
    }
    
    // Processar modo de preparo (pode ser string ou array)
    let modoPreparo = [];
    if (Array.isArray(receitaData.modo_preparo)) {
        modoPreparo = receitaData.modo_preparo;
    } else if (typeof receitaData.modo_preparo === 'string') {
        const texto = receitaData.modo_preparo.trim();

        // 1. Quebra por linha (mais comum quando o backend já separa)
        const porLinha = texto.split(/\r?\n/).map(p => p.trim()).filter(p => p.length > 0);
        if (porLinha.length > 1) {
            // Remove numeração inicial tipo "1." ou "1)" de cada linha
            modoPreparo = porLinha.map(p => p.replace(/^\d+[.)\s]+/, '').trim());
        } else {
            // 2. Quebra por padrão "1. " "2. " no início de segmento
            const porNumero = texto.split(/(?=\b\d+\.\s)/).map(p => p.trim()).filter(p => p.length > 0);
            if (porNumero.length > 1) {
                modoPreparo = porNumero.map(p => p.replace(/^\d+\.\s*/, '').trim());
            } else {
                // 3. Última opção: texto inteiro como passo único
                modoPreparo = [texto];
            }
        }
    }
    
    // Processar propriedades (pode ser array, objeto ou string)
    let propriedades = [];
    if (receitaData.propriedades) {
        if (Array.isArray(receitaData.propriedades)) {
            propriedades = receitaData.propriedades;
        } else if (typeof receitaData.propriedades === 'string') {
            try {
                const parsed = JSON.parse(receitaData.propriedades);
                propriedades = Array.isArray(parsed) ? parsed : [receitaData.propriedades];
            } catch {
                propriedades = [receitaData.propriedades];
            }
        } else if (typeof receitaData.propriedades === 'object') {
            propriedades = Object.values(receitaData.propriedades);
        }
    }
    
    // Se não houver propriedades, usar descrição como fallback ou deixar vazio
    if (propriedades.length === 0 && receitaData.descricao) {
        propriedades = [receitaData.descricao];
    }
    
    // Processar restrições — exibir apenas as que o usuário possui
    let restricoes = [];
    const usuarioLogado = window.apiService && window.apiService.isAuthenticated();
    const usuarioTemAlgumaRestricao = userRestrictionIds.size > 0;

    if (receitaData.restrictions && Array.isArray(receitaData.restrictions) && receitaData.restrictions.length > 0) {

        // Filtrar apenas as restrições que o usuário cadastrou
        const restricoeDoUsuario = receitaData.restrictions.filter(r => {
            const restrictionId = r.restriction?.id || r.restriction_id || r.restricao_id;
            if (!restrictionId) return false;
            return Array.from(userRestrictionIds).some(uid => uid.toString() === restrictionId.toString());
        });

        if (!usuarioLogado) {
            // Usuário não autenticado: lista todas as restrições da receita sem filtro
            restricoes = receitaData.restrictions.map(r => {
                const nomeRestricao = r.restriction?.nome || r.restricao_nome || 'Restrição desconhecida';
                const ingrediente = r.ingrediente_restritivo || r.ingrediente || '';
                let palavrasChave = r.restriction?.palavras_chave || r.palavras_chave || [];
                if (!Array.isArray(palavrasChave)) palavrasChave = [];
                let texto = '<strong>' + nomeRestricao + '</strong>';
                if (ingrediente) texto += ': ' + ingrediente;
                if (palavrasChave.length > 0) {
                    texto += '<br><span style="font-size:0.85em;color:#888;margin-left:1rem;">Palavras-chave: ' + palavrasChave.join(', ') + '</span>';
                }
                return { texto, temAlerta: false };
            });

        } else if (!usuarioTemAlgumaRestricao) {
            // Usuário logado mas sem restrições cadastradas
            restricoes = [{
                texto: '✅ <strong>Você não possui restrições cadastradas.</strong><br><span style="font-size:0.9em;color:#555;">Acesse seu perfil para cadastrar suas restrições alimentares.</span>',
                temAlerta: false
            }];

        } else if (restricoeDoUsuario.length === 0) {
            // Usuário tem restrições mas nenhuma conflita com esta receita
            restricoes = [{
                texto: '✅ <strong>Esta receita é compatível com suas restrições!</strong><br><span style="font-size:0.9em;color:#2e7d32;">Nenhum ingrediente conflita com suas restrições alimentares.</span>',
                temAlerta: false
            }];

        } else {
            // Usuário tem restrições que conflitam — mostrar apenas essas
            restricoes = restricoeDoUsuario.map(r => {
                const nomeRestricao = r.restriction?.nome || r.restricao_nome || 'Restrição desconhecida';
                const ingrediente = r.ingrediente_restritivo || r.ingrediente || '';
                let palavrasChave = r.restriction?.palavras_chave || r.palavras_chave || [];
                if (!Array.isArray(palavrasChave)) palavrasChave = [];
                let texto = '<span class="icone-alerta-restricao" aria-label="Atenção">⚠️</span> ';
                texto += '<strong>' + nomeRestricao + '</strong>';
                if (ingrediente) texto += ': ' + ingrediente;
                if (palavrasChave.length > 0) {
                    texto += '<br><span style="font-size:0.85em;color:#888;margin-left:1rem;">Palavras-chave: ' + palavrasChave.join(', ') + '</span>';
                }
                return { texto, temAlerta: true };
            });
        }

    } else {
        // Receita sem nenhuma restrição detectada
        restricoes = [{
            texto: '✅ <strong>Nenhuma restrição alimentar identificada nesta receita.</strong>',
            temAlerta: false
        }];
    }

    let imagemUrl = '../Images/suco_detox.jpg';
    if (receitaData.imagem_url) {
        imagemUrl = resolveMediaUrl(receitaData.imagem_url);
    }
    
    return {
        titulo: receitaData.nome || receitaData.titulo || 'Receita sem título',
        imagem: imagemUrl,
        ingredientes: ingredientes,
        modoPreparo: modoPreparo,
        tempo: {
            preparo: receitaData.tempo_preparo || 'Não informado',
            rendimento: receitaData.rendimento || 'Não informado'
        },
        propriedades: propriedades.length > 0 ? propriedades : ['Propriedades não informadas.'],
        restricoes: restricoes
    };
}

// --- Função para mostrar loading ---
function mostrarLoading() {
    const conteudo = document.querySelector('.conteudo-receita');
    if (conteudo) {
        // Salvar o HTML original se ainda não foi salvo
        if (!conteudo.dataset.originalHtml) {
            conteudo.dataset.originalHtml = conteudo.innerHTML;
        }
        // Mostrar loading sem remover a estrutura
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-receita';
        loadingDiv.style.cssText = 'text-align: center; padding: 40px; color: #666; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);';
        loadingDiv.textContent = 'Carregando receita...';
        
        // Adicionar overlay
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.9); z-index: 999;';
        conteudo.style.position = 'relative';
        conteudo.appendChild(overlay);
        conteudo.appendChild(loadingDiv);
    }
}

// --- Função para remover loading ---
function removerLoading() {
    const loadingDiv = document.getElementById('loading-receita');
    const overlay = document.getElementById('loading-overlay');
    if (loadingDiv) loadingDiv.remove();
    if (overlay) overlay.remove();
}

// --- Função para mostrar erro ---
function mostrarErro(mensagem) {
    const conteudo = document.querySelector('.conteudo-receita');
    if (conteudo) {
        // Remover loading se existir
        removerLoading();
        
        // Criar div de erro
        const erroDiv = document.createElement('div');
        erroDiv.id = 'erro-receita';
        erroDiv.style.cssText = 'text-align: center; padding: 40px; color: #c33; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; width: 90%;';
        erroDiv.innerHTML = `
            <p><strong>Erro ao carregar receita</strong></p>
            <p style="font-size: 0.9em; margin-top: 10px;">${mensagem}</p>
            <div style="margin-top: 20px;">
                <button onclick="goBack()" style="margin-right: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Voltar
                </button>
                <button onclick="location.reload()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Tentar Novamente
                </button>
            </div>
        `;
        
        // Adicionar overlay
        const overlay = document.createElement('div');
        overlay.id = 'erro-overlay';
        overlay.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.95); z-index: 999;';
        conteudo.style.position = 'relative';
        conteudo.appendChild(overlay);
        conteudo.appendChild(erroDiv);
    }
}

function preencherReceita(receita) {
    // Preencher título
    const tituloEl = document.querySelector('.titulo-receita');
    if (tituloEl) tituloEl.textContent = receita.titulo;
    
    // Preencher imagem
    const imgEl = document.querySelector('.imagem-receita img');
    if (imgEl) {
        imgEl.src = receita.imagem;
        imgEl.alt = receita.titulo;
    }
    
    // Preencher ingredientes
    const ingredientesEl = document.querySelector('.bloco-ingredientes ul');
    if (ingredientesEl && receita.ingredientes) {
        ingredientesEl.innerHTML = receita.ingredientes.map(item => `<li>${item}</li>`).join('');
    }
    
    // Preencher modo de preparo
    const modoEl = document.querySelector('.bloco-modo-preparo ol');
    if (modoEl && receita.modoPreparo) {
        modoEl.innerHTML = receita.modoPreparo.map(item => `<li>${item}</li>`).join('');
    }
    
    // Preencher tempo
    const tempoEl = document.querySelector('.bloco-tempo');
    if (tempoEl && receita.tempo) {
        const tempoContent = tempoEl.querySelector('p');
        if (tempoContent) {
            tempoContent.innerHTML = `
                Preparo: ${receita.tempo.preparo}<br>
                Rendimento: ${receita.tempo.rendimento}
            `;
        } else {
            tempoEl.innerHTML = `
                <h2>Tempo Estimado:</h2>
                <p>Preparo: ${receita.tempo.preparo}<br>Rendimento: ${receita.tempo.rendimento}</p>
            `;
        }
    }
    
    // Preencher propriedades
    const propriedadesEl = document.querySelector('.bloco-propriedades');
    if (propriedadesEl && receita.propriedades) {
        const propContent = propriedadesEl.querySelector('ul');
        if (propContent) {
            propContent.innerHTML = receita.propriedades.map(item => `<li>${item}</li>`).join('');
        } else {
            propriedadesEl.innerHTML = `<h2>Propriedades:</h2><ul>${receita.propriedades.map(item => `<li>${item}</li>`).join('')}</ul>`;
        }
    }
    
    // Preencher restrições
    const restricoesEl = document.querySelector('.bloco-restricoes');
    if (restricoesEl && receita.restricoes) {
        const restContent = restricoesEl.querySelector('ul');
        // Processar restrições - pode ser array de strings ou array de objetos
        const restricoesHTML = receita.restricoes.map(item => {
            const texto = typeof item === 'string' ? item : item.texto;
            const temAlerta = typeof item === 'object' ? item.temAlerta : false;
            const classeAlerta = temAlerta ? ' restricao-com-alerta' : '';
            return `<li class="${classeAlerta}">${texto}</li>`;
        }).join('');
        
        if (restContent) {
            // Usar innerHTML para permitir formatação HTML (negrito, quebras de linha)
            restContent.innerHTML = restricoesHTML;
        } else {
            restricoesEl.innerHTML = `<h2>Restrições:</h2><ul>${restricoesHTML}</ul>`;
        }
    }
    
    // Atualizar título da página
    document.title = `Safe Bite - ${receita.titulo}`;
}

// --- Inicialização ---
function init() {
    window.SafeBiteLayout.customGoBack = function customGoBack() {
        if (history.length > 1) history.back();
        else window.location.href = window.ROUTES?.appPage?.('receitas') || '/Index/receitas.html';
    };

    setTimeout(() => {
        if (window.apiService) {
            carregarReceita();
        } else {
            console.error('apiService não disponível! Verifique se os scripts foram carregados corretamente.');
            mostrarErro('Serviço de API não disponível. Recarregue a página.');
        }
    }, 100);
}

window.onSafeBiteReady(init);