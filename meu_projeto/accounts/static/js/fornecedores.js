/**
 * @fileoverview Gerencia a página de Cadastro de Fornecedores (CRUD).
 * @description Script para controlar o cadastro, listagem, edição, exclusão e
 * busca de fornecedores, comunicando-se com uma API backend.
 */

// Executa o script somente após o carregamento completo do DOM para garantir
// que todos os elementos HTML estejam disponíveis.
document.addEventListener('DOMContentLoaded', function () {

    /**
     * @module SupplierManager
     * @description Módulo que encapsula toda a lógica da página de fornecedores.
     */
    const SupplierManager = {
        // --- 1. Propriedades e Estado ---
        API_URL: '/api/fornecedores/',
        suppliers: [],      // Cache local da lista de fornecedores
        editingLi: null,    // Referência ao <li> em modo de edição
        supplierCnpjToDelete: null, // Armazena o CNPJ do fornecedor a ser excluído
        elements: {},       // Cache de elementos do DOM

        /**
         * @description Ponto de entrada do módulo. Inicia a aplicação.
         */
        init() {
            this.cacheDOM();
            this.bindEvents();
            this.fetchSuppliers();
        },

        /**
         * @description Seleciona e armazena os elementos do DOM mais utilizados para
         * evitar buscas repetidas (melhora a performance).
         */
        cacheDOM() {
            this.elements = {
                form: document.getElementById('supplierForm'),
                list: document.getElementById('list'),
                searchInput: document.getElementById('searchInput'),
                cnpjInput: document.getElementById('cnpj'),
                phoneInput: document.getElementById('phone'),
                cepInput: document.getElementById('cep'),
                popupMsg: document.getElementById('popupMsg'),
                deleteModal: document.getElementById('deleteModal'),
                confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
                cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
                supplierNameToDelete: document.getElementById('supplierNameToDelete'),
                closeDeleteModalBtn: document.querySelector('#deleteModal .close-button'),
            };
        },

        /**
         * @description Vincula todos os eventos de interação do usuário aos seus
         * respectivos handlers (funções de tratamento).
         */
        bindEvents() {
            this.elements.form.addEventListener('submit', this.handleFormSubmit.bind(this));
            this.elements.list.addEventListener('click', this.handleListClick.bind(this));
            this.elements.searchInput.addEventListener('input', this.handleSearch.bind(this));

            // Listeners para formatação e validação de campos
            this.elements.cnpjInput.addEventListener('input', this.allowOnlyNumbers);
            this.elements.phoneInput.addEventListener('input', this.allowOnlyNumbers);
            this.elements.cepInput.addEventListener('input', (e) => e.target.value = this.formatCEP(e.target.value));
            this.elements.cepInput.addEventListener('blur', this.handleCepLookup.bind(this));
            
            // Listeners do Modal de Exclusão
            this.elements.confirmDeleteBtn.addEventListener('click', this.confirmDeletion.bind(this));
            this.elements.cancelDeleteBtn.addEventListener('click', this.closeDeleteModal.bind(this));
            this.elements.closeDeleteModalBtn.addEventListener('click', this.closeDeleteModal.bind(this));
            this.elements.deleteModal.addEventListener('click', (e) => {
                // Fecha o modal se o clique for no overlay (fundo)
                if (e.target === this.elements.deleteModal) this.closeDeleteModal();
            });
        },

        // --- 2. Comunicação com a API ---

        /**
         * @description Busca a lista de fornecedores na API e renderiza na tela.
         */
        async fetchSuppliers() {
            try {
                const response = await fetch(this.API_URL);
                if (!response.ok) throw new Error('Erro ao carregar fornecedores.');
                this.suppliers = await response.json();
                this.renderList(this.suppliers);
            } catch (error) {
                console.error("Erro em fetchSuppliers:", error);
                this.showPopup(error.message, true);
            }
        },

        /**
         * @description Busca dados de um CEP via backend para preenchimento automático.
         * @param {Event} event - O evento de 'blur' do campo de CEP.
         */
        async handleCepLookup(event) {
            const inputElement = event.target;
            const formContainer = inputElement.closest('form');
            if (!formContainer) return;

            const streetField = formContainer.querySelector('[id^="street"], [data-field="endereco"]');
            const cityField = formContainer.querySelector('[id^="city"], [data-field="cidade"]');
            const stateField = formContainer.querySelector('[id^="state"], [data-field="estado"]');
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
                        this.toggleAddressFields(formContainer, false);
                    } else {
                        throw new Error('CEP inválido ou não encontrado.');
                    }
                } catch (error) {
                    console.error("Erro na busca de CEP:", error.message);
                    this.showPopup('CEP não encontrado. Preencha o endereço manualmente.', true);
                    streetField.value = ''; cityField.value = ''; stateField.value = '';
                    this.toggleAddressFields(formContainer, true);
                }
            }
        },

        // --- 3. Manipulação de Eventos ---

        /**
         * @description Gerencia o envio do formulário de cadastro.
         */
        async handleFormSubmit(event) {
            event.preventDefault();
            const supplierData = {
                nome: this.elements.form.querySelector('#name').value.trim(),
                cnpj: this.elements.cnpjInput.value.replace(/\D/g, ''),
                email: this.elements.form.querySelector('#email').value.trim(),
                telefone: this.elements.phoneInput.value.replace(/\D/g, ''),
                cep: this.elements.cepInput.value.replace(/\D/g, ''),
                endereco: this.elements.form.querySelector('#street').value.trim(),
                cidade: this.elements.form.querySelector('#city').value.trim(),
                estado: this.elements.form.querySelector('#state').value.trim()
            };

            try {
                const response = await fetch(this.API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCookie('csrftoken') },
                    body: JSON.stringify(supplierData),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Erro desconhecido ao cadastrar.');
                
                this.showPopup('Fornecedor cadastrado com sucesso!');
                this.elements.form.reset();
                this.toggleAddressFields(this.elements.form, false);
                this.fetchSuppliers();
            } catch (error) {
                this.showPopup(error.message, true);
            }
        },

        /**
         * @description Delega eventos de clique na lista para as ações correspondentes.
         */
        handleListClick(event) {
            const target = event.target;
            const li = target.closest('li[data-cnpj]');
            if (!li) return;
            
            const cnpj = li.dataset.cnpj;
            const supplier = this.suppliers.find(s => s.cnpj === cnpj);

            if (target.matches('.edit, .edit *')) this.startEdit(li, supplier);
            else if (target.matches('.delete, .delete *')) this.openDeleteModal(cnpj, supplier.nome);
            else if (target.matches('.save, .save *')) this.saveChanges(cnpj, li);
            else if (target.matches('.cancel, .cancel *')) this.cancelEdit(li);
        },

        /**
         * @description Filtra a lista de fornecedores em tempo real.
         */
        handleSearch() {
            const searchTerm = this.elements.searchInput.value.toLowerCase();
            const filtered = this.suppliers.filter(s => 
                s.nome.toLowerCase().includes(searchTerm) || 
                s.cnpj.includes(searchTerm)
            );
            this.renderList(filtered);
        },

        // --- 4. Renderização e Manipulação da UI ---

        renderList(items) {
            this.elements.list.innerHTML = '';
            if (items.length === 0) {
                this.elements.list.innerHTML = '<li>Nenhum fornecedor encontrado.</li>';
                return;
            }
            items.forEach(supplier => {
                const li = document.createElement('li');
                li.dataset.cnpj = supplier.cnpj;
                li.innerHTML = this.createSupplierCardHTML(supplier);
                this.elements.list.appendChild(li);
            });
        },
        
        createSupplierCardHTML(supplier) {
            return `
                <div class="supplier-details">
                    <div class="detail-item"><span class="label">Nome:</span><span>${supplier.nome}</span></div>
                    <div class="detail-item"><span class="label">CNPJ:</span><span>${supplier.cnpj}</span></div>
                    <div class="detail-item"><span class="label">E-mail:</span><span>${supplier.email}</span></div>
                    <div class="detail-item"><span class="label">Telefone:</span><span>${supplier.telefone}</span></div>
                    <div class="detail-item"><span class="label">Endereço:</span><span>${supplier.endereco}, ${supplier.cidade} - ${supplier.estado}, CEP: ${this.formatCEP(supplier.cep)}</span></div>
                </div>
                <div class="action-icons">
                    <i class="fas fa-edit edit" title="Editar"></i>
                    <i class="fas fa-trash delete" title="Excluir"></i>
                </div>
                <div class="edit-form-container"></div>
            `;
        },

        startEdit(li, supplier) {
            if (this.editingLi) this.cancelEdit(this.editingLi);
            this.editingLi = li;
            li.classList.add('editing');
            
            const formHTML = `
                <form>
                    <div class="edit-field"><label>Nome:</label><input type="text" data-field="nome" value="${supplier.nome}"></div>
                    <div class="edit-field"><label>Email:</label><input type="email" data-field="email" value="${supplier.email}"></div>
                    <div class="edit-field"><label>Telefone:</label><input type="text" data-field="telefone" value="${supplier.telefone}"></div>
                    <div class="edit-field"><label>CEP:</label><input type="text" data-field="cep" value="${this.formatCEP(supplier.cep)}"></div>
                    <div class="edit-field"><label>Endereço:</label><input type="text" data-field="endereco" value="${supplier.endereco}"></div>
                    <div class="edit-field"><label>Cidade:</label><input type="text" data-field="cidade" value="${supplier.cidade}" readonly></div>
                    <div class="edit-field"><label>Estado:</label><input type="text" data-field="estado" value="${supplier.estado}" readonly></div>
                    <div class="edit-buttons">
                        <button type="button" class="save"><i class="fas fa-check"></i> Salvar</button>
                        <button type="button" class="cancel"><i class="fas fa-times"></i> Cancelar</button>
                    </div>
                </form>
            `;
            li.querySelector('.edit-form-container').innerHTML = formHTML;
            
            // Adiciona listeners aos campos do formulário de edição
            const cepEditInput = li.querySelector('[data-field="cep"]');
            cepEditInput.addEventListener('input', (e) => e.target.value = this.formatCEP(e.target.value));
            cepEditInput.addEventListener('blur', this.handleCepLookup.bind(this));
            li.querySelector('[data-field="telefone"]').addEventListener('input', this.allowOnlyNumbers);
        },

        cancelEdit(li) {
            li.classList.remove('editing');
            li.querySelector('.edit-form-container').innerHTML = '';
            this.editingLi = null;
        },
        
        async saveChanges(cnpj, li) {
            const updatedData = {
                nome: li.querySelector('[data-field="nome"]').value.trim(),
                email: li.querySelector('[data-field="email"]').value.trim(),
                telefone: li.querySelector('[data-field="telefone"]').value.replace(/\D/g, ''),
                cep: li.querySelector('[data-field="cep"]').value.replace(/\D/g, ''),
                endereco: li.querySelector('[data-field="endereco"]').value.trim(),
                cidade: li.querySelector('[data-field="cidade"]').value.trim(),
                estado: li.querySelector('[data-field="estado"]').value.trim()
            };

            try {
                const response = await fetch(`${this.API_URL}${cnpj}/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCookie('csrftoken') },
                    body: JSON.stringify(updatedData),
                });
                if (!response.ok) throw new Error((await response.json()).error || 'Erro ao salvar.');
                this.showPopup('Fornecedor atualizado com sucesso!');
                this.fetchSuppliers();
            } catch (error) {
                this.showPopup(error.message, true);
                this.cancelEdit(li);
            }
        },

        // --- 5. Lógica do Modal de Exclusão ---

        openDeleteModal(cnpj, name) {
            this.supplierCnpjToDelete = cnpj;
            this.elements.supplierNameToDelete.textContent = name;
            this.elements.deleteModal.style.display = 'flex';
        },

        closeDeleteModal() {
            this.elements.deleteModal.style.display = 'none';
            this.supplierCnpjToDelete = null;
        },
        
        async confirmDeletion() {
            if (this.supplierCnpjToDelete) {
                try {
                    const response = await fetch(`${this.API_URL}${this.supplierCnpjToDelete}/`, {
                        method: 'DELETE',
                        headers: { 'X-CSRFToken': this.getCookie('csrftoken') }
                    });
                    if (response.status !== 204) {
                        const result = await response.json();
                        throw new Error(result.error || 'Erro ao excluir.');
                    }
                    this.showPopup('Fornecedor excluído com sucesso!');
                    this.fetchSuppliers();
                } catch (error) {
                    this.showPopup(`Erro ao excluir: ${error.message}`, true);
                }
            }
            this.closeDeleteModal();
        },

        // --- 6. Funções Utilitárias ---
        
        showPopup(message, isError = false) {
            const icon = isError ? '<i class="fas fa-times-circle"></i>' : '<i class="fas fa-check-circle"></i>';
            this.elements.popupMsg.innerHTML = `${icon} ${message}`;
            this.elements.popupMsg.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
            this.elements.popupMsg.classList.add('show');
            setTimeout(() => this.elements.popupMsg.classList.remove('show'), 2000);
        },
        
        toggleAddressFields(formContainer, enableManual) {
            const cityField = formContainer.querySelector('[id^="city"], [data-field="cidade"]');
            const stateField = formContainer.querySelector('[id^="state"], [data-field="estado"]');
            cityField.readOnly = !enableManual;
            stateField.readOnly = !enableManual;
            cityField.placeholder = enableManual ? 'Digite a cidade' : 'Preenchimento automático';
            stateField.placeholder = enableManual ? 'Digite o estado (UF)' : 'Preenchimento automático';
        },
        
        allowOnlyNumbers: (event) => { event.target.value = event.target.value.replace(/\D/g, ''); },
        formatCEP: (cep) => cep ? cep.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2') : "",
        getCookie(name) {
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
        },
    };

    // Inicia a aplicação.
    SupplierManager.init();
});