/**
 * @fileoverview Gerencia a página de Cadastro de Clientes (CRUD).
 * @description Este script controla o formulário de cadastro, a listagem, edição,
 * exclusão e busca de clientes, comunicando-se com uma API backend.
 * Inclui funcionalidades de máscara de campos, busca de CEP e feedback ao usuário.
 */

// Padrão de execução segura: o script só roda após o DOM estar completamente carregado.
document.addEventListener('DOMContentLoaded', function () {

    /**
     * @module ClientManager
     * @description Módulo que encapsula toda a lógica da página de clientes para
     * evitar a poluição do escopo global e organizar o código.
     */
    const ClientManager = {
        // --- 1. Propriedades e Estado ---
        // URL da API para as operações CRUD.
        API_URL: '/api/clientes/',
        // Cache do estado da aplicação (lista de clientes).
        clients: [],
        // Referência ao item da lista que está sendo editado no momento.
        editingLi: null,
        // Referência ao CPF do cliente a ser deletado.
        clientCpfToDelete: null,

        // Cache das referências aos elementos do DOM para melhor performance.
        elements: {},

        /**
         * @description Ponto de entrada do módulo. Inicia o cache de elementos e os event listeners.
         */
        init() {
            this.cacheDOM();
            this.bindEvents();
            this.fetchClients();
        },

        /**
         * @description Seleciona e armazena os elementos do DOM mais utilizados.
         */
        cacheDOM() {
            this.elements = {
                form: document.getElementById('clientForm'),
                list: document.getElementById('list'),
                searchInput: document.getElementById('searchInput'),
                cpfInput: document.getElementById('cpf'),
                phoneInput: document.getElementById('phone'),
                cepInput: document.getElementById('cep'),
                popupMsg: document.getElementById('popupMsg'),
                deleteModal: document.getElementById('deleteModal'),
                clientNameToDelete: document.getElementById('clientNameToDelete'),
                confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
                cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
                closeDeleteModalBtn: document.querySelector('#deleteModal .close-button'),
            };
        },

        /**
         * @description Adiciona todos os event listeners necessários para a página.
         */
        bindEvents() {
            this.elements.form.addEventListener('submit', this.handleFormSubmit.bind(this));
            this.elements.list.addEventListener('click', this.handleListClick.bind(this));
            this.elements.searchInput.addEventListener('input', this.handleSearch.bind(this));

            // Listeners para formatação de campos
            this.elements.cpfInput.addEventListener('input', (e) => e.target.value = this.formatCPF(e.target.value));
            this.elements.phoneInput.addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, ''));
            this.elements.cepInput.addEventListener('input', (e) => e.target.value = this.formatCEP(e.target.value));
            this.elements.cepInput.addEventListener('blur', this.handleCepLookup.bind(this));
            
            // Listeners do Modal de Exclusão
            this.elements.confirmDeleteBtn.addEventListener('click', this.confirmDeletion.bind(this));
            this.elements.cancelDeleteBtn.addEventListener('click', this.closeDeleteModal.bind(this));
            this.elements.closeDeleteModalBtn.addEventListener('click', this.closeDeleteModal.bind(this));
            this.elements.deleteModal.addEventListener('click', (e) => {
                if (e.target === this.elements.deleteModal) this.closeDeleteModal();
            });
        },

        // --- 2. Comunicação com a API (Métodos assíncronos) ---

        /**
         * @description Busca a lista de clientes na API.
         */
        async fetchClients() {
            try {
                const response = await fetch(this.API_URL);
                if (!response.ok) throw new Error('Erro ao carregar clientes.');
                this.clients = await response.json();
                this.renderList(this.clients);
            } catch (error) {
                console.error("Erro em fetchClients:", error);
                this.showPopup(error.message, true);
            }
        },

        /**
         * @description Busca dados de um CEP em uma API externa via backend.
         * @param {Event} event - O evento de 'blur' do campo de CEP.
         */
        async handleCepLookup(event) {
            const inputElement = event.target;
            const formContainer = inputElement.closest('form');
            if (!formContainer) return;
            
            // Seletores genéricos para funcionar tanto no form principal quanto no de edição.
            const streetField = formContainer.querySelector('[id^="street"], [data-field="endereco"]');
            const cityField = formContainer.querySelector('[id^="city"], [data-field="cidade"]');
            const stateField = formContainer.querySelector('[id^="state"], [data-field="estado"]');
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
                        this.toggleAddressFields(formContainer, false);
                    } else {
                        this.showPopup('CEP não encontrado. Preencha o endereço manualmente.', true);
                        streetField.value = ''; cityField.value = ''; stateField.value = '';
                        this.toggleAddressFields(formContainer, true);
                    }
                } catch (error) {
                    console.error("Erro na busca de CEP:", error);
                    this.showPopup('Erro ao buscar CEP. Preencha o endereço manualmente.', true);
                    streetField.value = ''; cityField.value = ''; stateField.value = '';
                    this.toggleAddressFields(formContainer, true);
                }
            }
        },
        
        // --- 3. Manipulação de Eventos ---

        /**
         * @description Gerencia o envio do formulário de cadastro de cliente.
         * @param {Event} event - O evento de 'submit'.
         */
        async handleFormSubmit(event) {
            event.preventDefault();
            const clientData = {
                nome: this.elements.form.querySelector('#name').value.trim(),
                cpf: this.elements.cpfInput.value.replace(/\D/g, ''),
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
                    body: JSON.stringify(clientData),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Erro desconhecido ao cadastrar.');

                this.showPopup('Cliente cadastrado com sucesso!');
                this.elements.form.reset();
                this.toggleAddressFields(this.elements.form, false);
                this.fetchClients();
            } catch (error) {
                this.showPopup(error.message, true);
            }
        },
        
        /**
         * @description Delega eventos de clique na lista de clientes para editar, excluir, salvar ou cancelar.
         * @param {Event} event - O evento de 'click'.
         */
        handleListClick(event) {
            const target = event.target;
            const li = target.closest('li[data-cpf]');
            if (!li) return;
            
            const cpf = li.dataset.cpf;
            const client = this.clients.find(c => c.cpf === cpf);

            if (target.matches('.edit, .edit *')) this.startEdit(li, client);
            else if (target.matches('.delete, .delete *')) this.openDeleteModal(cpf, client.nome);
            else if (target.matches('.save, .save *')) this.saveChanges(cpf, li);
            else if (target.matches('.cancel, .cancel *')) this.cancelEdit(li);
        },
        
        /**
         * @description Filtra a lista de clientes com base no termo de busca.
         */
        handleSearch() {
            const searchTerm = this.elements.searchInput.value.toLowerCase();
            const filtered = this.clients.filter(c => 
                c.nome.toLowerCase().includes(searchTerm) || 
                c.cpf.includes(searchTerm)
            );
            this.renderList(filtered);
        },

        // --- 4. Renderização e Manipulação da UI ---

        /**
         * @description Renderiza a lista de clientes no DOM.
         * @param {Array} items - A lista de clientes a ser renderizada.
         */
        renderList(items) {
            this.elements.list.innerHTML = '';
            if (items.length === 0) {
                this.elements.list.innerHTML = '<li>Nenhum cliente encontrado.</li>';
                return;
            }
            items.forEach(client => {
                const li = document.createElement('li');
                li.dataset.cpf = client.cpf;
                li.innerHTML = this.createClientCardHTML(client);
                this.elements.list.appendChild(li);
            });
        },
        
        /**
         * @description Cria o HTML para o card de um cliente.
         * @param {object} client - O objeto do cliente.
         * @returns {string} O template string HTML do card.
         */
        createClientCardHTML(client) {
            return `
                <div class="client-details">
                    <div class="detail-item"><span class="label">Nome:</span><span>${client.nome}</span></div>
                    <div class="detail-item"><span class="label">CPF:</span><span>${this.formatCPF(client.cpf)}</span></div>
                    <div class="detail-item"><span class="label">E-mail:</span><span>${client.email}</span></div>
                    <div class="detail-item"><span class="label">Telefone:</span><span>${client.telefone}</span></div>
                    <div class="detail-item"><span class="label">Endereço:</span><span>${client.endereco}, ${client.cidade} - ${client.estado}, CEP: ${this.formatCEP(client.cep)}</span></div>
                </div>
                <div class="action-icons">
                    <i class="fas fa-edit edit" title="Editar"></i>
                    <i class="fas fa-trash delete" title="Excluir"></i>
                </div>
                <div class="edit-form-container"></div>
            `;
        },

        /**
         * @description Inicia o modo de edição para um item da lista.
         * @param {HTMLElement} li - O elemento <li> a ser editado.
         * @param {object} client - Os dados do cliente.
         */
        startEdit(li, client) {
            if (this.editingLi) this.cancelEdit(this.editingLi); // Cancela outra edição em andamento
            this.editingLi = li;
            li.classList.add('editing');
            
            const formHTML = `
                <form>
                    <div class="edit-field"><label>Nome:</label><input type="text" data-field="nome" value="${client.nome}"></div>
                    <div class="edit-field"><label>Email:</label><input type="email" data-field="email" value="${client.email}"></div>
                    <div class="edit-field"><label>Telefone:</label><input type="text" data-field="telefone" value="${client.telefone}"></div>
                    <div class="edit-field"><label>CEP:</label><input type="text" data-field="cep" value="${this.formatCEP(client.cep)}"></div>
                    <div class="edit-field"><label>Endereço:</label><input type="text" data-field="endereco" value="${client.endereco}"></div>
                    <div class="edit-field"><label>Cidade:</label><input type="text" data-field="cidade" value="${client.cidade}" readonly></div>
                    <div class="edit-field"><label>Estado:</label><input type="text" data-field="estado" value="${client.estado}" readonly></div>
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
            li.querySelector('[data-field="telefone"]').addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, ''));
        },

        /**
         * @description Cancela o modo de edição.
         * @param {HTMLElement} li - O elemento <li> que estava em edição.
         */
        cancelEdit(li) {
            li.classList.remove('editing');
            li.querySelector('.edit-form-container').innerHTML = '';
            this.editingLi = null;
        },
        
        /**
         * @description Salva as alterações de um cliente.
         * @param {string} cpf - O CPF do cliente.
         * @param {HTMLElement} li - O elemento <li> que está sendo editado.
         */
        async saveChanges(cpf, li) {
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
                const response = await fetch(`${this.API_URL}${cpf}/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCookie('csrftoken') },
                    body: JSON.stringify(updatedData),
                });
                if (!response.ok) throw new Error((await response.json()).error || 'Erro ao salvar.');
                this.showPopup('Cliente atualizado com sucesso!');
                this.fetchClients();
            } catch (error) {
                this.showPopup(`Erro: ${error.message}.`, true);
                this.cancelEdit(li);
            }
        },

        // --- 5. Lógica do Modal ---

        openDeleteModal(cpf, name) {
            this.clientCpfToDelete = cpf;
            this.elements.clientNameToDelete.textContent = name;
            this.elements.deleteModal.style.display = 'flex';
        },

        closeDeleteModal() {
            this.elements.deleteModal.style.display = 'none';
            this.clientCpfToDelete = null;
        },

        async confirmDeletion() {
            if (this.clientCpfToDelete) {
                try {
                    const response = await fetch(`${this.API_URL}${this.clientCpfToDelete}/`, {
                        method: 'DELETE',
                        headers: { 'X-CSRFToken': this.getCookie('csrftoken') }
                    });
                    if (response.status !== 204) {
                        const result = await response.json();
                        throw new Error(result.error || 'Erro ao excluir.');
                    }
                    this.showPopup('Cliente excluído com sucesso!');
                    this.fetchClients();
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
        
        formatCEP: (cep) => cep ? cep.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2') : "",
        formatCPF: (cpf) => cpf ? cpf.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2') : '',
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
    ClientManager.init();
});