const scriptTag = document.querySelector('script[data-produtos-url]');
const API_URLS = {
    produtos: scriptTag.getAttribute('data-produtos-url'),
    produtos_exportar: scriptTag.getAttribute('data-produtos-exportar-url'),
    fornecedores: scriptTag.getAttribute('data-fornecedores-url'),
    historico_notas: scriptTag.getAttribute('data-historico-notas-url')
};
const CSRF_TOKEN = scriptTag.getAttribute('data-csrf-token');

let fornecedores = [];
let notasFiscais = [];
const API_URL = API_URLS.produtos;
const API_FORNECEDORES_URL = API_URLS.fornecedores;
const API_NOTAS_FISCAIS_URL = API_URLS.historico_notas;

let currentPage = 1;
const itemsPerPage = 6;
let isLoading = false;
let currentSearchTerm = '';
let selectedProductId = null;

function allowOnlyNumbers(event) {
    event.target.value = event.target.value.replace(/\D/g, '');
}

function formatCEP(cep) {
    if (!cep) return "";
    return cep.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
}

function toggleAddressFields(formContainer, enableManual) {
    const cityField = formContainer.querySelector('[id*="city"]');
    const stateField = formContainer.querySelector('[id*="state"]');
    if (cityField && stateField) {
        cityField.readOnly = !enableManual;
        stateField.readOnly = !enableManual;
        cityField.placeholder = enableManual ? 'Digite a cidade' : 'Preenchimento automático';
        stateField.placeholder = enableManual ? 'Digite o estado (UF)' : 'Preenchimento automático';
    }
}

async function handleCepLookup(event) {
    const inputElement = event.target;
    const formContainer = inputElement.closest('form');
    if (!formContainer) return;

    const streetField = formContainer.querySelector('#quick-add-street');
    const cityField = formContainer.querySelector('#quick-add-city');
    const stateField = formContainer.querySelector('#quick-add-state');
    const cep = inputElement.value.replace(/\D/g, '');

    if (cep.length === 8) {
        try {
            const response = await fetch(`/api/buscar_cep/${cep}/`);
            if (!response.ok) throw new Error('CEP não encontrado na API.');
            const data = await response.json();
            
            if (data.success) {
                streetField.value = data.endereco;
                cityField.value = data.cidade;
                stateField.value = data.estado;
                toggleAddressFields(formContainer, false);
            } else {
                showToastMessage('CEP não encontrado. Preencha o endereço manualmente.', 'error');
                streetField.value = '';
                cityField.value = '';
                stateField.value = '';
                toggleAddressFields(formContainer, true);
            }
        } catch (error) {
            console.error("Erro na busca de CEP:", error.message);
            showToastMessage('Erro ao buscar CEP. Preencha o endereço manualmente.', 'error');
            streetField.value = '';
            cityField.value = '';
            stateField.value = '';
            toggleAddressFields(formContainer, true);
        }
    }
}

function openModal(edit = false) {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'flex';
    const form = document.getElementById('product-form');
    form.reset();
    document.getElementById('fornecedor-cnpj-hidden').value = '';
    const modalTitle = modal.querySelector('h2');

    document.getElementById('product-suggestions').innerHTML = '';
    document.getElementById('product-suggestions').style.display = 'none';

    if (edit) {
        modalTitle.textContent = "Editar Produto";
        form.querySelector('button[type="submit"]').textContent = "Salvar Alterações";
        document.getElementById('quantidade-input').placeholder = "Adicionar mais (opcional)";
        document.getElementById('nota_fiscal-input').placeholder = "Obrigatório se adicionar qtd.";

    } else {
        modalTitle.textContent = "Adicionar Produto";
        form.querySelector('button[type="submit"]').textContent = "Adicionar Produto";
        document.getElementById('product-id').value = '';
        document.getElementById('quantidade-input').placeholder = "Ex: 10";
    }
    document.getElementById('fornecedor-warning').style.display = 'none';
}

function closeModal() {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'none';
}

function openConfirmModal(ids, isBulk = false) {
    const modal = document.getElementById('confirm-modal');
    const modalText = document.getElementById('confirm-modal-text');
    modal.style.display = 'flex';
    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (isBulk) {
        modalText.textContent = `Tem certeza que deseja excluir ${ids.length} produto(s)? Essa ação não pode ser desfeita.`;
        confirmBtn.onclick = () => {
            excluirMultiplosProdutos(ids);
            closeConfirmModal();
        };
    } else {
        modalText.textContent = "Tem certeza que deseja excluir este produto? Essa ação não pode ser desfeita.";
        confirmBtn.onclick = () => {
            excluirProduto(ids);
            closeConfirmModal();
        };
    }
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'none';
}

function openFornecedorModal() {
    const modal = document.getElementById('fornecedor-modal');
    modal.style.display = 'flex';
    document.getElementById('fornecedor-form').reset();
}

function closeFornecedorModal() {
    const modal = document.getElementById('fornecedor-modal');
    const form = document.getElementById('fornecedor-form');
    modal.style.display = 'none';
    form.reset();
    toggleAddressFields(form, false);
}

async function adicionarFornecedor(event) {
    event.preventDefault();

    const form = document.getElementById('fornecedor-form');
    const nome = form.querySelector('#quick-add-nome').value.trim();
    const cnpj = form.querySelector('#quick-add-cnpj').value.trim().replace(/\D/g, '');
    const email = form.querySelector('#quick-add-email').value.trim();
    const telefone = form.querySelector('#quick-add-telefone').value.trim().replace(/\D/g, '');
    const cep = form.querySelector('#quick-add-cep').value.trim().replace(/\D/g, '');
    const endereco = form.querySelector('#quick-add-street').value.trim();
    const cidade = form.querySelector('#quick-add-city').value.trim();
    const estado = form.querySelector('#quick-add-state').value.trim();

    if (!nome || !cnpj || !email || !telefone || !cep || !endereco || !cidade || !estado) {
        showToastMessage('Preencha todos os campos do fornecedor.', 'error');
        return;
    }

    const fornecedorData = { nome, cnpj, email, telefone, endereco, cep, cidade, estado };

    try {
        const response = await fetch(API_FORNECEDORES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
            body: JSON.stringify(fornecedorData),
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.error || 'Erro ao cadastrar fornecedor.');
        }

        showToastMessage('Fornecedor adicionado com sucesso!', 'success');
        closeFornecedorModal();
        await carregarFornecedores();
        selectFornecedor(resultado);
    } catch (error) {
        console.error("Erro ao adicionar fornecedor:", error);
        showToastMessage(`Erro: ${error.message}`, 'error');
    }
}

function formatPrice(event) {
    let input = event.target;
    let value = input.value.replace(/\D/g, '');
    if (value.length < 3) value = value.padStart(3, '0');
    let formatted = "R$ " + (parseInt(value) / 100).toFixed(2).replace('.', ',');
    input.value = formatted;
}

function parsePrice(priceString) {
    if (!priceString) return 0;
    return parseFloat(priceString.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
}

async function carregarFornecedores() {
    try {
        const response = await fetch(API_FORNECEDORES_URL);
        if (!response.ok) throw new Error('Erro ao carregar fornecedores');
        fornecedores = await response.json();
    } catch (error) {
        console.error("Erro ao carregar fornecedores:", error);
    }
}

async function carregarProdutos(page = 1, searchTerm = '') {
    if (isLoading) return;
    isLoading = true;
    currentSearchTerm = searchTerm;
    currentPage = page;

    let url = `${API_URL}?page=${page}`;
    if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.statusText}`);
        }
        const data = await response.json();

        if (data.produtos.length === 0 && data.total_pages > 0 && page > 1) {
            await carregarProdutos(data.total_pages, searchTerm);
            return;
        }

        atualizarTabela(data.produtos);
        renderPagination(data.total_pages, data.current_page);
        updateButtonVisibility();
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        const tbody = document.getElementById('product-table-body');
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Não foi possível carregar os produtos.</td></tr>`;
    }
    isLoading = false;
}

async function adicionarProduto(event) {
    event.preventDefault();
    const form = event.target;
    const id = document.getElementById('product-id').value;
    const nome = form.nome.value.trim();
    const quantidade_adicionada = form.quantidade.value.trim();
    const quantidade_minima = form.quantidade_minima.value.trim() || '0';
    const preco_compra_str = form.preco_compra.value.trim();
    const preco_venda_str = form.preco_venda.value.trim();
    const nota_fiscal = form.nota_fiscal.value.trim();
    const fornecedor_cnpj = document.getElementById('fornecedor-cnpj-hidden').value;

    const warningElement = document.getElementById('fornecedor-warning');
    if (!fornecedor_cnpj) {
        warningElement.style.display = 'block';
        return;
    } else {
        warningElement.style.display = 'none';
    }
    
    const quantidade_adicionada_int = parseInt(quantidade_adicionada, 10);
    if (quantidade_adicionada_int > 0 && !nota_fiscal) {
        showToastMessage("A Nota Fiscal é obrigatória ao adicionar estoque.", 'error');
        return;
    }

    if (!nome || !preco_compra_str || !preco_venda_str) {
        showToastMessage("Preencha todos os campos obrigatórios.");
        return;
    }

    const preco_compra = parsePrice(preco_compra_str);
    const preco_venda = parsePrice(preco_venda_str);
    const quantidade_minima_int = parseInt(quantidade_minima, 10);

    if (isNaN(quantidade_adicionada_int) || quantidade_adicionada_int < 0) {
        showToastMessage("A quantidade a adicionar deve ser um número válido.", 'error');
        return;
    }

    try {
        let message;
        if (id) {
            const produtoData = {
                nome,
                quantidade_minima: quantidade_minima_int,
                preco_compra,
                preco_venda,
                fornecedor_cnpj
            };
            const produtoResponse = await fetch(`${API_URL}${id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
                body: JSON.stringify(produtoData),
            });
            if (!produtoResponse.ok) {
                const errorData = await produtoResponse.json();
                throw new Error(errorData.error || 'Erro ao atualizar produto.');
            }

            if (quantidade_adicionada_int > 0) {
                const noteData = {
                    produto_id: id,
                    numero_nota: nota_fiscal,
                    quantidade_adicionada: quantidade_adicionada_int,
                    preco_compra_nota: preco_compra,
                    preco_venda_nota: preco_venda
                };
                const noteResponse = await fetch(API_NOTAS_FISCAIS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
                    body: JSON.stringify(noteData)
                });
                if (!noteResponse.ok) {
                    const errorData = await noteResponse.json();
                    throw new Error(errorData.error || 'Erro ao adicionar nota fiscal.');
                }
            }
            message = 'Produto e/ou estoque atualizado com sucesso!';
        } else {
            const produtoData = {
                nome,
                quantidade: quantidade_adicionada_int,
                quantidade_minima: quantidade_minima_int,
                preco_compra,
                preco_venda,
                fornecedor_cnpj,
                nota_fiscal
            };
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
                body: JSON.stringify(produtoData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao adicionar produto.');
            }
            message = 'Produto adicionado com sucesso!';
        }
        await carregarProdutos(currentPage, currentSearchTerm);
        closeModal();
        showToastMessage(message, 'success');
    } catch (error) {
        console.error(error);
        showToastMessage(`Erro: ${error.message}`, 'error');
    }
}

function atualizarTabela(produtos) {
    const tbody = document.getElementById('product-table-body');
    tbody.innerHTML = '';
    if (produtos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Nenhum produto encontrado.</td></tr>`;
        return;
    }
    produtos.forEach(produto => {
        const tr = document.createElement('tr');
        tr.dataset.id = produto.id;
        const precoCompraFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco_compra);
        const precoVendaFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco_venda);
        const quantidadeAtual = parseInt(produto.quantidade, 10);
        const quantidadeMinima = parseInt(produto.quantidade_minima, 10);
        if (!isNaN(quantidadeMinima) && quantidadeAtual <= quantidadeMinima) {
            tr.classList.add('low-stock-row');
        }
        const nomeFornecedor = produto.fornecedor && produto.fornecedor.nome ? produto.fornecedor.nome : 'N/A';
        tr.innerHTML = `
            <td>${String(produto.id).substring(0, 6)}</td>
            <td>${produto.nome}</td>
            <td>${produto.quantidade}</td>
            <td>${precoCompraFormatado}</td>
            <td>${precoVendaFormatado}</td>
            <td>${nomeFornecedor}</td>
            <td>${produto.last_nota_fiscal ? produto.last_nota_fiscal.numero_nota : 'N/A'}</td>
            <td class="actions">
                <a href="#" class="notes" onclick="openNotesModalForProduct('${produto.id}')" title="Ver Notas"><i class="fas fa-clipboard-list"></i></a>
                <a href="#" class="edit" onclick="abrirEdicao('${produto.id}')" title="Editar"><i class="fas fa-edit"></i></a>
                <a href="#" class="delete" onclick="openConfirmModal('${produto.id}')" title="Excluir"><i class="fas fa-trash-alt"></i></a>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) {
        return;
    }

    const prevBtn = document.createElement('button');
    prevBtn.classList.add('pagination-btn');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => carregarProdutos(currentPage - 1, currentSearchTerm);
    prevBtn.classList.toggle('disabled', prevBtn.disabled);
    paginationContainer.appendChild(prevBtn);

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (endPage - startPage < 4) {
        if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
        if (endPage === totalPages) startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
        const firstPageBtn = document.createElement('button');
        firstPageBtn.classList.add('pagination-btn');
        firstPageBtn.textContent = 1;
        firstPageBtn.onclick = () => carregarProdutos(1, currentSearchTerm);
        paginationContainer.appendChild(firstPageBtn);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.classList.add('pagination-btn');
        pageBtn.textContent = i;
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.onclick = () => carregarProdutos(i, currentSearchTerm);
        paginationContainer.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
        const lastPageBtn = document.createElement('button');
        lastPageBtn.classList.add('pagination-btn');
        lastPageBtn.textContent = totalPages;
        lastPageBtn.onclick = () => carregarProdutos(totalPages, currentSearchTerm);
        paginationContainer.appendChild(lastPageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.classList.add('pagination-btn');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => carregarProdutos(currentPage + 1, currentSearchTerm);
    nextBtn.classList.toggle('disabled', nextBtn.disabled);
    paginationContainer.appendChild(nextBtn);
}

function filtrarProdutos() {
    const filtro = document.getElementById('search-bar').value;
    carregarProdutos(1, filtro);
}

async function abrirEdicao(id) {
    try {
        const response = await fetch(`${API_URL}${id}/`);
        if (!response.ok) {
            throw new Error('Produto não encontrado.');
        }
        const produto = await response.json();
        openModal(true);
        const form = document.getElementById('product-form');
        
        document.getElementById('product-id').value = produto.id;
        document.getElementById('nome-input').value = produto.nome;
        document.getElementById('quantidade-input').value = '';
        document.getElementById('quantidade-input').placeholder = `Estoque Atual: ${produto.quantidade}. Adicionar mais?`;
        document.getElementById('quantidade-minima-input').value = produto.quantidade_minima;
        
        const precoCompraFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco_compra);
        const precoVendaFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco_venda);
        document.getElementById('preco_compra-input').value = precoCompraFormatado;
        document.getElementById('preco_venda-input').value = precoVendaFormatado;
        
        document.getElementById('nota_fiscal-input').value = '';
        document.getElementById('nota_fiscal-input').required = false;
        
        if (produto.fornecedor) {
            document.getElementById('fornecedor-search').value = produto.fornecedor.nome;
            document.getElementById('fornecedor-cnpj-hidden').value = produto.fornecedor.cnpj;
        }
    } catch (error) {
        showToastMessage(error.message, 'error');
    }
}

async function excluirProduto(id) {
    try {
        const response = await fetch(`${API_URL}${id}/`, { method: 'DELETE', headers: { 'X-CSRFToken': CSRF_TOKEN } });
        if (response.status === 204) {
            showToastMessage('Produto excluído com sucesso!', 'success');
            await carregarProdutos(currentPage, currentSearchTerm);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao excluir produto');
        }
    } catch (error) {
        showToastMessage(`Erro ao excluir produto: ${error.message}`, 'error');
    }
}

async function excluirMultiplosProdutos(ids) {
    const deletePromises = ids.map(id =>
        fetch(`${API_URL}${id}/`, { method: 'DELETE', headers: { 'X-CSRFToken': CSRF_TOKEN } })
    );
    const results = await Promise.all(deletePromises);
    const successCount = results.filter(res => res.status === 204).length;
    if (successCount > 0) showToastMessage(`${successCount} produto(s) excluído(s) com sucesso.`);
    if (successCount < ids.length) showToastMessage(`${ids.length - successCount} produto(s) não puderam ser excluído(s).`);
    await carregarProdutos(currentPage, currentSearchTerm);
}

function updateButtonVisibility() {
    const selectedRows = document.querySelectorAll('#product-table-body tr.selected');
    const deleteButton = document.getElementById('delete-selected-btn');
    const selectedCount = selectedRows.length;
    deleteButton.style.display = 'none';
    document.getElementById('export-btn').style.display = 'flex';
    document.getElementById('add-btn').style.display = 'flex';
    if (selectedCount > 0) {
        deleteButton.style.display = 'flex';
        document.getElementById('export-btn').style.display = 'none';
        document.getElementById('add-btn').style.display = 'none';
    }
}

function setupMultiDelete() {
    document.getElementById('delete-selected-btn').addEventListener('click', () => {
        const selectedIds = Array.from(document.querySelectorAll('#product-table-body tr.selected')).map(tr => tr.dataset.id);
        if (selectedIds.length > 0) openConfirmModal(selectedIds, true);
        else showToastMessage('Nenhum produto selecionado para exclusão.');
    });
}

function setupRowSelection() {
    document.getElementById('product-table-body').addEventListener('click', function (event) {
        if (event.target.closest('.actions')) return;
        const row = event.target.closest('tr');
        if (row) {
            row.classList.toggle('selected');
            updateButtonVisibility();
        }
    });
}

function deselectAllRows() {
    document.querySelectorAll('#product-table-body tr.selected').forEach(row => row.classList.remove('selected'));
    updateButtonVisibility();
}

function setupClickOutsideDeselect() {
    document.addEventListener('click', function (event) {
        const tableContainer = document.querySelector('.table-container');
        const header = document.querySelector('.header');
        if (!tableContainer.contains(event.target) && !header.contains(event.target) && !event.target.closest('.modal')) {
            deselectAllRows();
        }
    });
}

function showToastMessage(message, type = 'success') {
    const toast = document.getElementById("toast-message");
    toast.textContent = message;
    toast.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
    toast.className = "toast-message show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 1000);
}

function setupFornecedorSearch() {
    const searchInput = document.getElementById('fornecedor-search');
    const suggestionsList = document.getElementById('fornecedor-suggestions');
    const hiddenCnpj = document.getElementById('fornecedor-cnpj-hidden');
    let activeIndex = -1;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        suggestionsList.innerHTML = '';
        hiddenCnpj.value = '';
        activeIndex = -1;

        if (query.length > 0) {
            const matches = fornecedores.filter(f => f.nome.toLowerCase().includes(query));
            matches.forEach(fornecedor => {
                const li = document.createElement('li');
                li.textContent = fornecedor.nome;
                li.onclick = () => selectFornecedor(fornecedor);
                suggestionsList.appendChild(li);
            });
            if (matches.length === 0) {
                const li = document.createElement('li');
                li.innerHTML = `Cadastrar: <strong>${searchInput.value}</strong>`;
                li.onclick = () => { document.getElementById('quick-add-nome').value = searchInput.value; openFornecedorModal(); };
                suggestionsList.appendChild(li);
            }
            suggestionsList.style.display = 'block';
        } else {
            suggestionsList.style.display = 'none';
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        const items = suggestionsList.querySelectorAll('li');
        if (items.length === 0) return;

        const updateHighlight = () => {
            items.forEach((item, index) => {
                if (index === activeIndex) {
                    item.classList.add('highlighted');
                    item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else {
                    item.classList.remove('highlighted');
                }
            });
        };

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex++;
            if (activeIndex >= items.length) activeIndex = 0;
            updateHighlight();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex--;
            if (activeIndex < 0) activeIndex = items.length - 1;
            updateHighlight();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex > -1 && items[activeIndex]) {
                items[activeIndex].click();
            }
        }
    });
    
    // ADICIONADO: Evento de 'blur' para fechar a lista de sugestões de fornecedor
    searchInput.addEventListener('blur', () => {
        // Usamos um pequeno timeout para permitir que o clique na sugestão seja processado
        setTimeout(() => {
            suggestionsList.style.display = 'none';
        }, 150);
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.autocomplete-container')) {
            suggestionsList.style.display = 'none';
        }
    });
}

function selectFornecedor(fornecedor) {
    document.getElementById('fornecedor-search').value = fornecedor.nome;
    document.getElementById('fornecedor-cnpj-hidden').value = fornecedor.cnpj;
    document.getElementById('fornecedor-suggestions').style.display = 'none';
    const warningElement = document.getElementById('fornecedor-warning');
    if (warningElement) warningElement.style.display = 'none';
}

function exportarPlanilha() {
    window.location.href = API_URLS.produtos_exportar;
}

async function openNotesModalForProduct(productId) {
    selectedProductId = productId;
    const modal = document.getElementById('notes-modal');
    modal.style.display = 'flex';
    try {
        const response = await fetch(`${API_NOTAS_FISCAIS_URL}?produto_id=${productId}`);
        if (!response.ok) throw new Error('Erro ao carregar notas.');
        notasFiscais = await response.json();
        renderNotesTable();
    } catch (error) {
        showToastMessage('Erro ao carregar notas fiscais.', 'error');
        console.error('Erro detalhado ao carregar notas:', error);
    }
}

function closeNotesModal() {
    document.getElementById('notes-modal').style.display = 'none';
}

function openNoteConfirmModal(noteIds, isBulk = true) {
    const modal = document.getElementById('note-confirm-modal');
    modal.style.display = 'flex';
    document.getElementById('note-confirm-modal-text').textContent = `Tem certeza que deseja excluir ${noteIds.length} nota(s) fiscal(is)? Essa ação não pode ser desfeita.`;
    document.getElementById('note-confirm-delete-btn').onclick = () => {
        excluirMultiplasNotas(noteIds);
        closeNoteConfirmModal();
    };
}

function closeNoteConfirmModal() {
    document.getElementById('note-confirm-modal').style.display = 'none';
}

function renderNotesTable() {
    const tbody = document.getElementById('notes-table-body');
    tbody.innerHTML = '';
    if (notasFiscais.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhuma nota fiscal registrada.</td></tr>`;
        return;
    }
    notasFiscais.forEach(nota => {
        const tr = document.createElement('tr');
        tr.dataset.id = nota.id;
        tr.classList.add('note-select-row');
        const dataFormatada = new Date(nota.data_entrada).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        tr.innerHTML = `
            <td><input type="checkbox" class="note-select-checkbox" data-note-id="${nota.id}" onclick="event.stopPropagation()"></td>
            <td>${nota.numero_nota}</td>
            <td>${nota.quantidade_adicionada}</td>
            <td>${dataFormatada}</td>`;
        tbody.appendChild(tr);
    });
    setupNotesSelection();
}

function setupNotesSelection() {
    const noteRows = document.querySelectorAll('.note-select-row');
    noteRows.forEach(row => {
        row.addEventListener('click', () => {
            const checkbox = row.querySelector('.note-select-checkbox');
            checkbox.checked = !checkbox.checked;
            updateNotesDeleteButton();
        });
    });

    document.getElementById('delete-selected-notes-btn').addEventListener('click', () => {
        const selectedIds = Array.from(document.querySelectorAll('.note-select-checkbox:checked')).map(cb => cb.dataset.noteId);
        if (selectedIds.length > 0) openNoteConfirmModal(selectedIds, true);
    });
}

function updateNotesDeleteButton() {
    const selectedCount = document.querySelectorAll('.note-select-checkbox:checked').length;
    document.getElementById('delete-selected-notes-btn').style.display = selectedCount > 0 ? 'flex' : 'none';
}

async function excluirMultiplasNotas(ids) {
    for (const id of ids) {
        const url = `${API_NOTAS_FISCAIS_URL}${id}/`;
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'X-CSRFToken': CSRF_TOKEN }
            });
            if (response.ok && response.status === 204) {
                showToastMessage(`Nota fiscal (ID: ${id}) excluída com sucesso!`, 'success');
            } else {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData ? errorData.error : `Erro ${response.status}: ${response.statusText}`;
                showToastMessage(`Falha ao excluir nota (ID: ${id}): ${errorMessage}`, 'error');
            }
        } catch (error) {
            showToastMessage(`Erro de conexão ao excluir nota (ID: ${id}).`, 'error');
        }
    }
    await carregarProdutos(currentPage, currentSearchTerm);
    if (selectedProductId) {
        await openNotesModalForProduct(selectedProductId);
    }
}

function setupProductSearch() {
    const searchInput = document.getElementById('nome-input');
    const suggestionsList = document.getElementById('product-suggestions');
    let activeIndex = -1;

    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.toLowerCase();
        suggestionsList.innerHTML = '';
        activeIndex = -1;

        if (query.length > 0) {
            try {
                const response = await fetch(`${API_URL}?search=${encodeURIComponent(query)}`);
                const data = await response.json();
                const allProducts = data.produtos;
                
                if (allProducts.length > 0) {
                    allProducts.forEach(produto => {
                        const li = document.createElement('li');
                        li.textContent = produto.nome;
                        li.onclick = () => selectProductToEdit(produto.id);
                        suggestionsList.appendChild(li);
                    });
                    suggestionsList.style.display = 'block';
                } else {
                    suggestionsList.style.display = 'none';
                }
            } catch (error) {
                console.error("Erro na busca de produtos para autocomplete:", error);
                suggestionsList.style.display = 'none';
            }
        } else {
            suggestionsList.style.display = 'none';
        }
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            suggestionsList.style.display = 'none';
        }, 150);
    });

    searchInput.addEventListener('keydown', (e) => {
        const items = suggestionsList.querySelectorAll('li');
        if (items.length === 0) return;

        const updateHighlight = () => {
            items.forEach((item, index) => {
                if (index === activeIndex) {
                    item.classList.add('highlighted');
                    item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else {
                    item.classList.remove('highlighted');
                }
            });
        };

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex++;
            if (activeIndex >= items.length) {
                activeIndex = 0;
            }
            updateHighlight();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex--;
            if (activeIndex < 0) {
                activeIndex = items.length - 1;
            }
            updateHighlight();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex > -1 && items[activeIndex]) {
                items[activeIndex].click();
            }
        }
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.autocomplete-container')) {
            suggestionsList.style.display = 'none';
        }
    });
}
    
function selectProductToEdit(productId) {
    document.getElementById('product-suggestions').style.display = 'none';
    abrirEdicao(productId);
}

async function initialize() {
    await carregarFornecedores();
    await carregarProdutos();
    setupFornecedorSearch();
    setupProductSearch();
    setupMultiDelete();
    setupRowSelection();
    setupClickOutsideDeselect();
    
    document.getElementById('search-bar').addEventListener('focus', deselectAllRows);
    document.getElementById('search-bar').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            filtrarProdutos();
        }
    });
    
    document.getElementById('quick-add-cnpj').addEventListener('input', allowOnlyNumbers);
    document.getElementById('quick-add-telefone').addEventListener('input', allowOnlyNumbers);
    const quickAddCep = document.getElementById('quick-add-cep');
    quickAddCep.addEventListener('input', (e) => e.target.value = formatCEP(e.target.value));
    quickAddCep.addEventListener('blur', handleCepLookup);
}

window.addEventListener('load', initialize);