// Variáveis globais
let carrinho = [];
let totalCarrinho = 0;
let subtotalCarrinho = 0;
let taxaEntrega = 5.00;

// Aguarda o carregamento da página
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupBannerAnimation();
});

// Função para animar o banner promocional ao rolar a página
function setupBannerAnimation() {
    const banner = document.querySelector('.banner-promocional');
    if (!banner) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        // Move o banner para cima suavemente ao rolar a página
        banner.style.transform = `translateY(${scrollY * 0.5}px)`;
    });
}

// Inicializa a aplicação
function initializeApp() {
    setupEventListeners();
    setupSmoothScroll();
    setupFilterButtons();
    setupCarrinhoModal();
    setupPagamentoEntrega();
    // Salva os produtos estáticos do HTML para o painel de admin poder acessá-los
    salvarProdutosEstaticosParaAdmin();
    // Carrega produtos dinâmicos e aplica customizações
    carregarProdutosCadastrados();
    // As funções abaixo serão chamadas dentro de carregarProdutosCadastrados
    // para garantir a ordem correta de execução.
}

// Função para aplicar ocultação de produtos estáticos do localStorage
function aplicarProdutosOcultos() {
    const produtosOcultos = JSON.parse(localStorage.getItem('fjgeladao_produtos_ocultos') || '[]');
    const produtosHTML = document.querySelectorAll('.produto-card');

    produtosHTML.forEach((card, index) => {
        const produtoId = `html-${index}`;
        if (produtosOcultos.includes(produtoId)) {
            card.style.display = 'none';
            card.setAttribute('data-produto-oculto', 'true');
        }
    });
}

// Salva os produtos estáticos do HTML no localStorage para o painel de admin
function salvarProdutosEstaticosParaAdmin() {
    const produtosHTML = document.querySelectorAll('.produtos-grid .produto-card');
    const produtosEstaticos = [];

    produtosHTML.forEach((card, index) => {
        // Pula os cards que foram adicionados dinamicamente
        if (card.getAttribute('data-produto-id')?.startsWith('dyn-')) {
            return;
        }

        const nomeElement = card.querySelector('h3');
        const precoElement = card.querySelector('.preco');
        const categoria = card.getAttribute('data-categoria');
        const btnComprar = card.querySelector('.btn-comprar');

        if (nomeElement && precoElement && categoria && btnComprar) {
            const nome = nomeElement.textContent.trim();
            const preco = parseFloat(precoElement.textContent.replace('R$ ', '').replace(',', '.'));
            
            const produtoData = {
                id: `html-${index}`, // ID único para produtos estáticos
                nome: nome,
                preco: preco,
                categoria: categoria,
                isStatic: true // Flag para identificar
            };

            // Verifica se há informações de fardo
            const fardoPrecoAttr = btnComprar.getAttribute('data-fardo-preco');
            const fardoLabelSpan = card.querySelector('.opcao-tipo label:last-child span');

            if (fardoPrecoAttr && fardoLabelSpan) {
                produtoData.fardoPreco = parseFloat(fardoPrecoAttr);
                // Extrai a quantidade do texto, ex: "Fardo (12 un)" -> 12
                const match = fardoLabelSpan.textContent.match(/\((\d+)\s*un\)/);
                if (match && match[1]) {
                    produtoData.fardoQtd = parseInt(match[1], 10);
                }
            }

            produtosEstaticos.push(produtoData);
        }
    });
    localStorage.setItem('fjgeladao_produtos_estaticos', JSON.stringify(produtosEstaticos));
}

// Função para aplicar preços sobrescritos dos produtos estáticos do localStorage
function aplicarPrecosSobrescritos() {
    const precosSobrescritos = JSON.parse(localStorage.getItem('fjgeladao_preco_sobrescrito') || '{}'); // Esta função será movida
    const produtosHTML = document.querySelectorAll('.produto-card');

    produtosHTML.forEach((card, index) => {
        const produtoId = `html-${index}`;
        if (precosSobrescritos.hasOwnProperty(produtoId)) {
            const precoOverride = precosSobrescritos[produtoId];
            const precoElement = card.querySelector('.preco');
            const btnComprar = card.querySelector('.btn-comprar');
            if (precoElement && btnComprar) {
                precoElement.textContent = `R$ ${parseFloat(precoOverride).toFixed(2)}`;
                btnComprar.setAttribute('data-preco', precoOverride.toString());
            }
        }
    });
}

// Configura os event listeners
function setupEventListeners() {
    // Botões de adicionar ao carrinho
    const botoesComprar = document.querySelectorAll('.btn-comprar');
    botoesComprar.forEach(botao => {
        botao.addEventListener('click', adicionarAoCarrinho);
    });

    // Botão do carrinho no header
    const carrinhoIcon = document.querySelector('.carrinho');
    carrinhoIcon.addEventListener('click', abrirCarrinho);

    // Botão "Ver Produtos" no hero
    const btnVerProdutos = document.querySelector('.btn-primary');
    if (btnVerProdutos) {
        btnVerProdutos.addEventListener('click', function() {
            document.getElementById('produtos').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }

    // Formulário de contato
    const formContato = document.getElementById('form-contato');
    if (formContato) {
        formContato.addEventListener('submit', enviarMensagem);
    }

    // Botão finalizar pedido
    const btnFinalizar = document.getElementById('finalizar-pedido');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', finalizarPedido);
    }
}

// Configura scroll suave para navegação
function setupSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function setupFilterButtons() {
    const filtros = document.querySelectorAll('.filtro-btn');
    const produtos = document.querySelectorAll('.produto-card');

    filtros.forEach(filtro => {
        filtro.addEventListener('click', function() {
            filtros.forEach(f => f.classList.remove('active'));
            this.classList.add('active');

            const categoria = this.getAttribute('data-categoria');

            produtos.forEach(produto => {
                if (categoria === 'todos' || produto.getAttribute('data-categoria') === categoria) {
                    produto.style.display = 'block';
                    produto.classList.add('show');
                } else {
                    produto.style.display = 'none';
                    produto.classList.remove('show');
                }
            });
        });
    });
}

// Fix radio buttons selection issue for product options
document.addEventListener('click', function(event) {
    if (event.target.matches('.produto-opcoes input[type="radio"]')) {
        const clickedRadio = event.target;
        const name = clickedRadio.name;
        // Get all radios with the same name
        const radios = document.querySelectorAll(`input[name="${name}"]`);
        radios.forEach(radio => {
            if (radio !== clickedRadio) {
                radio.checked = false;
            }
        });
        clickedRadio.checked = true;
    }
});

function setupCarrinhoModal() {
    const modal = document.getElementById('carrinho-modal');
    const closeBtn = modal.querySelector('.close');

    // Fechar modal ao clicar no X
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Fechar modal ao clicar fora dele
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Adiciona produto ao carrinho
function adicionarAoCarrinho(event) {
    const botao = event.target.closest('.btn-comprar');
    const produto = botao.getAttribute('data-produto');

    // Find the product card element
    const produtoCard = botao.closest('.produto-card');

    // Default to unidade
    let tipoSelecionado = 'unidade';
    let preco = parseFloat(botao.getAttribute('data-preco'));
    let quantidade = 1;

    if (produtoCard) {
        // Check if there are radio buttons for tipo
        const radios = produtoCard.querySelectorAll('.opcao-tipo input[type="radio"]');
        if (radios.length > 0) {
            radios.forEach(radio => {
                if (radio.checked) {
                    tipoSelecionado = radio.value;
                }
            });

            if (tipoSelecionado === 'fardo') {
                // Use fardo price and quantity
                const precoFardo = botao.getAttribute('data-fardo-preco');
                const qtdFardo = botao.getAttribute('data-fardo-qtd');
                if (precoFardo) {
                    preco = parseFloat(precoFardo);
                }
                if (qtdFardo) {
                    quantidade = parseInt(qtdFardo);
                }
            }
        }
    }

    // Compose name with type for clarity in cart
    const nomeCompleto = tipoSelecionado === 'fardo' ? `${produto} (Fardo)` : produto;

    // Verifica se o produto já existe no carrinho com the same type
    const produtoExistente = carrinho.find(item => item.nome === nomeCompleto);

    if (produtoExistente) {
        produtoExistente.quantidade += quantidade;
    } else {
        carrinho.push({
            nome: nomeCompleto,
            preco: preco,
            quantidade: quantidade,
            tipo: tipoSelecionado
        });
    }

    atualizarCarrinho();
    mostrarNotificacao(`${nomeCompleto} adicionado ao carrinho!`);
    
    // Animação no botão
    botao.style.transform = 'scale(0.95)';
    setTimeout(() => {
        botao.style.transform = 'scale(1)';
    }, 150);
}

// Atualiza o carrinho
function atualizarCarrinho() {
    const carrinhoCount = document.querySelector('.carrinho-count');
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    
    carrinhoCount.textContent = totalItens;
    
    // Calcula o total
    totalCarrinho = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    
    // Atualiza o display do carrinho
    atualizarDisplayCarrinho();
}

// Atualiza o display do carrinho no modal
function atualizarDisplayCarrinho() {
    const carrinhoItems = document.getElementById('carrinho-items');

    carrinhoItems.innerHTML = '';

    if (carrinho.length === 0) {
        carrinhoItems.innerHTML = '<p style="text-align: center; color: #666;">Seu carrinho está vazio</p>';
    } else {
        carrinho.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'carrinho-item';
            itemDiv.innerHTML = `
                <div>
                    <strong>${item.nome}</strong><br>
                    <small>Quantidade: ${item.quantidade} (${item.tipo === 'fardo' ? 'Fardo' : 'Unidade'})</small>
                </div>
                <div>
                    <strong>R$ ${(item.preco * item.quantidade).toFixed(2)}</strong>
                    <button onclick="removerDoCarrinho(${index})" style="margin-left: 10px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">×</button>
                </div>
            `;
            carrinhoItems.appendChild(itemDiv);
        });
    }

    atualizarTotais();
}

// Remove item do carrinho
function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
}

// Abre o modal do carrinho
function abrirCarrinho() {
    const modal = document.getElementById('carrinho-modal');
    modal.style.display = 'block';
    atualizarDisplayCarrinho();
}


// Mostra notificação
function mostrarNotificacao(mensagem, tipo = 'success') {
    // Remove notificação existente
    const notificacaoExistente = document.querySelector('.notificacao');
    if (notificacaoExistente && notificacaoExistente.parentNode) {
        notificacaoExistente.remove();
    }

    // Cria nova notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;

    // Estilos da notificação
    notificacao.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${tipo === 'error' ? '#e74c3c' : '#00b894'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(notificacao);

    // Animação de entrada
    setTimeout(() => {
        notificacao.style.transform = 'translateX(0)';
    }, 100);

    // Remove após 3 segundos
    setTimeout(() => {
        notificacao.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notificacao && notificacao.parentNode) {
                notificacao.remove();
            }
        }, 300);
    }, 3000);
}

// Animação de scroll para revelar elementos
function revelarElementos() {
    const elementos = document.querySelectorAll('.produto-card, .sobre-text, .info-item');

    elementos.forEach(elemento => {
        const elementoTop = elemento.getBoundingClientRect().top;
        const elementoVisivel = elementoTop < window.innerHeight - 100;

        if (elementoVisivel) {
            elemento.style.opacity = '1';
            elemento.style.transform = 'translateY(0)';
        }
    });
}

// Event listener para scroll
window.addEventListener('scroll', revelarElementos);

// Inicializa elementos com animação
document.addEventListener('DOMContentLoaded', function() {
    const elementos = document.querySelectorAll('.produto-card, .sobre-text, .info-item');
    elementos.forEach(elemento => {
        elemento.style.opacity = '0';
        elemento.style.transform = 'translateY(30px)';
        elemento.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
});

// Função para destacar navegação ativa
function destacarNavegacaoAtiva() {
    const secoes = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav a');

    let secaoAtual = '';

    secoes.forEach(secao => {
        const secaoTop = secao.getBoundingClientRect().top;
        if (secaoTop <= 100) {
            secaoAtual = secao.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${secaoAtual}`) {
            link.classList.add('active');
        }
    });
}

// Event listener para scroll da navegação
window.addEventListener('scroll', destacarNavegacaoAtiva);

// Configura funcionalidades de pagamento e entrega
function setupPagamentoEntrega() {
    // Event listeners para opções de entrega
    const entregaRadios = document.querySelectorAll('input[name="entrega"]');
    entregaRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const enderecoSection = document.getElementById('endereco-section');
            const taxaEntregaLinha = document.getElementById('taxa-entrega-linha');

            if (this.value === 'entrega') {
                enderecoSection.style.display = 'block';
                taxaEntregaLinha.style.display = 'flex';
            } else {
                enderecoSection.style.display = 'none';
                taxaEntregaLinha.style.display = 'none';
            }

            atualizarTotais();
        });
    });

    // Event listeners para opções de pagamento
    const pagamentoRadios = document.querySelectorAll('input[name="pagamento"]');
    pagamentoRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const trocoSection = document.getElementById('troco-section');

            if (this.value === 'dinheiro') {
                trocoSection.style.display = 'block';
            } else {
                trocoSection.style.display = 'none';
            }
        });
    });
}

// Atualiza os totais do carrinho
function atualizarTotais() {
    subtotalCarrinho = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);

    const entregaSelecionada = document.querySelector('input[name="entrega"]:checked');
    const isEntrega = entregaSelecionada && entregaSelecionada.value === 'entrega';

    totalCarrinho = subtotalCarrinho + (isEntrega ? taxaEntrega : 0);

    // Atualiza elementos do DOM
    const subtotalElement = document.getElementById('subtotal-preco');
    const totalElement = document.getElementById('total-preco');

    if (subtotalElement) subtotalElement.textContent = subtotalCarrinho.toFixed(2);
    if (totalElement) totalElement.textContent = totalCarrinho.toFixed(2);
}

// Atualiza a função atualizarDisplayCarrinho para usar os novos totais
function atualizarDisplayCarrinho() {
    const carrinhoItems = document.getElementById('carrinho-items');

    carrinhoItems.innerHTML = '';

    if (carrinho.length === 0) {
        carrinhoItems.innerHTML = '<p style="text-align: center; color: #666;">Seu carrinho está vazio</p>';
    } else {
        carrinho.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'carrinho-item';
            itemDiv.innerHTML = `
                <div>
                    <strong>${item.nome}</strong><br>
                    <small>Quantidade: ${item.quantidade}</small>
                </div>
                <div>
                    <strong>R$ ${(item.preco * item.quantidade).toFixed(2)}</strong>
                    <button onclick="removerDoCarrinho(${index})" style="margin-left: 10px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">×</button>
                </div>
            `;
            carrinhoItems.appendChild(itemDiv);
        });
    }

    atualizarTotais();
}

// Finaliza o pedido, salva no localStorage e gera a mensagem para o WhatsApp
function finalizarPedido() {
    if (carrinho.length === 0) {
        mostrarNotificacao('Seu carrinho está vazio!', 'error');
        return;
    }

    // Coleta informações de entrega e pagamento
    const entregaSelecionada = document.querySelector('input[name="entrega"]:checked');
    const isEntrega = entregaSelecionada && entregaSelecionada.value === 'entrega';
    const endereco = document.getElementById('endereco-input').value.trim();

    const pagamentoSelecionado = document.querySelector('input[name="pagamento"]:checked');
    const formaPagamento = pagamentoSelecionado ? pagamentoSelecionado.value : 'dinheiro';
    const troco = document.getElementById('troco-input').value;

    // Validações
    if (isEntrega && !endereco) {
        mostrarNotificacao('Por favor, informe o endereço para entrega!', 'error');
        return;
    }

    // --- Salvar Pedido no Sistema (localStorage) ---
    const pedidosSalvos = localStorage.getItem('fjgeladao_pedidos') || '[]';
    const proximoIdSalvo = localStorage.getItem('fjgeladao_proximo_id') || '1';

    let pedidos = JSON.parse(pedidosSalvos);
    let proximoIdPedido = parseInt(proximoIdSalvo);

    const novoPedido = {
        id: proximoIdPedido++,
        dataHora: new Date().toISOString(),
        status: 'pendente',
        cliente: 'Cliente via Site',
        itens: [...carrinho],
        total: totalCarrinho,
        tipoEntrega: isEntrega ? 'entrega' : 'retirada',
        endereco: isEntrega ? endereco : null,
        formaPagamento: formaPagamento,
        troco: (formaPagamento === 'dinheiro' && troco) ? troco : null
    };

    pedidos.push(novoPedido);

    localStorage.setItem('fjgeladao_pedidos', JSON.stringify(pedidos));
    localStorage.setItem('fjgeladao_proximo_id', proximoIdPedido.toString());

    // --- Gerar Mensagem para WhatsApp ---
    let mensagem = '🛒 *NOVO PEDIDO - FJ GELADÃO*\n\n';

    mensagem += '📋 *ITENS:*\n';
    carrinho.forEach(item => {
        mensagem += `• ${item.nome}\n`;
        mensagem += `  Qtd: ${item.quantidade} | Valor: R$ ${(item.preco * item.quantidade).toFixed(2)}\n\n`;
    });

    mensagem += '🚚 *ENTREGA:*\n';
    if (isEntrega) {
        mensagem += `📍 Entrega em domicílio\n`;
        mensagem += `📍 Endereço: ${endereco}\n`;
        mensagem += `💰 Taxa de entrega: R$ ${taxaEntrega.toFixed(2)}\n\n`;
    } else {
        mensagem += `🏪 Retirar no local\n`;
        mensagem += `📍 Rua Porto Príncipe, 817 - Prq Santa Rosa\n\n`;
    }

    mensagem += '💳 *PAGAMENTO:*\n';
    switch (formaPagamento) {
        case 'dinheiro':
            mensagem += '💵 Dinheiro\n';
            if (troco && parseFloat(troco) > 0) {
                mensagem += `💰 Troco para: R$ ${parseFloat(troco).toFixed(2)}\n`;
            }
            break;
        case 'cartao':
            mensagem += '💳 Cartão (débito/crédito)\n';
            break;
    }

    // Totais
    mensagem += '\n💰 *RESUMO:*\n';
    mensagem += `Subtotal: R$ ${subtotalCarrinho.toFixed(2)}\n`;
    if (isEntrega) {
        mensagem += `Taxa de entrega: R$ ${taxaEntrega.toFixed(2)}\n`;
    }
    mensagem += `*TOTAL: R$ ${totalCarrinho.toFixed(2)}*\n\n`;

    mensagem += '✅ Confirme seu pedido para prosseguir!';

    // Abre WhatsApp
    const numeroWhatsApp = '5585996421255'; // Número real do FJ Geladão
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

    window.open(urlWhatsApp, '_blank');

    // Limpa o carrinho
    carrinho = [];
    atualizarCarrinho();

    // Fecha o modal
    document.getElementById('carrinho-modal').style.display = 'none';

    mostrarNotificacao('Pedido enviado! Redirecionando para WhatsApp...', 'success');
}

// Atualiza a função enviarMensagem para usar o número correto
function enviarMensagem(event) {
    event.preventDefault();

    const form = event.target;
    const nome = form.querySelector('input[type="text"]').value;
    const telefone = form.querySelector('input[type="tel"]').value;
    const mensagem = form.querySelector('textarea').value;

    // Cria mensagem para WhatsApp
    const mensagemWhatsApp = `📞 *CONTATO - FJ GELADÃO*\n\n👤 Nome: ${nome}\n📱 Telefone: ${telefone}\n\n💬 Mensagem:\n${mensagem}`;

    // Abre WhatsApp
    const numeroWhatsApp = '5585996421255'; // Número real do FJ Geladão
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagemWhatsApp)}`;

    window.open(urlWhatsApp, '_blank');

    // Limpa o formulário
    form.reset();

    mostrarNotificacao('Redirecionando para WhatsApp...', 'success');
}

// Adiciona CSS para link ativo da navegação
const style = document.createElement('style');
style.textContent = `
    .nav a.active {
        color: #74b9ff !important;
        font-weight: bold;
    }
`;
document.head.appendChild(style);

// ===== LÓGICA DE PRODUTOS DINÂMICOS =====

function adicionarProdutoAoDOM(produto) {
    const produtosGrid = document.querySelector('.produtos-grid');

    const produtoCard = document.createElement('div');
    produtoCard.className = 'produto-card';
    produtoCard.setAttribute('data-categoria', produto.categoria);
    produtoCard.setAttribute('data-produto-id', `dyn-${produto.id}`); // Prefixo para produtos dinâmicos

    produtoCard.innerHTML = `
        <div class="produto-image">
            ${produto.imagem ?
                `<img src="${produto.imagem}" alt="${produto.nome}">` :
                `<i class="fas fa-box" style="font-size: 4rem; color: #74b9ff;"></i>`
            }
        </div>
        <h3>${produto.nome}</h3>
        <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
        <button class="btn-comprar" data-produto="${produto.nome}" data-preco="${produto.preco}">
            <i class="fas fa-cart-plus"></i> Adicionar
        </button>
    `;

    // Adiciona event listener ao botão
    const btnComprar = produtoCard.querySelector('.btn-comprar');
    btnComprar.addEventListener('click', adicionarAoCarrinho);

    produtosGrid.appendChild(produtoCard);
}

function carregarProdutosCadastrados() {
    const produtosSalvos = localStorage.getItem('fjgeladao_produtos');

    if (produtosSalvos) {
        const produtosCadastrados = JSON.parse(produtosSalvos);

        // Adiciona produtos salvos ao DOM
        produtosCadastrados.forEach(produto => {
            if (produto.ativo) {
                adicionarProdutoAoDOM(produto);
            }
        });
    }

    // Após carregar os produtos, aplicamos as customizações
    aplicarPrecosSobrescritos();
    aplicarProdutosOcultos();
}
