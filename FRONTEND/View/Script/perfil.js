// ==================== SELETORES PRINCIPAIS ====================
const body = document.body;

// Seletores específicos do perfil
const btnEditar = document.getElementById('btn-editar');
const btnSalvar = document.getElementById('btn-salvar');
const btnAdicionar = document.getElementById('btn-adicionar');
const btnSair = document.getElementById('btn-sair');
const popupSair = document.getElementById('popup-sair');
const formDadosUsuario = document.getElementById('dados-usuario');

// ==================== FUNÇÕES DO PERFIL ====================

// Ativar modo de edição
function ativarEdicao() {
    body.classList.add('modo-edicao');
    
    // Preencher input do nome com o valor atual do display
    const nomeDisplay = document.getElementById('nome-usuario');
    const nomeInput = document.getElementById('nome-usuario-input');
    if (nomeDisplay && nomeInput) {
        nomeInput.value = nomeDisplay.textContent;
    }
    
    // Tornar campos editáveis
    const campos = document.querySelectorAll('.campo-valor');
    campos.forEach(campo => {
        campo.removeAttribute('readonly');
    });

    // Mostrar inputs de email e senha
    document.getElementById('email-usu').removeAttribute('hidden');
    document.getElementById('senha-usu').removeAttribute('hidden');
}

// Salvar edições
async function salvarEdicao() {
    let valido = true;

    // Validação do nome (obrigatório)
    const nomeInput = document.getElementById('nome-usuario-input');
    let nomeValor = null;
    if (nomeInput) {
        const nomeTexto = nomeInput.value.trim();
        if (nomeTexto.length < 2) {
            nomeInput.classList.add('invalido');
            valido = false;
        } else {
            nomeInput.classList.remove('invalido');
            nomeValor = nomeTexto;
        }
    }

    // Validação do telefone
    const telefone = document.getElementById('telefone-usu');
    let telefoneValor = telefone.value;
    if (telefoneValor !== 'Não adicionado' && telefoneValor.trim() !== '') {
        // Remover formatação para validação
        const telefoneLimpo = telefoneValor.replace(/\D/g, '');
        if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
            telefone.classList.add('invalido');
            valido = false;
        } else {
            telefone.classList.remove('invalido');
            // Salvar apenas números
            telefoneValor = telefoneLimpo;
        }
    } else {
        telefone.classList.remove('invalido');
        telefoneValor = null;
    }

    // Validação da idade
    const idade = document.getElementById('idade-usu');
    let idadeValor = null;
    if (idade.value !== 'Não adicionado' && idade.value.trim() !== '') {
        const idadeTexto = idade.value.replace(/\D/g, ''); // Remove não-dígitos
        const idadeNum = parseInt(idadeTexto);
        if (isNaN(idadeNum) || idadeNum < 0 || idadeNum > 150) {
            idade.classList.add('invalido');
            valido = false;
        } else {
            idade.classList.remove('invalido');
            idadeValor = idadeNum;
        }
    } else {
        idade.classList.remove('invalido');
    }

    // Validação do email (não pode ser alterado, apenas exibido)
    const email = document.getElementById('email-usu');
    if (!email.hidden && email.value.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            email.classList.add('invalido');
            valido = false;
        } else {
            email.classList.remove('invalido');
        }
    }

    if (!valido) {
        alert('Por favor, corrija os campos inválidos antes de salvar.');
        return;
    }

    // Preparar dados para envio
    const dadosAtualizacao = {};
    if (nomeValor !== null) {
        dadosAtualizacao.nome_completo = nomeValor;
    }
    if (telefoneValor !== null) {
        dadosAtualizacao.telefone = telefoneValor;
    }
    if (idadeValor !== null) {
        dadosAtualizacao.idade = idadeValor;
    }

    try {
        console.log('💾 Salvando alterações do perfil...', dadosAtualizacao);

        if (!window.apiService) {
            throw new Error('Serviço de API não disponível');
        }

        // Atualizar perfil na API
        const response = await window.apiService.updateUserProfile(dadosAtualizacao);

        console.log('✅ Perfil atualizado:', response);

        if (!response || !response.success) {
            throw new Error(response?.message || 'Erro ao atualizar perfil');
        }

        // Atualizar display do email (não muda, apenas mostra)
        const emailInfo = document.getElementById('email-info');
        const emailValor = document.getElementById('email-usu').value;
        if (emailInfo) {
            emailInfo.innerHTML = `
                E-mail: ${emailValor}<br>
                Senha: **********<br>
                Verificação de email: Não verificado
            `;
        }

        // Atualizar valores na interface
        if (nomeValor) {
            const nomeDisplay = document.getElementById('nome-usuario');
            if (nomeDisplay) {
                nomeDisplay.textContent = nomeValor;
            }
            // Atualizar iniciais se não houver foto
            const perfilFotoContainer = document.querySelector('.perfil-foto');
            const iniciaisPerfil = document.getElementById('iniciais-perfil');
            if (perfilFotoContainer && !perfilFotoContainer.classList.contains('has-photo') && iniciaisPerfil) {
                const iniciais = extrairIniciais(nomeValor);
                iniciaisPerfil.textContent = iniciais;
            }
        }
        if (telefoneValor) {
            telefone.value = telefoneValor;
        }
        if (idadeValor) {
            idade.value = `${idadeValor} anos`;
        }

        // Desativar modo de edição
        body.classList.remove('modo-edicao');
        
        // Tornar campos não editáveis novamente
        const campos = document.querySelectorAll('.campo-valor');
        campos.forEach(campo => {
            campo.setAttribute('readonly', 'readonly');
        });

        // Ocultar inputs de email e senha
        document.getElementById('email-usu').setAttribute('hidden', 'hidden');
        document.getElementById('senha-usu').setAttribute('hidden', 'hidden');

        alert('Perfil atualizado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao salvar perfil:', error);
        alert('Erro ao atualizar perfil: ' + (error.message || 'Erro desconhecido'));
    }
}


// Editar restrições
async function editarRestricoes() {
    const restricoesValor = document.getElementById('restricoes-valor');
    const restricoesInput = document.getElementById('restricoes-usu');
    
    const novasRestricoes = prompt(
        'Digite as novas palavras-chave das restrições (separadas por vírgula):',
        restricoesInput.value || ''
    );
    
    if (novasRestricoes !== null && novasRestricoes.trim() !== '') {
        try {
            console.log('💾 Atualizando palavras-chave das restrições...');

            if (!window.apiService) {
                throw new Error('Serviço de API não disponível');
            }

            // Buscar restrições do usuário usando o método correto do apiService
            const response = await window.apiService.getUserRestrictions();

            const restricoes = (response && response.success && Array.isArray(response.data))
                ? response.data
                : [];

            if (restricoes.length > 0) {
                // Atualizar palavras-chave personalizadas da primeira restrição do usuário
                const primeiraRestricao = restricoes[0];
                const userRestrictionId = primeiraRestricao.id; // ID do UserRestriction, não da Restriction

                // Usar o método correto do apiService
                await window.apiService.updateRestriction(
                    userRestrictionId,
                    novasRestricoes.trim()
                );

                // Atualizar interface
                restricoesValor.textContent = novasRestricoes.trim();
                restricoesInput.value = novasRestricoes.trim();

                alert('Restrições atualizadas com sucesso!');
                
                // Recarregar restrições para atualizar a interface
                await carregarRestricoes();
            } else {
                // Se não houver restrições, apenas atualizar localmente
                restricoesValor.textContent = novasRestricoes.trim();
                restricoesInput.value = novasRestricoes.trim();
                alert('Nota: Nenhuma restrição cadastrada. As palavras-chave foram salvas localmente.');
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar restrições:', error);
            alert('Erro ao atualizar restrições: ' + (error.message || 'Erro desconhecido'));
        }
    }
}

// Abrir pop-up de confirmação de saída
function abrirPopupSair() {
    popupSair.classList.add('ativo');
}

// Fechar pop-up de saída
function fecharPopupSair() {
    popupSair.classList.remove('ativo');
}

// Confirmar saída da conta
async function confirmarSair() {
    try {
        console.log('🚪 Fazendo logout...');


        fecharPopupSair();

        if (window.apiService) {
            // Fazer logout na API
            try {
                await window.apiService.logout();
            } catch (error) {
                console.warn('Aviso: Erro ao fazer logout na API (continuando mesmo assim):', error);
            }
        }

        // Limpar todos os dados de autenticação do localStorage
        // Isso garante que mesmo se o logout da API falhar, os dados locais são limpos
        localStorage.removeItem(window.CONFIG?.STORAGE_KEYS?.TOKEN || 'safebite_token');
        localStorage.removeItem(window.CONFIG?.STORAGE_KEYS?.USER || 'safebite_user');
        
        // Remover token do apiService também
        if (window.apiService) {
            window.apiService.removeToken();
        }

        console.log('✅ Dados de autenticação limpos. Redirecionando...');

        // Fechar popup
        

        // Usar replace() em vez de href para evitar problemas com histórico e CORS
        // O replace() substitui a entrada atual no histórico, impedindo que o usuário volte para a página de perfil
        window.location.replace(window.ROUTES?.authPage?.('inicio') || '/Index/autenticacao/inicio.html');
        
    } catch (error) {
        localStorage.removeItem(window.CONFIG?.STORAGE_KEYS?.TOKEN || 'safebite_token');
        localStorage.removeItem(window.CONFIG?.STORAGE_KEYS?.USER || 'safebite_user');
        // Mesmo com erro, limpar dados locais e redirecionar
        if (window.apiService) {
            window.apiService.removeToken();
        }
        // Redirecionar mesmo com erro
        window.location.replace(window.ROUTES?.authPage?.('inicio') || '/Index/autenticacao/inicio.html');
    }
}

// Adicionar nova conta
function adicionarConta() {
    // Redirecionar para página de cadastro
    console.log('Redirecionar para adicionar nova conta');
    alert('Redirecionando para cadastro de nova conta...');
    // Descomente e ajuste o caminho quando tiver a página:
    // window.location.href = '../Paginas/cadastro.html';
}

// Abrir receita específica
function abrirReceita(receitaId) {
    if (receitaId) {
        window.location.href = `${window.ROUTES?.appPage?.('receitaDetalhe') || '/Index/receita-detalhe.html'}?receita=${receitaId}`;
    } else {
        // Fallback se não tiver ID
        window.location.href = 'receita-detalhe.html';
    }
}

// ==================== EFEITOS VISUAIS ====================
// Aplica listeners para adicionar/remover classes .hovered e .pressed
// attachInteractiveEffects está definida em utils.js (window.attachInteractiveEffects)

// ==================== INICIALIZAÇÃO ====================
function init() {
    attachInteractiveEffects(btnEditar);
    attachInteractiveEffects(btnSalvar);
    attachInteractiveEffects(btnAdicionar);
    attachInteractiveEffects(btnSair);
    
    // Attach ao botão de remover foto
    const btnRemoverFoto = document.getElementById('btn-remover-foto');
    if (btnRemoverFoto) {
        attachInteractiveEffects(btnRemoverFoto);
    }

    // Attach aos botões do popup
    const btnCancelar = document.querySelector('.btn-cancelar');
    const btnConfirmarSair = document.querySelector('.btn-confirmar-sair');
    attachInteractiveEffects(btnCancelar);
    attachInteractiveEffects(btnConfirmarSair);

    // Attach nos cards de receitas
    const receitaCards = document.querySelectorAll('.receita-card');
    receitaCards.forEach(card => attachInteractiveEffects(card));

    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && popupSair.classList.contains('ativo')) {
            fecharPopupSair();
        }
    });

    // Fechar popup ao clicar fora dele
    popupSair.addEventListener('click', function(e) {
        if (e.target === popupSair) {
            fecharPopupSair();
        }
    });

    body.classList.remove('modo-edicao');

    // Configurar upload de foto de perfil
    const fotoPerfilInput = document.getElementById('foto-perfil-input');
    const fotoPerfilContainer = document.querySelector('.perfil-foto');
    const fotoPerfilImg = document.getElementById('foto-perfil-img');
    const iniciaisPerfil = document.getElementById('iniciais-perfil');

    // Função para abrir seletor de arquivo
    function abrirSeletorFoto() {
        if (fotoPerfilInput) {
            fotoPerfilInput.click();
        }
    }

    // Clique apenas na foto ou iniciais para abrir seletor de arquivo
    if (fotoPerfilInput) {
        // Evento de clique na imagem
        if (fotoPerfilImg) {
            fotoPerfilImg.addEventListener('click', abrirSeletorFoto);
        }

        // Evento de clique nas iniciais
        if (iniciaisPerfil) {
            iniciaisPerfil.addEventListener('click', abrirSeletorFoto);
        }

        // Evento de mudança no input de arquivo
        fotoPerfilInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validar tipo de arquivo
                if (!file.type.startsWith('image/')) {
                    alert('Por favor, selecione um arquivo de imagem.');
                    fotoPerfilInput.value = ''; // Limpar seleção
                    return;
                }

                // Validar tamanho do arquivo (5MB máximo)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxSize) {
                    alert('A imagem deve ter no máximo 5MB.');
                    fotoPerfilInput.value = ''; // Limpar seleção
                    return;
                }

                // Fazer upload da foto
                await uploadFotoPerfil(file);
            }
        });
    }

    // Carregar dados do perfil - aguardar um pouco para garantir que apiService está disponível
    setTimeout(() => {
        if (window.apiService) {
            carregarPerfil();
        } else {
            console.error('apiService não disponível! Verifique se os scripts foram carregados corretamente.');
        }
    }, 100);
}

// ==================== UPLOAD DE FOTO DE PERFIL ====================

/**
 * Faz upload da foto de perfil
 * @param {File} file - Arquivo de imagem selecionado
 */
async function uploadFotoPerfil(file) {
    const fotoPerfilContainer = document.querySelector('.perfil-foto');
    const fotoPerfilImg = document.getElementById('foto-perfil-img');
    const iniciaisPerfil = document.getElementById('iniciais-perfil');
    const fotoPerfilInput = document.getElementById('foto-perfil-input');

    try {
        // Mostrar loading
        if (fotoPerfilContainer) {
            fotoPerfilContainer.style.opacity = '0.6';
            fotoPerfilContainer.style.pointerEvents = 'none';
            
            // Adicionar indicador de loading
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loading-foto';
            loadingIndicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px 20px;
                border-radius: 10px;
                font-size: 14px;
                z-index: 1000;
            `;
            loadingIndicator.textContent = 'Enviando foto...';
            fotoPerfilContainer.style.position = 'relative';
            fotoPerfilContainer.appendChild(loadingIndicator);
        }

        console.log('📤 Fazendo upload da foto de perfil...');

        if (!window.apiService) {
            throw new Error('Serviço de API não disponível');
        }

        // Fazer upload via API
        const response = await window.apiService.updateProfilePhoto(file);

        console.log('✅ Foto enviada:', response);

        if (!response || !response.success) {
            throw new Error(response?.message || 'Erro ao enviar foto');
        }

        // Obter URL da foto atualizada
        const photoUrl = response.data?.user?.foto_perfil || response.data?.foto_perfil;

        if (photoUrl) {
            // Atualizar imagem na interface
            if (fotoPerfilImg) {
                fotoPerfilImg.src = photoUrl;
                fotoPerfilImg.style.display = 'block';
                fotoPerfilImg.alt = 'Foto de perfil';
            }

            // Esconder iniciais e mostrar foto
            if (fotoPerfilContainer) {
                fotoPerfilContainer.classList.add('has-photo');
            }
            if (iniciaisPerfil) {
                iniciaisPerfil.style.display = 'none';
            }

            // Mostrar botão de remover foto
            const btnRemoverFoto = document.getElementById('btn-remover-foto');
            if (btnRemoverFoto) {
                btnRemoverFoto.style.display = 'block';
            }

            // Adicionar efeito de transição
            if (fotoPerfilImg) {
                fotoPerfilImg.style.opacity = '0';
                setTimeout(() => {
                    fotoPerfilImg.style.transition = 'opacity 0.3s ease';
                    fotoPerfilImg.style.opacity = '1';
                }, 50);
            }

            alert('Foto de perfil atualizada com sucesso!');
        }

    } catch (error) {
        console.error('❌ Erro ao fazer upload da foto:', error);
        alert('Erro ao enviar foto: ' + (error.message || 'Erro desconhecido'));
    } finally {
        // Remover loading
        if (fotoPerfilContainer) {
            fotoPerfilContainer.style.opacity = '1';
            fotoPerfilContainer.style.pointerEvents = 'auto';
            
            const loadingIndicator = document.getElementById('loading-foto');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }

        // Limpar seleção do input
        if (fotoPerfilInput) {
            fotoPerfilInput.value = '';
        }
    }
}

// ==================== CARREGAR DADOS DO PERFIL ====================

// Carregar perfil do usuário
async function carregarPerfil() {
    try {
        console.log('📡 Carregando perfil do usuário...');
        
        if (!window.apiService) {
            console.error('apiService não disponível');
            return;
        }

        // Verificar se usuário está autenticado
        if (!window.apiService.isAuthenticated()) {
            console.warn('Usuário não autenticado. Redirecionando para login...');
            // Redirecionar para login se não estiver autenticado
            // window.location.href = 'tela_1 - login.html';
            return;
        }

        // Buscar dados do perfil
        const response = await window.apiService.getCurrentUserProfile();
        
        console.log('✅ Resposta do perfil:', response);
        
        if (!response || !response.success) {
            throw new Error(response?.message || 'Erro ao carregar perfil');
        }

        const userData = response.data?.user || response.data;
        
        if (!userData) {
            throw new Error('Dados do usuário não encontrados');
        }

        // Preencher dados do usuário
        preencherDadosUsuario(userData);

        // Carregar restrições
        await carregarRestricoes();

        // Carregar receitas publicadas
        await carregarReceitas();

    } catch (error) {
        console.error('❌ Erro ao carregar perfil:', error);
        alert('Erro ao carregar perfil: ' + (error.message || 'Erro desconhecido'));
    }
}

// Preencher dados do usuário na interface
function preencherDadosUsuario(userData) {
    // Nome
    const nomeEl = document.getElementById('nome-usuario');
    const nomeInput = document.getElementById('nome-usuario-input');
    if (userData.nome_completo) {
        if (nomeEl) {
            nomeEl.textContent = userData.nome_completo;
        }
        if (nomeInput) {
            nomeInput.value = userData.nome_completo;
        }
    }

    // Telefone
    const telefoneEl = document.getElementById('telefone-usu');
    if (telefoneEl) {
        telefoneEl.value = userData.telefone || 'Não adicionado';
    }

    // Idade
    const idadeEl = document.getElementById('idade-usu');
    if (idadeEl) {
        if (userData.idade) {
            idadeEl.value = `${userData.idade} anos`;
        } else {
            idadeEl.value = 'Não adicionado';
        }
    }

    // Email
    const emailEl = document.getElementById('email-usu');
    const emailInfo = document.getElementById('email-info');
    if (emailEl && userData.email) {
        emailEl.value = userData.email;
    }
    if (emailInfo && userData.email) {
        const emailVerificado = userData.email_verificado ? 'Verificado' : 'Não verificado';
        emailInfo.innerHTML = `
            E-mail: ${userData.email}<br>
            Senha: **********<br>
            Verificação de email: ${emailVerificado}
        `;
    }

    // Foto de perfil ou iniciais
    const fotoPerfil = document.querySelector('.perfil-foto img');
    const iniciaisPerfil = document.getElementById('iniciais-perfil');
    const perfilFotoContainer = document.querySelector('.perfil-foto');
    
    const btnRemoverFoto = document.getElementById('btn-remover-foto');
    
    if (userData.foto_perfil) {
        // Se tem foto, mostrar foto e esconder iniciais
        if (fotoPerfil) {
            fotoPerfil.src = userData.foto_perfil;
            fotoPerfil.alt = `Foto de ${userData.nome_completo}`;
            fotoPerfil.style.display = 'block';
        }
        if (perfilFotoContainer) {
            perfilFotoContainer.classList.add('has-photo');
        }
        if (iniciaisPerfil) {
            iniciaisPerfil.style.display = 'none';
        }
        // Mostrar botão de remover foto
        if (btnRemoverFoto) {
            btnRemoverFoto.style.display = 'block';
        }
    } else {
        // Se não tem foto, mostrar iniciais
        if (perfilFotoContainer) {
            perfilFotoContainer.classList.remove('has-photo');
        }
        if (fotoPerfil) {
            fotoPerfil.style.display = 'none';
        }
        if (iniciaisPerfil) {
            iniciaisPerfil.style.display = 'flex';
            if (userData.nome_completo) {
                const iniciais = extrairIniciais(userData.nome_completo);
                iniciaisPerfil.textContent = iniciais;
            } else {
                iniciaisPerfil.textContent = 'U'; // Default
            }
        }
        // Esconder botão de remover foto
        if (btnRemoverFoto) {
            btnRemoverFoto.style.display = 'none';
        }
    }
}

// Nota: extrairIniciais está definida em utils.js e disponível via window.extrairIniciais

// Carregar restrições do usuário
async function carregarRestricoes() {
    try {
        console.log('📡 Carregando restrições do usuário...');
        
        // Usar método correto do apiService
        const response = await window.apiService.getUserRestrictions();

        console.log('✅ Resposta das restrições:', response);

        if (!response) {
            return;
        }

        // A API retorna { success: true, data: [...] }
        const restricoes = (response.success && Array.isArray(response.data))
            ? response.data
            : [];

        // Processar e exibir restrições
        if (restricoes.length > 0) {
            // Pegar nomes e palavras-chave das restrições da tabela restrictions
            let nomesRestricoes = [];
            let todasPalavrasChave = [];
            
            restricoes.forEach(r => {
                const restriction = r.restriction;
                if (restriction) {
                    // Adicionar nome da restrição
                    if (restriction.nome) {
                        nomesRestricoes.push(restriction.nome);
                    }
                    
                    // Adicionar palavras-chave da tabela restrictions (não personalizadas)
                    const palavras = restriction.palavras_chave || [];
                    if (Array.isArray(palavras) && palavras.length > 0) {
                        todasPalavrasChave.push(...palavras);
                    } else if (typeof palavras === 'string' && palavras.trim()) {
                        // Se for string, tentar parsear JSON ou separar por vírgula
                        try {
                            const parsed = JSON.parse(palavras);
                            if (Array.isArray(parsed)) {
                                todasPalavrasChave.push(...parsed);
                            } else {
                                todasPalavrasChave.push(palavras);
                            }
                        } catch {
                            todasPalavrasChave.push(...palavras.split(',').map(p => p.trim()).filter(p => p));
                        }
                    }
                }
            });

            // Remover duplicatas
            todasPalavrasChave = [...new Set(todasPalavrasChave.map(p => p.toLowerCase()))].map(p => 
                todasPalavrasChave.find(original => original.toLowerCase() === p)
            ).filter(Boolean);

            const palavrasChaveTexto = todasPalavrasChave.length > 0 
                ? todasPalavrasChave.join(', ') 
                : 'Nenhuma';
            
            const nomesRestricoesTexto = nomesRestricoes.length > 0
                ? nomesRestricoes.join(', ')
                : 'Nenhuma restrição';

            // Atualizar interface
            const restricoesTitulo = document.querySelector('.restricoes-titulo');
            const restricoesTexto = document.querySelector('.restricoes-texto');
            const restricoesValor = document.getElementById('restricoes-valor');
            const restricoesInput = document.getElementById('restricoes-usu');

            if (restricoesTexto) {
                restricoesTexto.innerHTML = `
                    ${nomesRestricoesTexto}:<br>
                    Palavras Chave: <span id="restricoes-valor">${palavrasChaveTexto}</span>
                `;
            }

            if (restricoesValor) {
                restricoesValor.textContent = palavrasChaveTexto || 'Nenhuma';
            }

            if (restricoesInput) {
                restricoesInput.value = palavrasChaveTexto || '';
            }
        } else {
            // Sem restrições
            const restricoesTexto = document.querySelector('.restricoes-texto');
            const restricoesValor = document.getElementById('restricoes-valor');
            if (restricoesTexto) {
                restricoesTexto.innerHTML = `
                    Nenhuma restrição cadastrada:<br>
                    Palavras Chave: <span id="restricoes-valor">Nenhuma</span>
                `;
            }
            if (restricoesValor) {
                restricoesValor.textContent = 'Nenhuma';
            }
        }

    } catch (error) {
        console.error('❌ Erro ao carregar restrições:', error);
        // Não bloquear a página se falhar ao carregar restrições
    }
}

// ==================== CARREGAR RECEITAS ====================
async function carregarReceitas() {
    try {
        console.log('📡 Carregando receitas publicadas...');
        
        if (!window.apiService) {
            console.error('apiService não disponível');
            return;
        }

        const response = await window.apiService.getUserPublishedRecipes();
        
        console.log('✅ Resposta das receitas:', response);

        if (!response || !response.success) {
            console.warn('Nenhuma receita publicada encontrada');
            return;
        }

        // A API retorna { success: true, data: [...] }
        const receitas = response.data || [];
        
        if (!Array.isArray(receitas)) {
            console.warn('Formato de receitas inválido');
            return;
        }

        // Renderizar receitas
        renderizarReceitas(receitas);

    } catch (error) {
        console.error('❌ Erro ao carregar receitas:', error);
        // Não bloquear a página se falhar ao carregar receitas
    }
}

// Renderizar receitas no grid
function renderizarReceitas(receitas) {
    const receitasGrid = document.getElementById('receitas-grid');
    
    if (!receitasGrid) {
        console.warn('Elemento receitas-grid não encontrado');
        return;
    }

    if (receitas.length === 0) {
        receitasGrid.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhuma receita publicada ainda.</p>';
        return;
    }

    const cardsHTML = receitas.map(receita => {
        // Construir URL da imagem
        let imagemUrl = '../Images/suco_detox.jpg'; // Imagem padrão
        if (receita.imagem_url) {
            imagemUrl = resolveMediaUrl(receita.imagem_url);
        }

        const titulo = receita.nome || receita.titulo || 'Receita sem título';

        return `
            <div class="receita-card" onclick="abrirReceita(${receita.id})">
                <div class="receita_imagem">
                    <img src="${imagemUrl}" alt="${titulo}" onerror="this.src='../Images/suco_detox.jpg'">
                </div>
                <div class="receita-titulo">${titulo}</div>
            </div>
        `;
    }).join('');

    receitasGrid.innerHTML = cardsHTML;

    // Adicionar efeitos visuais aos novos cards
    const receitaCards = receitasGrid.querySelectorAll('.receita-card');
    receitaCards.forEach(card => attachInteractiveEffects(card));
}

// ==================== REMOVER FOTO DE PERFIL ====================

/**
 * Remove a foto de perfil do usuário
 */
async function removerFotoPerfil() {
    const fotoPerfilContainer = document.querySelector('.perfil-foto');
    const fotoPerfilImg = document.getElementById('foto-perfil-img');
    const iniciaisPerfil = document.getElementById('iniciais-perfil');
    const btnRemoverFoto = document.getElementById('btn-remover-foto');
    const nomeUsuario = document.getElementById('nome-usuario')?.textContent || '';

    // Confirmar ação
    if (!confirm('Tem certeza que deseja remover sua foto de perfil?')) {
        return;
    }

    try {
        // Mostrar loading
        if (fotoPerfilContainer) {
            fotoPerfilContainer.style.opacity = '0.6';
            fotoPerfilContainer.style.pointerEvents = 'none';
        }

        console.log('🗑️ Removendo foto de perfil...');

        if (!window.apiService) {
            throw new Error('Serviço de API não disponível');
        }

        // Chamar API para remover foto
        const response = await window.apiService.removeProfilePhoto();

        console.log('✅ Foto removida:', response);

        if (!response || !response.success) {
            throw new Error(response?.message || 'Erro ao remover foto');
        }

        // Atualizar interface
        if (fotoPerfilImg) {
            fotoPerfilImg.style.display = 'none';
            fotoPerfilImg.src = '';
        }

        if (fotoPerfilContainer) {
            fotoPerfilContainer.classList.remove('has-photo');
        }

        // Mostrar iniciais
        if (iniciaisPerfil) {
            iniciaisPerfil.style.display = 'flex';
            if (nomeUsuario) {
                const iniciais = extrairIniciais(nomeUsuario);
                iniciaisPerfil.textContent = iniciais;
            } else {
                iniciaisPerfil.textContent = 'U';
            }
        }

        // Esconder botão de remover foto
        if (btnRemoverFoto) {
            btnRemoverFoto.style.display = 'none';
        }

        alert('Foto de perfil removida com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao remover foto:', error);
        alert('Erro ao remover foto: ' + (error.message || 'Erro desconhecido'));
    } finally {
        // Restaurar estado
        if (fotoPerfilContainer) {
            fotoPerfilContainer.style.opacity = '1';
            fotoPerfilContainer.style.pointerEvents = 'auto';
        }
    }
}

// ==================== EXPOR FUNÇÕES GLOBAIS ====================
window.ativarEdicao = ativarEdicao;
window.salvarEdicao = salvarEdicao;
window.editarRestricoes = editarRestricoes;
window.abrirPopupSair = abrirPopupSair;
window.fecharPopupSair = fecharPopupSair;
window.confirmarSair = confirmarSair;
window.adicionarConta = adicionarConta;
window.abrirReceita = abrirReceita;
window.removerFotoPerfil = removerFotoPerfil;

// ==================== INICIALIZAR AO CARREGAR ====================
window.onSafeBiteReady(init);