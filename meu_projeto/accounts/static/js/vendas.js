'use strict';

// ====================
// Variáveis e Seletores do DOM
// ====================

let vendas = [];
let produtosDisponiveis = [];
let clientesDisponiveis = [];

const API_VENDAS_URL = '/api/vendas/';
const API_PRODUTOS_URL = '/api/produtos/';
const API_CLIENTES_URL = '/api/clientes/';

const salesGrid = document.getElementById('sales-grid');
const popupMsg = document.getElementById('popupMsg');

// ====================
// Funções de Gerenciamento de Modal e UI
// ====================

/**
 * Abre o modal de venda para registro ou edição.
 * @param {boolean} [edit=false] - Indica se é para edição ou novo registro.
 */
function openModal(edit = false) {
    document.getElementById('venda-modal').style.display = 'flex';
    const form = document.getElementById('venda-form');
    form.reset();
    document.getElementById('modal-title').textContent = edit ? "Editar Venda" : "Registrar Venda";
    document.getElementById('confirm-button').textContent = edit ? "Salvar Alterações" : "Registrar Venda";
    document.getElementById('venda-id').value = '';
}

/**
 * Fecha o modal de venda.
 */
function closeModal() {
    document.getElementById('venda-modal').style.display = 'none';
}

/**
 * Abre o modal de cadastro rápido de cliente.
 * @param {Event} event - O evento de clique.
 */
function openClienteRapidoModal(event) {
    event.stopPropagation();
    document.getElementById('cliente-rapido-modal').style.display = 'flex';
}

/**
 * Fecha o modal de cadastro rápido de cliente e reseta o formulário.
 */
function closeClienteRapidoModal() {
    const form = document.getElementById('cliente-rapido-form');
    form.reset();
    document.getElementById('cliente-rapido-modal').style.display = 'none';
    toggleAddressFields(form, false);
}

/**
 * Abre o modal de confirmação de exclusão.
 */
function openDeleteModal() {
    document.getElementById('confirm-delete-modal').style.display = 'flex';
}

/**
 * Fecha o modal de confirmação de exclusão.
 */
function closeDeleteModal() {
    document.getElementById('confirm-delete-modal').style.display = 'none';
}

// ====================
// Funções de Utilitário
// ====================

/**
 * Obtém o valor de um cookie.
 * @param {string} name - O nome do cookie.
 * @returns {string|null} O valor do cookie ou null.
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Exibe uma mensagem de pop-up minimalista.
 * @param {string} message - A mensagem a ser exibida.
 * @param {boolean} [isError=false] - Se a mensagem é de erro.
 */
function showPopup(message, isError = false) {
    const icon = isError ? '<i class="fas fa-times-circle"></i>' : '<i class="fas fa-check-circle"></i>';
    popupMsg.innerHTML = `${icon} ${message}`;
    popupMsg.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
    popupMsg.classList.add('show');
    setTimeout(() => {
        popupMsg.classList.remove('show');
    }, 1000);
}

/**
 * Formata um CEP no formato 00000-000.
 * @param {string} cep - O CEP a ser formatado.
 * @returns {string} O CEP formatado.
 */
function formatCEP(cep) {
    if (!cep) return "";
    return cep.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Formata um CPF no formato 000.000.000-00.
 * @param {string} cpf - O CPF a ser formatado.
 * @returns {string} O CPF formatado.
 */
function formatCPF(cpf) {
    if (!cpf) return '';
    return cpf.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Habilita ou desabilita os campos de endereço.
 * @param {HTMLElement} formContainer - O formulário que contém os campos.
 * @param {boolean} enableManual - Se os campos devem ser editáveis.
 */
function toggleAddressFields(formContainer, enableManual) {
    const cityField = formContainer.querySelector('[id*="cidade"]');
    const stateField = formContainer.querySelector('[id*="estado"]');
    if (cityField && stateField) {
        cityField.readOnly = !enableManual;
        stateField.readOnly = !enableManual;
        if (enableManual) {
            cityField.placeholder = 'Digite a cidade';
            stateField.placeholder = 'Digite o estado (UF)';
        } else {
            cityField.placeholder = 'Preenchimento automático';
            stateField.placeholder = 'Preenchimento automático';
        }
    }
}

/**
 * Busca o endereço com base no CEP inserido.
 * @param {Event} event - O evento de 'blur' do campo CEP.
 */
async function handleCepLookup(event) {
    const inputElement = event.target;
    const formContainer = inputElement.closest('form');
    if (!formContainer) return;
    const streetField = formContainer.querySelector('[id*="endereco"]');
    const cityField = formContainer.querySelector('[id*="cidade"]');
    const stateField = formContainer.querySelector('[id*="estado"]');
    const cep = inputElement.value.replace(/\D/g, '');

    if (cep.length === 8) {
        try {
            const response = await fetch(`/api/buscar_cep/${cep}/`);
            if (!response.ok) throw new Error('CEP não encontrado');
            const data = await response.json();
            if (data.success) {
                streetField.value = data.endereco;
                cityField.value = data.cidade;
                stateField.value = data.estado;
                toggleAddressFields(formContainer, false);
            } else {
                showPopup('CEP não encontrado. Preencha o endereço manualmente.', true);
                streetField.value = '';
                cityField.value = '';
                stateField.value = '';
                toggleAddressFields(formContainer, true);
            }
        } catch (error) {
            console.error("Erro na busca de CEP:", error);
            showPopup('Erro ao buscar CEP. Preencha o endereço manualmente.', true);
            streetField.value = '';
            cityField.value = '';
            stateField.value = '';
            toggleAddressFields(formContainer, true);
        }
    }
}

// ====================
// Funções de Requisição e Renderização
// ====================

/**
 * Carrega todos os dados iniciais da aplicação (vendas, produtos e clientes).
 */
async function carregarDadosIniciais() {
    await Promise.all([
        carregarProdutosDisponiveis(),
        carregarClientesDisponiveis(),
        carregarVendas()
    ]);
}

/**
 * Busca as vendas registradas na API e as renderiza na tela.
 */
async function carregarVendas() {
    try {
        const response = await fetch(API_VENDAS_URL);
        if (!response.ok) throw new Error('Erro ao carregar vendas');
        vendas = await response.json();
        renderizarVendas();
    } catch (error) {
        console.error("Erro ao carregar vendas:", error);
        salesGrid.innerHTML = `<p style="text-align:center; color: var(--light-text-color);">Não foi possível carregar as vendas.</p>`;
    }
}

/**
 * Busca a lista de produtos na API.
 */
async function carregarProdutosDisponiveis() {
    try {
        const response = await fetch(API_PRODUTOS_URL);
        if (!response.ok) throw new Error('Erro ao carregar produtos');
        // A API de produtos retorna um objeto com uma chave 'produtos'
        const data = await response.json();
        produtosDisponiveis = data.produtos || []; 
        preencherSelectProdutos();
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}


/**
 * Busca a lista de clientes na API.
 */
async function carregarClientesDisponiveis() {
    try {
        const response = await fetch(API_CLIENTES_URL);
        if (!response.ok) throw new Error('Erro ao carregar clientes');
        clientesDisponiveis = await response.json();
        preencherSelectClientes();
    } catch (error) {
        console.error("Erro ao carregar clientes:", error);
    }
}

/**
 * Renderiza os cards de venda na tela.
 */
function renderizarVendas() {
    salesGrid.innerHTML = '';
    if (vendas.length === 0) {
        salesGrid.innerHTML = `<p style="text-align:center; color: var(--light-text-color);">Nenhuma venda registrada.</p>`;
        return;
    }
    vendas.forEach(venda => {
        const card = document.createElement('div');
        card.classList.add('sale-card');
        const precoTotalFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.preco_total);
        const dataFormatada = new Date(venda.data_venda).toLocaleDateString('pt-BR');
        card.innerHTML = `
            <h3>Venda #${venda.id.substring(0, 8)}</h3>
            <div class="sale-info">
                <strong>Produto:</strong> <span>${venda.produto__nome}</span>
            </div>
            <div class="sale-info">
                <strong>Cliente:</strong> <span>${venda.cliente__nome}</span>
            </div>
            <div class="sale-info">
                <strong>Quantidade:</strong> <span>${venda.quantidade}</span>
            </div>
            <div class="sale-info">
                <strong>Valor Total:</strong> <span>${precoTotalFormatado}</span>
            </div>
            <div class="sale-info">
                <strong>Data:</strong> <span>${dataFormatada}</span>
            </div>
            <div class="sale-actions">
                <button class="delete-btn" onclick="excluirVenda('${venda.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        salesGrid.appendChild(card);
    });
    filtrarVendas();
}

/**
 * Registra um novo cliente de forma rápida.
 * @param {Event} event - O evento de submit do formulário.
 */
async function registrarClienteRapido(event) {
    event.preventDefault();
    const csrftoken = getCookie('csrftoken');
    const clienteData = {
        nome: document.getElementById('cliente-rapido-nome').value.trim(),
        cpf: document.getElementById('cliente-rapido-cpf').value.replace(/\D/g, ''),
        email: document.getElementById('cliente-rapido-email').value.trim(),
        telefone: document.getElementById('cliente-rapido-telefone').value.replace(/\D/g, ''),
        cep: document.getElementById('cliente-rapido-cep').value.replace(/\D/g, ''),
        endereco: document.getElementById('cliente-rapido-endereco').value.trim(),
        cidade: document.getElementById('cliente-rapido-cidade').value.trim(),
        estado: document.getElementById('cliente-rapido-estado').value.trim()
    };
    try {
        const response = await fetch(API_CLIENTES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify(clienteData),
        });
        const resultado = await response.json();
        if (!response.ok) {
            throw new Error(resultado.error || 'Erro desconhecido ao cadastrar cliente.');
        }
        showPopup('Cliente cadastrado com sucesso!');
        closeClienteRapidoModal();
        await carregarClientesDisponiveis();
        const clienteSearchInput = document.getElementById('cliente-search');
        clienteSearchInput.value = resultado.cliente.nome;
        clienteSearchInput.dataset.selectedCpf = resultado.cliente.cpf;
    } catch (error) {
        console.error("Erro ao cadastrar cliente:", error);
        showPopup(`Erro: ${error.message}`, true);
    }
}

/**
 * Registra ou atualiza uma venda.
 * @param {Event} event - O evento de submit do formulário.
 */
async function registrarVenda(event) {
    event.preventDefault();
    const csrftoken = getCookie('csrftoken');
    const form = event.target;
    const vendaData = {
        id: form.id.value.trim() || null,
        produto_id: document.getElementById('produto-search').dataset.selectedId,
        cliente_cpf: document.getElementById('cliente-search').dataset.selectedCpf,
        quantidade: parseInt(form.quantidade_venda.value.trim()),
    };
    if (!vendaData.produto_id || !vendaData.cliente_cpf || isNaN(vendaData.quantidade) || vendaData.quantidade <= 0) {
        showPopup("Por favor, preencha todos os campos corretamente.", true);
        return;
    }
    const produtoSelecionado = produtosDisponiveis.find(p => p.id === vendaData.produto_id);
    if (!produtoSelecionado || vendaData.quantidade > produtoSelecionado.quantidade) {
        showPopup(`Estoque insuficiente. Disponível: ${produtoSelecionado ? produtoSelecionado.quantidade : 0}`, true);
        return;
    }
    try {
        const url = vendaData.id ? `${API_VENDAS_URL}${vendaData.id}/` : API_VENDAS_URL;
        const method = vendaData.id ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify(vendaData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao registrar a venda');
        }
        showPopup('Venda registrada com sucesso!');
        await carregarDadosIniciais();
        closeModal();
    } catch (error) {
        console.error("Erro na venda:", error);
        showPopup(`Erro ao registrar a venda: ${error.message}`, true);
    }
}

/**
 * Prepara o modal de exclusão e exibe-o.
 * @param {string} id - O ID da venda a ser excluída.
 */
function excluirVenda(id) {
    const venda = vendas.find(v => v.id === id);
    if (!venda) return;
    const deleteMessage = document.getElementById('delete-message');
    const stockWarningMessage = document.getElementById('stock-warning-message');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    deleteMessage.innerHTML = `Tem certeza que deseja excluir a venda do produto <strong>${venda.produto__nome}</strong> para o cliente <strong>${venda.cliente__nome}</strong>?`;
    stockWarningMessage.innerHTML = `⚠️ <strong>Atenção:</strong> A quantidade vendida (<strong>${venda.quantidade}</strong>) retornará ao estoque do produto.`;
    confirmBtn.dataset.vendaId = id;
    openDeleteModal();
}

/**
 * Confirma e executa a exclusão de uma venda.
 */
async function confirmarExclusao() {
    const id = document.getElementById('confirm-delete-btn').dataset.vendaId;
    if (!id) {
        showPopup("Erro: ID da venda não encontrado.", true);
        return;
    }
    try {
        const csrftoken = getCookie('csrftoken');
        const url = `${API_VENDAS_URL}${id}/`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': csrftoken }
        });
        if (response.status === 204) {
            showPopup('Venda excluída com sucesso!');
            closeDeleteModal();
            await carregarDadosIniciais();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao excluir venda');
        }
    } catch (error) {
        console.error(error);
        showPopup(`Erro ao excluir venda: ${error.message}`, true);
    }
}

/**
 * Preenche o seletor de produtos com os dados disponíveis.
 */
function preencherSelectProdutos() {
    const container = document.getElementById('produto-select-container');
    container.innerHTML = `
        <input type="text" id="produto-search" placeholder="Buscar produto..." autocomplete="off">
        <div id="produto-options" class="select-options"></div>
    `;

    const searchInput = document.getElementById('produto-search');
    const optionsDiv = document.getElementById('produto-options');
    let activeIndex = -1;

    // Popula as opções iniciais
    produtosDisponiveis.forEach(produto => {
        const option = document.createElement('div');
        option.textContent = `${produto.nome} (Estoque: ${produto.quantidade})`;
        option.dataset.value = produto.id;
        option.onclick = () => {
            searchInput.value = produto.nome;
            searchInput.dataset.selectedId = produto.id;
            optionsDiv.style.display = 'none';
        };
        optionsDiv.appendChild(option);
    });

    // Adiciona os event listeners programaticamente
    searchInput.addEventListener('focus', () => {
        filtrarOpcoes('produto');
        optionsDiv.style.display = 'block';
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            optionsDiv.style.display = 'none';
        }, 200);
    });
    
    searchInput.addEventListener('input', () => {
        filtrarOpcoes('produto');
        activeIndex = -1;
        optionsDiv.style.display = 'block';
    });

    searchInput.addEventListener('keydown', (e) => {
        const allItems = Array.from(optionsDiv.children);
        const visibleItems = allItems.filter(item => item.style.display !== 'none');
        
        if (visibleItems.length === 0) return;

        const updateHighlight = () => {
            allItems.forEach(item => item.classList.remove('highlighted'));
            if (activeIndex > -1 && visibleItems[activeIndex]) {
                const activeItem = visibleItems[activeIndex];
                activeItem.classList.add('highlighted');
                activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        };

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex++;
            if (activeIndex >= visibleItems.length) activeIndex = 0;
            updateHighlight();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex--;
            if (activeIndex < 0) activeIndex = visibleItems.length - 1;
            updateHighlight();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex > -1 && visibleItems[activeIndex]) {
                visibleItems[activeIndex].click();
            }
        }
    });
}


/**
 * Preenche o seletor de clientes com os dados disponíveis.
 */
function preencherSelectClientes() {
    const container = document.getElementById('cliente-select-container');
    container.innerHTML = `
        <input type="text" id="cliente-search" placeholder="Buscar cliente por nome ou CPF..." autocomplete="off">
        <div id="cliente-options" class="select-options"></div>
    `;

    const searchInput = document.getElementById('cliente-search');
    const optionsDiv = document.getElementById('cliente-options');
    let activeIndex = -1;

    // Popula as opções iniciais
    clientesDisponiveis.forEach(cliente => {
        const option = document.createElement('div');
        option.textContent = `${cliente.nome} (${cliente.cpf})`;
        option.dataset.value = cliente.cpf;
        option.onclick = () => {
            searchInput.value = cliente.nome;
            searchInput.dataset.selectedCpf = cliente.cpf;
            optionsDiv.style.display = 'none';
        };
        optionsDiv.appendChild(option);
    });
    
    searchInput.addEventListener('focus', () => {
        filtrarOpcoes('cliente');
        optionsDiv.style.display = 'block';
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            optionsDiv.style.display = 'none';
        }, 200);
    });
    
    searchInput.addEventListener('input', () => {
        filtrarOpcoes('cliente');
        activeIndex = -1;
        optionsDiv.style.display = 'block';
    });

    searchInput.addEventListener('keydown', (e) => {
        const allItems = Array.from(optionsDiv.children);
        const visibleItems = allItems.filter(item => item.style.display !== 'none');
        
        if (visibleItems.length === 0) return;

        const updateHighlight = () => {
            allItems.forEach(item => item.classList.remove('highlighted'));
            if (activeIndex > -1 && visibleItems[activeIndex]) {
                const activeItem = visibleItems[activeIndex];
                activeItem.classList.add('highlighted');
                activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        };

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex++;
            if (activeIndex >= visibleItems.length) activeIndex = 0;
            updateHighlight();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex--;
            if (activeIndex < 0) activeIndex = visibleItems.length - 1;
            updateHighlight();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex > -1 && visibleItems[activeIndex]) {
                visibleItems[activeIndex].click();
            }
        }
    });
}


/**
 * Filtra as opções de produto ou cliente com base no termo de busca.
 * @param {string} tipo - 'produto' ou 'cliente'.
 */
function filtrarOpcoes(tipo) {
    const searchTerm = document.getElementById(`${tipo}-search`).value.toLowerCase();
    const optionsContainer = document.getElementById(`${tipo}-options`);
    const options = optionsContainer.children;
    
    let hasVisibleOptions = false;
    Array.from(options).forEach(option => {
        if (option.classList.contains('add-new-option')) return;

        const shouldShow = option.textContent.toLowerCase().includes(searchTerm);
        option.style.display = shouldShow ? 'block' : 'none';
        if (shouldShow) {
            hasVisibleOptions = true;
        }
    });

    if (tipo === 'cliente') {
        const oldAddOption = optionsContainer.querySelector('.add-new-option');
        if (oldAddOption) {
            oldAddOption.remove();
        }

        if (!hasVisibleOptions && searchTerm.length > 0) {
            const addOption = document.createElement('div');
            addOption.classList.add('add-new-option');
            addOption.innerHTML = `+ Cadastrar novo cliente: <strong>${searchTerm}</strong>`;
            addOption.onclick = (event) => {
                openClienteRapidoModal(event);
                document.getElementById('cliente-rapido-nome').value = searchTerm;
            };
            optionsContainer.appendChild(addOption);
        }
    }
}


/**
 * Filtra os cards de venda exibidos na tela.
 */
function filtrarVendas() {
    const filtro = document.getElementById('search-bar').value.toLowerCase();
    const cards = document.querySelectorAll('.sale-card');
    cards.forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(filtro) ? 'flex' : 'none';
    });
}

// ====================
// Inicialização da Aplicação
// ====================

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmarExclusao);

    // Event listeners para formatação e busca de CEP no modal de cadastro rápido
    const rapidoCPF = document.getElementById('cliente-rapido-cpf');
    const rapidoTelefone = document.getElementById('cliente-rapido-telefone');
    const rapidoCEP = document.getElementById('cliente-rapido-cep');
    rapidoCPF.addEventListener('input', (e) => e.target.value = formatCPF(e.target.value));
    rapidoTelefone.addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, ''));
    rapidoCEP.addEventListener('input', (e) => e.target.value = formatCEP(e.target.value));
    rapidoCEP.addEventListener('blur', handleCepLookup);
});