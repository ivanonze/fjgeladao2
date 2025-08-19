document.addEventListener('DOMContentLoaded', () => {
    // --- Variáveis Globais do Painel Admin ---
    let pedidos = [];
    let proximoIdPedido = 1;
    let produtosCadastrados = [];
    let proximoIdProduto = 1;
    let filtroDataAtivo = false;
    let dataInicioFiltro = null;
    let dataFimFiltro = null;

    // --- Elementos do DOM ---
    const adminLoginDiv = document.getElementById('admin-login');
    const adminPanelDiv = document.getElementById('admin-panel');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('btn-login');
    const logoutBtn = document.getElementById('btn-logout');

    // --- LÓGICA DE LOGIN ---
    const senhaAdmin = 'geladao2024'; // Senha do administrador

    function handleLogin() {
        if (passwordInput.value === senhaAdmin) {
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            showAdminPanel();
            passwordInput.value = '';
        } else {
            alert('Senha incorreta!');
            passwordInput.value = '';
        }
    }

    function handleLogout() {
        sessionStorage.removeItem('isAdminLoggedIn');
        showLoginForm();
    }

    function showAdminPanel() {
        adminLoginDiv.style.display = 'none';
        adminPanelDiv.style.display = 'block';
        initializeAdminPanel(); // Inicializa o restante do painel
    }

    function showLoginForm() {
        adminLoginDiv.style.display = 'block';
        adminPanelDiv.style.display = 'none';
    }

    // Adiciona Event Listeners para o Login
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }

    // Verifica se o admin já está logado na sessão
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        showAdminPanel();
    }

    // --- INICIALIZAÇÃO DO PAINEL ADMIN ---
    function initializeAdminPanel() {
        carregarPedidosDoStorage();
        carregarProdutosCadastrados();
        setupFiltrosPedidos();
        setupNovasFuncionalidades();
        atualizarEstatisticas();
        exibirPedidos();
        // Inicia a verificação de novos pedidos a cada 10 segundos
        setInterval(checkForNewOrders, 10000);
    }

    // Carrega pedidos do localStorage
    function carregarPedidosDoStorage() {
        const pedidosSalvos = localStorage.getItem('fjgeladao_pedidos');
        const proximoIdSalvo = localStorage.getItem('fjgeladao_proximo_id');
        if (pedidosSalvos) {
            pedidos = JSON.parse(pedidosSalvos);
        }
        if (proximoIdSalvo) {
            proximoIdPedido = parseInt(proximoIdSalvo);
        }
    }

    // Verifica se novos pedidos foram adicionados no localStorage
    function checkForNewOrders() {
        const pedidosSalvos = localStorage.getItem('fjgeladao_pedidos');
        if (pedidosSalvos) {
            const pedidosStorage = JSON.parse(pedidosSalvos);
            // Compara o número de pedidos no storage com o número de pedidos já carregados
            if (pedidosStorage.length > pedidos.length) {
                console.log('Novo pedido detectado!');
                
                // Toca o som de notificação
                const audio = document.getElementById('notification-sound');
                if (audio) {
                    audio.play().catch(error => {
                        console.error("Erro ao tocar notificação sonora (o navegador pode ter bloqueado o autoplay):", error);
                    });
                }

                alert('🚀 NOVO PEDIDO RECEBIDO! 🚀');

                // Recarrega os dados e atualiza a interface
                carregarPedidosDoStorage();
                atualizarEstatisticas();
                exibirPedidos();
            }
        }
    }

    // Salva pedidos no localStorage
    function salvarPedidosNoStorage() {
        localStorage.setItem('fjgeladao_pedidos', JSON.stringify(pedidos));
        localStorage.setItem('fjgeladao_proximo_id', proximoIdPedido.toString());
    }

    // Configura os filtros de status dos pedidos
    function setupFiltrosPedidos() {
        const filtrosPedidos = document.querySelectorAll('.filtro-pedido-btn');
        filtrosPedidos.forEach(filtro => {
            filtro.addEventListener('click', function() {
                filtrosPedidos.forEach(f => f.classList.remove('active'));
                this.classList.add('active');
                const status = this.getAttribute('data-status');
                filtrarPedidosPorStatus(status);
            });
        });
    }

    // Filtra os cards de pedido visíveis por status
    function filtrarPedidosPorStatus(status) {
        const pedidosCards = document.querySelectorAll('#pedidos-lista .pedido-card');
        pedidosCards.forEach(card => {
            const pedidoStatus = card.getAttribute('data-status');
            if (status === 'todos' || pedidoStatus === status) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Atualiza as estatísticas do painel
    function atualizarEstatisticas() {
        let pedidosFiltrados = pedidos;
        if (filtroDataAtivo && dataInicioFiltro && dataFimFiltro) {
            pedidosFiltrados = pedidos.filter(pedido => {
                const dataPedido = new Date(pedido.dataHora);
                return dataPedido >= dataInicioFiltro && dataPedido <= dataFimFiltro;
            });
        }

        const totalPedidos = pedidosFiltrados.length;
        const pedidosPendentes = pedidosFiltrados.filter(p => p.status === 'pendente').length;
        const pedidosConcluidos = pedidosFiltrados.filter(p => p.status === 'entregue').length;

        let faturamento;
        if (filtroDataAtivo) {
            faturamento = pedidosFiltrados
                .filter(p => p.status === 'entregue')
                .reduce((total, p) => total + p.total, 0);
        } else {
            const hoje = new Date().toDateString();
            faturamento = pedidos
                .filter(p => new Date(p.dataHora).toDateString() === hoje && p.status === 'entregue')
                .reduce((total, p) => total + p.total, 0);
        }

        document.getElementById('total-pedidos').textContent = totalPedidos;
        document.getElementById('pedidos-pendentes').textContent = pedidosPendentes;
        document.getElementById('pedidos-concluidos').textContent = pedidosConcluidos;
        document.getElementById('faturamento-hoje').textContent = `R$ ${faturamento.toFixed(2)}`;
    }

    // Exibe a lista de pedidos na tela
    function exibirPedidos() {
        let pedidosFiltrados = pedidos;
        if (filtroDataAtivo && dataInicioFiltro && dataFimFiltro) {
            pedidosFiltrados = pedidos.filter(pedido => {
                const dataPedido = new Date(pedido.dataHora);
                return dataPedido >= dataInicioFiltro && dataPedido <= dataFimFiltro;
            });
        }

        const listaPedidos = document.getElementById('pedidos-lista');
        if (pedidosFiltrados.length === 0) {
            listaPedidos.innerHTML = `
                <div class="pedido-vazio">
                    <i class="fas fa-inbox"></i>
                    <p>Nenhum pedido encontrado</p>
                </div>`;
            return;
        }

        const pedidosOrdenados = pedidosFiltrados.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
        listaPedidos.innerHTML = '';
        pedidosOrdenados.forEach(pedido => {
            const pedidoCard = criarCardPedido(pedido);
            listaPedidos.appendChild(pedidoCard);
        });

        // Reaplicar filtro de status visual
        const statusAtivo = document.querySelector('.filtro-pedido-btn.active').getAttribute('data-status');
        filtrarPedidosPorStatus(statusAtivo);
    }

    // Cria o HTML para um card de pedido
    function criarCardPedido(pedido) {
        const card = document.createElement('div');
        card.className = 'pedido-card';
        card.setAttribute('data-status', pedido.status);
        card.setAttribute('data-id', pedido.id);

        const statusClass = `status-${pedido.status}`;
        const statusText = {
            'pendente': 'Pendente',
            'preparando': 'Preparando',
            'pronto': 'Pronto',
            'entregue': 'Entregue',
            'cancelado': 'Cancelado'
        };

        card.innerHTML = `
            <div class="pedido-header">
                <input type="checkbox" class="pedido-checkbox" data-pedido-id="${pedido.id}" style="margin-right: 10px;">
                <span class="pedido-id">Pedido #${pedido.id}</span>
                <span class="pedido-status ${statusClass}">${statusText[pedido.status] || pedido.status}</span>
            </div>
            <div class="pedido-info">
                <div class="pedido-cliente">
                    <i class="fas fa-user"></i>
                    <span>${pedido.cliente || 'Cliente não informado'}</span>
                </div>
                <div class="pedido-total">
                    <i class="fas fa-dollar-sign"></i>
                    <span>R$ ${pedido.total.toFixed(2)}</span>
                </div>
            </div>
            <div class="pedido-itens">
                <h5>Itens do pedido:</h5>
                ${pedido.itens.map(item => `
                    <div class="item-pedido">
                        <span>${item.nome} (${item.quantidade}x)</span>
                        <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="pedido-actions">
                ${gerarBotoesAcao(pedido)}
            </div>
            <small style="color: #666; margin-top: 1rem; display: block;">
                ${new Date(pedido.dataHora).toLocaleString('pt-BR')}
            </small>`;

        // Adiciona event listeners para os botões de ação
        card.querySelector('.pedido-actions').addEventListener('click', (e) => {
            if (e.target.matches('.btn-action')) {
                const pedidoId = parseInt(card.getAttribute('data-id'));
                const novoStatus = e.target.getAttribute('data-status');
                alterarStatusPedido(pedidoId, novoStatus);
            } else if (e.target.closest('.btn-editar')) {
                // Adicionado para o botão de editar
                const pedidoId = parseInt(card.getAttribute('data-id'));
                abrirModalEdicaoPedido(pedidoId);
            }
        });

        return card;
    }

    // Gera os botões de ação para o card de pedido
    function gerarBotoesAcao(pedido) {
        let botoes = '';
        switch (pedido.status) {
            case 'pendente':
                botoes = `
                    <button class="btn-action btn-preparar" data-status="preparando">Iniciar Preparo</button>
                    <button class="btn-action btn-cancelar" data-status="cancelado">Cancelar</button>`;
                break;
            case 'preparando':
                botoes = `
                    <button class="btn-action btn-pronto" data-status="pronto">Marcar como Pronto</button>
                    <button class="btn-action btn-cancelar" data-status="cancelado">Cancelar</button>`;
                break;
            case 'pronto':
                botoes = `<button class="btn-action btn-entregar" data-status="entregue">Marcar como Entregue</button>`;
                break;
            case 'entregue':
                botoes = '<span style="color: #28a745; font-weight: bold;">✓ Pedido Concluído</span>';
                break;
            default:
                 botoes = `<span style="color: #dc3545; font-weight: bold;">Pedido ${pedido.status}</span>`;
                 break;
        }
        // Adiciona botão de editar se o pedido não estiver concluído ou cancelado
        if (pedido.status !== 'entregue' && pedido.status !== 'cancelado') {
            botoes += `<button class="btn-editar btn-secondary" title="Editar Pedido"><i class="fas fa-edit"></i></button>`;
        }

        return botoes;
    }

    // Altera o status de um pedido
    function alterarStatusPedido(pedidoId, novoStatus) {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (pedido) {
            pedido.status = novoStatus;
            salvarPedidosNoStorage();
            atualizarEstatisticas();
            exibirPedidos(); // Re-renderiza a lista para atualizar botões e status
            alert(`Pedido #${pedidoId} atualizado para ${novoStatus}!`);
        }
    }

    // --- NOVAS FUNCIONALIDADES ADMINISTRATIVAS ---
    function setupNovasFuncionalidades() {
        setupFiltrosData();
        setupGerenciamentoProdutos();
        setupExportacaoCSV();

        const btnAdicionarPedido = document.getElementById('btn-zerar-pedido');
        if (btnAdicionarPedido) {
            btnAdicionarPedido.addEventListener('click', () => {
                populateProductDatalist(); // Carrega sugestões de produtos
                resetarModalAdicionarPedido(); // Reseta o modal para o estado inicial
                document.getElementById('modal-adicionar-pedido').style.display = 'block';
            });
        }

        const closeModalAdicionar = document.getElementById('close-modal-adicionar-pedido');
        if (closeModalAdicionar) {
            closeModalAdicionar.addEventListener('click', () => {
                document.getElementById('modal-adicionar-pedido').style.display = 'none';
            });
        }

        const formAdicionarPedido = document.getElementById('form-adicionar-pedido');
        if (formAdicionarPedido) {
            formAdicionarPedido.addEventListener('submit', salvarPedidoManual);
        }

        // Listeners para adicionar/remover itens no pedido manual
        const btnAdicionarItem = document.getElementById('btn-adicionar-item-manual');
        if (btnAdicionarItem) btnAdicionarItem.addEventListener('click', adicionarLinhaItemManual);

        const itensContainer = document.getElementById('itens-pedido-manual');
        if (itensContainer) {
            // Listener para interações dentro do container de itens manuais
            itensContainer.addEventListener('input', (e) => {
                if (e.target.classList.contains('pedido-produto-manual')) {
                    const input = e.target;
                    const itemGroup = input.closest('.item-manual-group');
                    const datalist = document.getElementById('produtos-sugestoes');
                    const fardoBtn = itemGroup.querySelector('.btn-usar-fardo');
                    const priceInput = itemGroup.querySelector('.pedido-valor-manual');
                    const qtdInput = itemGroup.querySelector('.pedido-qtd-manual');

                    // Remove (Fardo) suffix on new input to allow re-matching
                    input.value = input.value.replace(/ \(Fardo\)$/, '');

                    if (!datalist || !fardoBtn) return;

                    const matchedOption = Array.from(datalist.options).find(opt => opt.value === input.value);

                    fardoBtn.style.display = 'none'; // Hide by default

                    if (matchedOption) {
                        priceInput.value = matchedOption.dataset.price ? parseFloat(matchedOption.dataset.price).toFixed(2) : '';
                        qtdInput.value = 1;

                        if (matchedOption.dataset.fardoPreco && matchedOption.dataset.fardoQtd) {
                            fardoBtn.style.display = 'inline-block';
                            fardoBtn.title = `Usar preço de fardo: ${matchedOption.dataset.fardoQtd} unidades por R$ ${parseFloat(matchedOption.dataset.fardoPreco).toFixed(2)}`;
                        }
                    } else {
                        priceInput.value = ''; // Clear price if no match
                    }
                }
                // Atualiza o total do pedido sempre que um campo for alterado
                updateManualOrderTotal();
            });

            // Listener para cliques (remover item ou usar fardo)
            itensContainer.addEventListener('click', (e) => {
                const fardoBtn = e.target.closest('.btn-usar-fardo');
                const removerBtn = e.target.closest('.btn-remover-item-manual');

                if (fardoBtn) {
                    const itemGroup = fardoBtn.closest('.item-manual-group');
                    const produtoInput = itemGroup.querySelector('.pedido-produto-manual');
                    const datalist = document.getElementById('produtos-sugestoes');
                    const cleanProductName = produtoInput.value.replace(/ \(Fardo\)$/, '');
                    const matchedOption = Array.from(datalist.options).find(opt => opt.value === cleanProductName);

                    if (matchedOption && matchedOption.dataset.fardoPreco) {
                        const priceInput = itemGroup.querySelector('.pedido-valor-manual');
                        const qtdInput = itemGroup.querySelector('.pedido-qtd-manual');
                        priceInput.value = parseFloat(matchedOption.dataset.fardoPreco).toFixed(2);
                        qtdInput.value = 1;
                        if (!produtoInput.value.includes(' (Fardo)')) {
                            produtoInput.value += ' (Fardo)';
                        }
                        updateManualOrderTotal();
                    }
                } else if (removerBtn) {
                    removerLinhaItemManual(removerBtn);
                }
            });
        }

        const btnLimparPedidos = document.getElementById('btn-limpar-pedidos');
        if (btnLimparPedidos) {
            btnLimparPedidos.addEventListener('click', limparPedidosSelecionados);
        }

        const checkboxMarcarTodos = document.getElementById('checkbox-marcar-todos');
        if (checkboxMarcarTodos) {
            checkboxMarcarTodos.addEventListener('change', function() {
                const checkboxes = document.querySelectorAll('.pedido-checkbox');
                checkboxes.forEach(cb => cb.checked = this.checked);
            });
        }
    }

    // --- Funções para o Modal de Adicionar Pedido Manual ---
    function adicionarLinhaItemManual(nome = '', preco = '', quantidade = 1) {
        const container = document.getElementById('itens-pedido-manual');
        const novaLinha = document.createElement('div');
        novaLinha.className = 'item-manual-group';
        novaLinha.style.cssText = 'display: flex; align-items: flex-end; gap: 10px; margin-bottom: 10px;';
        novaLinha.innerHTML = `
            <div class="form-group" style="flex-grow: 1; margin-bottom: 0;">
                <label>Produto:</label>
                <input type="text" class="pedido-produto-manual" value="${nome}" list="produtos-sugestoes">
            </div>
            <div class="form-group" style="width: 80px; margin-bottom: 0;">
                <label>Qtd:</label>
                <input type="number" class="pedido-qtd-manual" min="1" value="${quantidade}">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>Valor (R$):</label>
            <input type="number" class="pedido-valor-manual" step="0.01" min="0" value="${preco ? parseFloat(preco).toFixed(2) : ''}" />
        </div>
        <div class="fardo-button-container" style="align-self: flex-end; margin-bottom: 0;">
             <button type="button" class="btn-usar-fardo" title="Aplicar preço de fardo" style="display: none; height: 40px; background-color: #ffb142; color: white; border: none; border-radius: 5px; cursor: pointer; padding: 0 10px;"><i class="fas fa-box-open"></i></button>
            </div>
            <button type="button" class="btn-remover-item-manual" style="height: 40px; width: 40px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; display: none; font-size: 1.2rem;">&times;</button>
        `;
        container.appendChild(novaLinha);
        atualizarBotoesRemover();
        updateManualOrderTotal(); // Atualiza o total ao adicionar nova linha
    }

    function removerLinhaItemManual(botaoRemover) {
        const container = document.getElementById('itens-pedido-manual');
        // Só remove se houver mais de uma linha
        if (container.children.length > 1) {
            botaoRemover.closest('.item-manual-group').remove();
            atualizarBotoesRemover();
            updateManualOrderTotal(); // Atualiza o total ao remover linha
        }
    }

    function atualizarBotoesRemover() {
        const container = document.getElementById('itens-pedido-manual');
        const linhas = container.querySelectorAll('.item-manual-group');
        linhas.forEach((linha) => {
            const btnRemover = linha.querySelector('.btn-remover-item-manual');
            // Mostra o botão de remover se houver mais de uma linha
            btnRemover.style.display = linhas.length > 1 ? 'inline-block' : 'none';
        });
    }

    function resetarModalAdicionarPedido() {
        const form = document.getElementById('form-adicionar-pedido');
        if (form) form.reset();

        // Reseta o ID de edição, título e botão
        document.getElementById('pedido-edit-id').value = '';
        const modal = document.getElementById('modal-adicionar-pedido');
        modal.querySelector('.modal-header h3').textContent = 'Adicionar Pedido';
        form.querySelector('button[type="submit"]').textContent = 'Adicionar Pedido';

        const container = document.getElementById('itens-pedido-manual');
        container.innerHTML = ''; // Limpa todas as linhas
        adicionarLinhaItemManual(); // Adiciona uma linha nova e vazia
        updateManualOrderTotal(); // Reseta o total para R$ 0,00
    }

    function abrirModalEdicaoPedido(pedidoId) {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido) {
            alert('Pedido não encontrado!');
            return;
        }

        // Reseta o modal para um estado limpo
        populateProductDatalist();
        resetarModalAdicionarPedido();

        const modal = document.getElementById('modal-adicionar-pedido');
        const modalTitle = modal.querySelector('.modal-header h3');
        const form = document.getElementById('form-adicionar-pedido');
        const submitButton = form.querySelector('button[type="submit"]');

        // Configura o modal para o modo de edição
        modalTitle.textContent = `Editar Pedido #${pedido.id}`;
        submitButton.textContent = 'Salvar Alterações';
        document.getElementById('pedido-edit-id').value = pedido.id;

        // Preenche os campos com os dados do pedido
        document.getElementById('pedido-cliente').value = pedido.cliente || '';

        const itensContainer = document.getElementById('itens-pedido-manual');
        itensContainer.innerHTML = ''; // Limpa a linha vazia padrão

        if (pedido.itens.length > 0) {
            pedido.itens.forEach(item => {
                adicionarLinhaItemManual(item.nome, item.preco, item.quantidade);
            });
        } else {
            // Adiciona uma linha em branco se o pedido não tiver itens
            adicionarLinhaItemManual();
        }

        modal.style.display = 'block';
    }

    function salvarPedidoManual(event) {
        event.preventDefault();

        const editId = parseInt(document.getElementById('pedido-edit-id').value);
        const clienteNome = document.getElementById('pedido-cliente').value.trim();
        const itemGroups = document.querySelectorAll('#itens-pedido-manual .item-manual-group');

        const itens = [];
        let totalPedido = 0;
        let formValido = true;

        itemGroups.forEach(group => {
            const produtoInput = group.querySelector('.pedido-produto-manual');
            const valorInput = group.querySelector('.pedido-valor-manual');
            const qtdInput = group.querySelector('.pedido-qtd-manual');

            const produto = produtoInput.value.trim();
            const valor = parseFloat(valorInput.value);
            const quantidade = parseInt(qtdInput.value);

            // A linha só é processada se o produto tiver um nome
            if (produto) {
                if (!isNaN(valor) && valor >= 0 && !isNaN(quantidade) && quantidade > 0) {
                    itens.push({ nome: produto, preco: valor, quantidade: quantidade });
                    totalPedido += (valor * quantidade);
                } else {
                    // Se o produto tem nome, mas outros campos são inválidos, o formulário é inválido
                    formValido = false;
                }
            }
        });

        if (!formValido || itens.length === 0) {
            alert('Por favor, preencha ao menos um item com produto, quantidade e valor válidos. Linhas com nome de produto devem ter todos os campos preenchidos corretamente.');
            return;
        }

        if (editId) {
            // --- MODO DE EDIÇÃO ---
            const pedidoIndex = pedidos.findIndex(p => p.id === editId);
            if (pedidoIndex > -1) {
                pedidos[pedidoIndex].cliente = clienteNome || 'Venda Balcão';
                pedidos[pedidoIndex].itens = itens;
                pedidos[pedidoIndex].total = totalPedido;
                alert(`Pedido #${editId} atualizado com sucesso!`);
            } else {
                alert('Erro: Pedido para edição não encontrado.');
                return;
            }
        } else {
            // --- MODO DE CRIAÇÃO ---
            const novoPedido = {
                id: proximoIdPedido++,
                dataHora: new Date().toISOString(),
                status: 'pendente', // Pedidos manuais agora iniciam como pendentes
                cliente: clienteNome || 'Venda Balcão',
                itens: itens,
                total: totalPedido,
                tipoEntrega: 'retirada',
                formaPagamento: 'Não especificado'
            };
            pedidos.push(novoPedido);
            alert('Pedido adicionado com sucesso!');
        }

        salvarPedidosNoStorage();
        atualizarEstatisticas();
        exibirPedidos();
        document.getElementById('modal-adicionar-pedido').style.display = 'none';
    }

    // Calcula e atualiza o valor total do pedido manual em tempo real
    function updateManualOrderTotal() {
        const itemGroups = document.querySelectorAll('#itens-pedido-manual .item-manual-group');
        let totalPedido = 0;

        itemGroups.forEach(group => {
            const valorInput = group.querySelector('.pedido-valor-manual');
            const qtdInput = group.querySelector('.pedido-qtd-manual');

            const valor = parseFloat(valorInput.value) || 0;
            const quantidade = parseInt(qtdInput.value) || 0;

            totalPedido += valor * quantidade;
        });

        const totalElement = document.getElementById('manual-order-total-value');
        if (totalElement) totalElement.textContent = `R$ ${totalPedido.toFixed(2)}`;
    }

    // Popula o datalist com sugestões de produtos
    function populateProductDatalist() {
        const datalist = document.getElementById('produtos-sugestoes');
        if (!datalist) return;

        const todosProdutos = obterTodosProdutos();
        datalist.innerHTML = ''; // Limpa opções antigas

        const productNames = new Set(); // Evita duplicados
        todosProdutos.forEach(produto => {
            if (!productNames.has(produto.nome)) {
                const option = document.createElement('option');
                option.value = produto.nome;
                option.dataset.price = produto.preco;
                // Adiciona dados do fardo se existirem
                if (produto.fardoPreco && produto.fardoQtd) {
                    option.dataset.fardoPreco = produto.fardoPreco;
                    option.dataset.fardoQtd = produto.fardoQtd;
                }
                datalist.appendChild(option);
                productNames.add(produto.nome);
            }
        });
    }

    function limparPedidosSelecionados() {
        const checkboxes = document.querySelectorAll('.pedido-checkbox:checked');
        if (checkboxes.length === 0) {
            alert('Nenhum pedido selecionado para limpar.');
            return;
        }

        if (!confirm(`Tem certeza que deseja limpar os ${checkboxes.length} pedidos selecionados? Esta ação não pode ser desfeita.`)) {
            return;
        }

        const idsParaRemover = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-pedido-id')));
        pedidos = pedidos.filter(pedido => !idsParaRemover.includes(pedido.id));
        salvarPedidosNoStorage();
        atualizarEstatisticas();
        exibirPedidos();
        alert(`${idsParaRemover.length} pedidos selecionados foram limpos com sucesso!`);
    }

    // --- FILTROS DE DATA ---
    function setupFiltrosData() {
        const btnFiltrarData = document.getElementById('btn-filtrar-data');
        if (btnFiltrarData) btnFiltrarData.addEventListener('click', aplicarFiltroData);

        const btnLimparFiltro = document.getElementById('btn-limpar-filtro');
        if (btnLimparFiltro) btnLimparFiltro.addEventListener('click', limparFiltroData);

        const quickFilters = document.querySelectorAll('.quick-filter-btn');
        quickFilters.forEach(btn => {
            btn.addEventListener('click', function() {
                aplicarFiltroRapido(this.getAttribute('data-period'));
            });
        });
    }

    function aplicarFiltroData() {
        const dataInicio = document.getElementById('data-inicio').value;
        const dataFim = document.getElementById('data-fim').value;

        if (!dataInicio || !dataFim) {
            alert('Por favor, selecione as datas de início e fim!');
            return;
        }
        if (new Date(dataInicio) > new Date(dataFim)) {
            alert('A data de início deve ser anterior à data fim!');
            return;
        }

        filtroDataAtivo = true;
        dataInicioFiltro = new Date(dataInicio);
        dataFimFiltro = new Date(dataFim);
        dataFimFiltro.setHours(23, 59, 59, 999);

        exibirPedidos();
        atualizarEstatisticas();
        alert('Filtro de data aplicado!');
    }

    function limparFiltroData() {
        filtroDataAtivo = false;
        dataInicioFiltro = null;
        dataFimFiltro = null;

        document.getElementById('data-inicio').value = '';
        document.getElementById('data-fim').value = '';

        document.querySelectorAll('.quick-filter-btn').forEach(btn => btn.classList.remove('active'));

        exibirPedidos();
        atualizarEstatisticas();
        alert('Filtro de data removido!');
    }

    function aplicarFiltroRapido(period) {
        const hoje = new Date();
        let dataInicio, dataFim;

        document.querySelectorAll('.quick-filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.quick-filter-btn[data-period="${period}"]`).classList.add('active');

        switch (period) {
            case 'hoje':
                dataInicio = new Date(hoje);
                dataFim = new Date(hoje);
                break;
            case 'semana':
                dataInicio = new Date(hoje);
                dataInicio.setDate(hoje.getDate() - hoje.getDay());
                dataFim = new Date(dataInicio);
                dataFim.setDate(dataInicio.getDate() + 6);
                break;
            case 'mes':
                dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                break;
        }

        document.getElementById('data-inicio').value = dataInicio.toISOString().split('T')[0];
        document.getElementById('data-fim').value = dataFim.toISOString().split('T')[0];
        aplicarFiltroData();
    }

    // --- GERENCIAMENTO DE PRODUTOS ---
    function setupGerenciamentoProdutos() {
        const btnGerenciarProdutos = document.getElementById('btn-gerenciar-produtos');
        if (btnGerenciarProdutos) btnGerenciarProdutos.addEventListener('click', abrirModalProdutos);

        setupModalProdutos();

        const formAdicionar = document.getElementById('form-adicionar-produto');
        if (formAdicionar) formAdicionar.addEventListener('submit', adicionarProduto);

        const searchInput = document.getElementById('search-produto');
        if (searchInput) searchInput.addEventListener('input', buscarProdutos);
    }

    function setupModalProdutos() {
        const modal = document.getElementById('produtos-modal');
        const closeBtn = document.getElementById('close-produtos-modal');

        if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (event) => {
            if (event.target === modal) modal.style.display = 'none';
        });

        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                switchTab(this.getAttribute('data-tab'));
            });
        });
    }

    function switchTab(activeTab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector(`[data-tab="${activeTab}"]`).classList.add('active');
        document.getElementById(`tab-${activeTab}`).classList.add('active');

        if (activeTab === 'editar') {
            carregarListaProdutosEdit();
        }
    }

    function abrirModalProdutos() {
        document.getElementById('produtos-modal').style.display = 'block';
        carregarListaProdutosEdit();
    }

    function adicionarProduto(event) {
        event.preventDefault();
        const nome = document.getElementById('produto-nome').value.trim();
        const preco = parseFloat(document.getElementById('produto-preco').value);
        const categoria = document.getElementById('produto-categoria').value;
        const imagem = document.getElementById('produto-imagem').value.trim();

        if (!nome || !preco || !categoria) {
            alert('Por favor, preencha todos os campos obrigatórios!');
            return;
        }

        const novoProduto = {
            id: `dyn-${proximoIdProduto++}`,
            nome: nome,
            preco: preco,
            categoria: categoria,
            imagem: imagem || null,
            ativo: true
        };

        produtosCadastrados.push(novoProduto);
        salvarProdutosCadastrados();
        alert('Produto adicionado com sucesso! Ele aparecerá na página principal após recarregar.');
        document.getElementById('form-adicionar-produto').reset();
    }

    function carregarListaProdutosEdit() {
        const lista = document.getElementById('lista-produtos-edit');
        const todosProdutos = obterTodosProdutos();
        lista.innerHTML = '';

        todosProdutos.forEach(produto => {
            const item = document.createElement('div');
            item.className = 'produto-edit-item';
            item.innerHTML = `
                <div class="produto-edit-info">
                    <h5>${produto.nome}</h5>
                    <small>${produto.categoria}</small>
                </div>
                <div class="produto-edit-preco">
                    <input type="number" step="0.01" min="0" value="${produto.preco.toFixed(2)}" data-produto-id="${produto.id}">
                    <button class="btn-save-preco"><i class="fas fa-save"></i></button>
                    <button class="btn-delete-produto"><i class="fas fa-trash"></i></button>
                </div>`;

            item.querySelector('.btn-save-preco').addEventListener('click', () => {
                const novoPreco = parseFloat(item.querySelector('input').value);
                salvarPreco(produto.id, novoPreco);
            });
            item.querySelector('.btn-delete-produto').addEventListener('click', () => {
                excluirProduto(produto.id);
            });

            lista.appendChild(item);
        });
    }

    function obterTodosProdutos() {
        // 1. Produtos cadastrados dinamicamente (do localStorage 'fjgeladao_produtos')
        const produtosDinamicos = produtosCadastrados.filter(p => p.ativo);

        // 2. Produtos estáticos do HTML (salvos pelo script.js no localStorage)
        const produtosEstaticosSalvos = localStorage.getItem('fjgeladao_produtos_estaticos');
        const produtosEstaticos = produtosEstaticosSalvos ? JSON.parse(produtosEstaticosSalvos) : [];

        // 3. Obter customizações (preços sobrescritos e produtos ocultos)
        const precosSobrescritos = JSON.parse(localStorage.getItem('fjgeladao_preco_sobrescrito') || '{}');
        const produtosOcultos = JSON.parse(localStorage.getItem('fjgeladao_produtos_ocultos') || '[]');

        // 4. Processar produtos estáticos: aplicar ocultação e preços customizados
        const produtosEstaticosProcessados = produtosEstaticos
            .filter(p => !produtosOcultos.includes(p.id)) // Filtra os produtos ocultos
            .map(p => {
                // Se existe um preço sobrescrito, usa ele
                if (precosSobrescritos.hasOwnProperty(p.id)) {
                    return { ...p, preco: precosSobrescritos[p.id] };
                }
                return p;
            });

        // 5. Combinar as duas listas e ordenar
        const todosProdutos = [...produtosDinamicos, ...produtosEstaticosProcessados];
        return todosProdutos.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    function salvarPreco(produtoId, novoPreco) {
        if (isNaN(novoPreco) || novoPreco < 0) {
            alert('Preço inválido!');
            return;
        }

        const todosProdutos = obterTodosProdutos();
        const produtoRef = todosProdutos.find(p => p.id == produtoId);

        if (produtoRef && produtoRef.isStatic) {
            // Produto estático: salva o preço sobrescrito no localStorage
            let precosSobrescritos = JSON.parse(localStorage.getItem('fjgeladao_preco_sobrescrito') || '{}');
            precosSobrescritos[produtoId] = novoPreco;
            localStorage.setItem('fjgeladao_preco_sobrescrito', JSON.stringify(precosSobrescritos));
            alert('Preço do produto atualizado! A mudança aparecerá na página principal após recarregar.');
        } else {
            // Produto dinâmico: atualiza diretamente no array de produtos cadastrados
            const produto = produtosCadastrados.find(p => p.id == produtoId);
            if (produto) {
                produto.preco = novoPreco;
                salvarProdutosCadastrados();
                alert('Preço do produto atualizado! A mudança aparecerá na página principal após recarregar.');
            } else {
                alert('Produto dinâmico não encontrado para atualizar.');
            }
        }
        carregarListaProdutosEdit(); // Recarrega a lista para mostrar o novo preço
    }

    function excluirProduto(produtoId) {
        const todosProdutos = obterTodosProdutos();
        const produto = todosProdutos.find(p => p.id == produtoId);
        if (!produto || !confirm(`Tem certeza que deseja ocultar/excluir o produto "${produto.nome}"?`)) return;

        if (produto.isStatic) {
            // Produto estático: adiciona à lista de ocultos
            let produtosOcultos = JSON.parse(localStorage.getItem('fjgeladao_produtos_ocultos') || '[]');
            if (!produtosOcultos.includes(produto.id)) {
                produtosOcultos.push(produto.id);
                localStorage.setItem('fjgeladao_produtos_ocultos', JSON.stringify(produtosOcultos));
            }
            alert('Produto ocultado! Ele não aparecerá na página principal após recarregar.');
        } else {
            // Produto dinâmico: marca como inativo
            const produtoDinamico = produtosCadastrados.find(p => p.id == produtoId);
            if (produtoDinamico) {
                produtoDinamico.ativo = false;
                salvarProdutosCadastrados();
                alert('Produto excluído! Ele não aparecerá mais na página principal após recarregar.');
            }
        }
        carregarListaProdutosEdit(); // Recarrega a lista
    }

    function buscarProdutos() {
        const termo = document.getElementById('search-produto').value.toLowerCase();
        const items = document.querySelectorAll('.produto-edit-item');
        items.forEach(item => {
            const nome = item.querySelector('h5').textContent.toLowerCase();
            if (nome.includes(termo)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    function salvarProdutosCadastrados() {
        localStorage.setItem('fjgeladao_produtos', JSON.stringify(produtosCadastrados));
        localStorage.setItem('fjgeladao_proximo_produto_id', proximoIdProduto.toString());
    }

    function carregarProdutosCadastrados() {
        const produtosSalvos = localStorage.getItem('fjgeladao_produtos');
        const proximoIdSalvo = localStorage.getItem('fjgeladao_proximo_produto_id');
        if (produtosSalvos) {
            produtosCadastrados = JSON.parse(produtosSalvos);
        }
        if (proximoIdSalvo) {
            proximoIdProduto = parseInt(proximoIdSalvo);
        }
    }

    // --- EXPORTAÇÃO CSV ---
    function setupExportacaoCSV() {
        const btnExportar = document.getElementById('btn-exportar-csv');
        if (btnExportar) btnExportar.addEventListener('click', exportarCSV);
    }

    function exportarCSV() {
        let pedidosParaExportar = pedidos;
        if (filtroDataAtivo && dataInicioFiltro && dataFimFiltro) {
            pedidosParaExportar = pedidos.filter(pedido => {
                const dataPedido = new Date(pedido.dataHora);
                return dataPedido >= dataInicioFiltro && dataPedido <= dataFimFiltro;
            });
        }

        if (pedidosParaExportar.length === 0) {
            alert('Nenhum pedido encontrado para exportar!');
            return;
        }

        let csvContent = 'ID,Data/Hora,Status,Cliente,Itens,Quantidade Total,Valor Total,Tipo Entrega,Forma Pagamento\n';
        pedidosParaExportar.forEach(pedido => {
            const dataFormatada = new Date(pedido.dataHora).toLocaleString('pt-BR');
            const itensTexto = pedido.itens.map(item => `${item.nome.replace(/"/g, '""')} (${item.quantidade}x)`).join('; ');
            const quantidadeTotal = pedido.itens.reduce((total, item) => total + item.quantidade, 0);
            csvContent += `${pedido.id},"${dataFormatada}","${pedido.status}","${pedido.cliente.replace(/"/g, '""')}","${itensTexto}",${quantidadeTotal},${pedido.total.toFixed(2)},"${pedido.tipoEntrega}","${pedido.formaPagamento}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);

        const hoje = new Date();
        const dataArquivo = hoje.toISOString().split('T')[0];
        let nomeArquivo = `pedidos_fjgeladao_${dataArquivo}`;
        if (filtroDataAtivo) {
            const inicioFmt = dataInicioFiltro.toISOString().split('T')[0];
            const fimFmt = dataFimFiltro.toISOString().split('T')[0];
            nomeArquivo = `pedidos_fjgeladao_${inicioFmt}_a_${fimFmt}`;
        }

        link.setAttribute('download', `${nomeArquivo}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert(`${pedidosParaExportar.length} pedidos exportados com sucesso!`);
    }
});