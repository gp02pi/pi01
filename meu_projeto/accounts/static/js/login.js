/**
 * @fileoverview Gerencia a interatividade da página de Acesso e Cadastro.
 * @description Controla a animação de deslize entre os painéis de login e
 * cadastro, a submissão do formulário de cadastro via AJAX e a atualização
 * dinâmica do CAPTCHA.
 */

document.addEventListener('DOMContentLoaded', () => {

    /**
     * @module AuthPageManager
     * @description Encapsula toda a lógica da página para organização e manutenibilidade.
     */
    const AuthPageManager = {
        // Cache de elementos do DOM para evitar buscas repetidas
        elements: {},

        /**
         * Ponto de entrada do módulo.
         */
        init() {
            this.cacheDOM();
            this.bindEvents();
        },

        /**
         * Seleciona e armazena os elementos do DOM mais utilizados.
         */
        cacheDOM() {
            this.elements = {
                container: document.getElementById('container'),
                signUpFormBtn: document.getElementById('signUpFormBtn'),
                signInFormLink: document.getElementById('signInFormLink'),
                formCadastro: document.getElementById('formCadastro'),
                captchaRefreshBtn: document.getElementById('captcha-refresh-btn'),
                toastContainer: document.getElementById('toast-container'),
                errorMessage: document.getElementById('errorMessage'),
            };
        },

        /**
         * Vincula todos os eventos de interação do usuário aos seus handlers.
         */
        bindEvents() {
            if (this.elements.signUpFormBtn) {
                this.elements.signUpFormBtn.addEventListener('click', () => {
                    this.elements.container.classList.add("right-panel-active");
                });
            }
            if (this.elements.signInFormLink) {
                this.elements.signInFormLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.elements.container.classList.remove("right-panel-active");
                });
            }
            if (this.elements.formCadastro) {
                this.elements.formCadastro.addEventListener('submit', this.handleRegistrationSubmit.bind(this));
            }
            if (this.elements.captchaRefreshBtn) {
                this.elements.captchaRefreshBtn.addEventListener('click', this.handleCaptchaRefresh.bind(this));
            }
        },

        /**
         * Lida com a submissão do formulário de cadastro via AJAX.
         * @param {Event} event - O evento de submit do formulário.
         */
        handleRegistrationSubmit(event) {
            event.preventDefault();
            const form = event.target;
            const password = form.senha.value;
            const confirmPassword = form.repetir_senha.value;
            
            // Validação de senhas do lado do cliente
            if (password !== confirmPassword) {
                this.elements.errorMessage.style.display = 'block';
                return;
            }
            this.elements.errorMessage.style.display = 'none';

            const formData = new FormData(form);
            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.showToast('success', data.message || 'Cadastro realizado com sucesso!');
                    form.reset();
                    // Simula o clique no link de login para retornar à tela de login
                    if (this.elements.signInFormLink) this.elements.signInFormLink.click();
                } else {
                    this.showToast('error', data.message || 'Ocorreu um erro ao cadastrar.');
                }
            })
            .catch(error => {
                this.showToast('error', 'Erro de conexão. Tente novamente.');
                console.error('Erro na submissão do cadastro:', error);
            });
        },

        /**
         * Lida com a atualização da imagem do CAPTCHA via AJAX.
         */
        handleCaptchaRefresh() {
            fetch('/captcha/refresh/', {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => response.json())
            .then(data => {
                if (data && data.key && data.image_url) {
                    document.querySelector('.captcha').src = data.image_url;
                    document.getElementById('id_captcha_0').value = data.key;
                    const textInput = document.getElementById('id_captcha_1');
                    if (textInput) {
                        textInput.value = '';
                        textInput.focus();
                    }
                }
            })
            .catch(error => console.error('Erro ao atualizar o CAPTCHA:', error));
        },

        /**
         * Exibe uma notificação (toast) na tela.
         * @param {'success'|'error'|'info'} type - O tipo de notificação.
         * @param {string} message - A mensagem a ser exibida.
         * @param {number} [duration=3000] - A duração em milissegundos.
         */
        showToast(type, message, duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `toast-notification ${type}`;
            
            const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
            const iconClass = icons[type] || 'fa-info-circle';

            toast.innerHTML = `
                <i class="toast-icon fas ${iconClass}"></i>
                <span class="toast-message">${message}</span>
                <button class="toast-close-btn">&times;</button>
            `;

            this.elements.toastContainer.appendChild(toast);
            
            // Força o repaint para a animação de entrada funcionar
            void toast.offsetWidth;
            toast.classList.add('show');

            const hideTimeout = setTimeout(() => {
                toast.classList.remove('show');
                // Remove o elemento do DOM após a animação de saída
                setTimeout(() => toast.remove(), 400);
            }, duration);

            toast.querySelector('.toast-close-btn').addEventListener('click', () => {
                clearTimeout(hideTimeout);
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            });
        }
    };

    // Inicia a aplicação.
    AuthPageManager.init();
});