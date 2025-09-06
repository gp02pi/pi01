/**
 * @fileoverview Gerencia a página de Configurações de Perfil do Usuário.
 * @description Controla o carregamento de dados do perfil, atualização de informações
 * pessoais e o fluxo de alteração de senha com verificação em duas etapas.
 */

document.addEventListener('DOMContentLoaded', () => {

    /**
     * @module ProfileSettings
     * @description Módulo que encapsula toda a lógica da página para organização e
     * manutenção.
     */
    const ProfileSettings = {
        // --- 1. Propriedades e Estado ---
        
        // Cache de seletores do DOM para evitar buscas repetidas
        elements: {},
        // Armazena o token CSRF para requisições seguras
        csrfToken: null,

        /**
         * Ponto de entrada do módulo. Orquestra a inicialização.
         */
        init() {
            this.cacheDOM();
            this.csrfToken = this.getCookie('csrftoken');
            this.bindEvents();
            this.loadUserProfile();
        },

        /**
         * Seleciona e armazena referências a elementos do DOM essenciais.
         */
        cacheDOM() {
            this.elements = {
                closeBtn: document.getElementById('close-btn'),
                successMessage: document.getElementById('successMessage'),
                // Cabeçalho
                displayName: document.getElementById('displayName'),
                emailInfo: document.getElementById('emailInfo'),
                phoneInfo: document.getElementById('phoneInfo'),
                // Formulário de Informações Pessoais
                personalInfoForm: document.getElementById('personalInfoForm'),
                username: document.getElementById('username'),
                fullname: document.getElementById('fullname'),
                email: document.getElementById('email'),
                phone: document.getElementById('phone'),
                phoneError: document.getElementById('phoneError'),
                // Formulário de Alteração de Senha
                changePasswordForm: document.getElementById('changePasswordForm'),
                currentPassword: document.getElementById('currentPassword'),
                newPassword: document.getElementById('newPassword'),
                confirmPassword: document.getElementById('confirmPassword'),
                codeField: document.getElementById('codeField'),
                code: document.getElementById('code'),
                sendCodeBtn: document.getElementById('sendCodeBtn'),
                changePasswordBtn: document.getElementById('changePasswordBtn'),
                passwordMessage: document.getElementById('passwordMessage'),
            };
        },

        /**
         * Vincula todos os eventos de interação do usuário a seus respectivos handlers.
         */
        bindEvents() {
            this.elements.closeBtn.addEventListener('click', () => window.history.back());
            this.elements.phone.addEventListener('input', this.validatePhoneInput.bind(this));
            this.elements.personalInfoForm.addEventListener('submit', this.handleProfileUpdate.bind(this));
            this.elements.sendCodeBtn.addEventListener('click', this.handleSendCode.bind(this));
            this.elements.changePasswordBtn.addEventListener('click', this.handleChangePassword.bind(this));
        },
        
        // --- 2. Comunicação com a API ---

        /**
         * Busca os dados do perfil do usuário na API e os renderiza na página.
         */
        async loadUserProfile() {
            try {
                const response = await fetch('/api/user/profile/');
                if (!response.ok) throw new Error('Falha ao carregar os dados do usuário.');
                
                const userData = await response.json();
                this.renderProfileData(userData);
            } catch (error) {
                console.error('Erro na requisição para carregar o perfil:', error);
                this.elements.displayName.textContent = "Erro ao carregar perfil.";
            } finally {
                this.removeSkeletonEffects();
            }
        },
        
        /**
         * Envia os dados atualizados do perfil para a API.
         * @param {object} data - Objeto com os dados a serem atualizados.
         */
        async updateProfileAPI(data) {
            return this.fetchAPI('/api/user/profile/update/', 'POST', data);
        },

        /**
         * Envia a senha atual para a API validar e disparar o envio do código de verificação.
         * @param {string} current_password - A senha atual do usuário.
         */
        async sendCodeAPI(current_password) {
            return this.fetchAPI('/api/user/profile/send-code/', 'POST', { current_password });
        },

        /**
         * @description Função genérica para realizar chamadas fetch à API.
         * @param {string} url - O endpoint da API.
         * @param {string} method - O método HTTP (POST, GET, etc.).
         * @param {object} body - O corpo da requisição.
         * @returns {Promise<object>} A resposta da API em JSON.
         */
        async fetchAPI(url, method, body = null) {
            try {
                const options = {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.csrfToken,
                    },
                };
                if (body) options.body = JSON.stringify(body);
                
                const response = await fetch(url, options);
                return await response.json();
            } catch (error) {
                console.error(`Erro na requisição para ${url}:`, error);
                return { success: false, message: 'Erro de conexão. Tente novamente.' };
            }
        },
        
        // --- 3. Handlers de Eventos ---

        /**
         * Valida e submete o formulário de atualização de informações pessoais.
         * @param {Event} event - O evento de submit do formulário.
         */
        async handleProfileUpdate(event) {
            event.preventDefault();
            const data = {
                fullname: this.elements.fullname.value.trim(),
                email: this.elements.email.value.trim(),
                celular: this.elements.phone.value.trim()
            };

            if (!data.fullname || !data.email || !data.celular) {
                alert('Por favor, preencha todos os campos corretamente.');
                return;
            }

            const result = await this.updateProfileAPI(data);
            if (result.success) {
                this.renderProfileData(data, false); // Atualiza o cabeçalho sem pegar dados do username
                this.showSuccessMessage('Informações atualizadas com sucesso!');
            } else {
                alert(`Erro ao atualizar informações: ${result.message}`);
            }
        },

        /**
         * Inicia o fluxo de alteração de senha, validando campos e solicitando o código.
         */
        async handleSendCode() {
            const { currentPassword, newPassword, confirmPassword } = this.elements;
            const currentPass = currentPassword.value.trim();
            const newPass = newPassword.value.trim();
            
            if (!this.validatePasswordFields()) return;

            this.updatePasswordMessage('Verificando senha e enviando código...', 'blue');
            this.togglePasswordFields(true); // Desabilita campos

            const result = await this.sendCodeAPI(currentPass);
            if (result.success) {
                this.updatePasswordMessage(result.message, 'green');
                this.toggleCodeField(true); // Mostra campo de código
                this.elements.code.focus();
            } else {
                this.updatePasswordMessage(`Erro: ${result.message}`, 'red');
                this.togglePasswordFields(false); // Reabilita campos
            }
        },
        
        /**
         * Finaliza o fluxo de alteração de senha, enviando o código e a nova senha.
         * @param {Event} event - O evento de submit do formulário.
         */
        async handleChangePassword(event) {
            event.preventDefault();
            const data = {
                current_password: this.elements.currentPassword.value.trim(),
                new_password: this.elements.newPassword.value.trim(),
                code: this.elements.code.value.trim()
            };

            if (!data.code) {
                this.updatePasswordMessage('Por favor, digite o código de verificação.', 'red');
                return;
            }
            
            this.updatePasswordMessage('Redefinindo senha...', 'blue');
            const result = await this.updateProfileAPI(data);
            
            if (result.success) {
                this.updatePasswordMessage('Senha alterada com sucesso!', 'green');
                setTimeout(() => {
                    this.elements.changePasswordForm.reset();
                    this.updatePasswordMessage('');
                    this.togglePasswordFields(false);
                    this.toggleCodeField(false);
                }, 3000);
            } else {
                this.updatePasswordMessage(`Erro: ${result.message}`, 'red');
            }
        },

        // --- 4. Manipulação da UI e Validações ---

        /**
         * Preenche a UI com os dados do usuário recebidos.
         * @param {object} userData - Dados do usuário.
         * @param {boolean} updateUsername - Flag para decidir se o campo username deve ser atualizado.
         */
        renderProfileData(userData, updateUsername = true) {
            this.elements.displayName.textContent = userData.fullname;
            this.elements.emailInfo.textContent = `E-mail: ${userData.email}`;
            this.elements.phoneInfo.textContent = `Celular: ${userData.celular || 'N/A'}`;
            if(updateUsername) this.elements.username.value = userData.username;
            this.elements.fullname.value = userData.fullname;
            this.elements.email.value = userData.email;
            this.elements.phone.value = userData.celular;
        },

        /**
         * Remove as classes de "esqueleto" dos elementos após o carregamento dos dados.
         */
        removeSkeletonEffects() {
            document.querySelectorAll('.skeleton-text, .skeleton-input').forEach(el => {
                el.classList.remove('skeleton-text', 'skeleton-input', 'skeleton');
            });
        },
        
        validatePhoneInput() {
            const phoneValue = this.elements.phone.value;
            if (/\D/.test(phoneValue)) { // Testa se há caracteres não-numéricos
                this.elements.phoneError.textContent = 'Digite apenas números.';
                this.elements.phone.style.borderColor = 'red';
            } else {
                this.elements.phoneError.textContent = '';
                this.elements.phone.style.borderColor = '';
            }
        },

        validatePasswordFields() {
            const { currentPassword, newPassword, confirmPassword } = this.elements;
            if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
                this.updatePasswordMessage('Por favor, preencha todos os campos.', 'red');
                return false;
            }
            if (newPassword.value.length < 8) {
                this.updatePasswordMessage('A nova senha deve ter pelo menos 8 caracteres.', 'red');
                return false;
            }
            if (newPassword.value !== confirmPassword.value) {
                this.updatePasswordMessage('As novas senhas não coincidem!', 'red');
                return false;
            }
            return true;
        },

        showSuccessMessage(message) {
            this.elements.successMessage.textContent = message;
            this.elements.successMessage.style.display = 'block';
            setTimeout(() => this.elements.successMessage.style.opacity = '1', 10);
            setTimeout(() => {
                this.elements.successMessage.style.opacity = '0';
                setTimeout(() => this.elements.successMessage.style.display = 'none', 500);
            }, 3000);
        },
        
        updatePasswordMessage(message, color = 'black') {
            this.elements.passwordMessage.textContent = message;
            this.elements.passwordMessage.style.color = color;
        },

        togglePasswordFields(disabled) {
            this.elements.currentPassword.disabled = disabled;
            this.elements.newPassword.disabled = disabled;
            this.elements.confirmPassword.disabled = disabled;
        },
        
        toggleCodeField(show) {
            this.elements.codeField.style.display = show ? 'block' : 'none';
            this.elements.sendCodeBtn.style.display = show ? 'none' : 'block';
            this.elements.changePasswordBtn.style.display = show ? 'block' : 'none';
        },

        // --- 5. Funções Utilitárias ---

        /**
         * Obtém o valor de um cookie específico. Essencial para o CSRF do Django.
         * @param {string} name - O nome do cookie.
         * @returns {string|null} O valor do cookie.
         */
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
        }
    };

    // Inicia a aplicação.
    ProfileSettings.init();
});