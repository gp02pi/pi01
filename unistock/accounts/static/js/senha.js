// Função de encapsulamento para evitar poluição do escopo global
(function() {
    // ====================
    // Seletores do DOM
    // ====================
    const emailForm = document.getElementById('emailForm');
    const codeForm = document.getElementById('codeForm');
    const passwordForm = document.getElementById('passwordForm');
    const messageBox = document.getElementById('message');
    const formTitle = document.getElementById('formTitle');
    
    // Variável para armazenar o e-mail do usuário entre os passos
    let userEmail = '';

    // ====================
    // Funções de Utilitário
    // ====================

    /**
     * Exibe uma mensagem de feedback na tela.
     * @param {string} msg - A mensagem a ser exibida.
     * @param {string} type - O tipo de mensagem ('success' ou 'error').
     */
    function showMessage(msg, type) {
        messageBox.textContent = msg;
        messageBox.className = 'message ' + type;
    }

    // ====================
    // Lógica da Aplicação (Fluxo de Recuperação)
    // ====================

    /**
     * Passo 1: Envia o e-mail para receber o código.
     * Ouve o evento de 'submit' do formulário de e-mail.
     */
    emailForm.addEventListener('submit', function(event) {
        event.preventDefault();
        userEmail = document.getElementById('email').value.trim();

        // Faz a requisição AJAX para a URL do Django
        fetch(emailForm.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body: JSON.stringify({ email: userEmail })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage(data.message, 'success');
                    emailForm.style.display = 'none'; // Oculta o formulário de e-mail
                    codeForm.style.display = 'block'; // Exibe o formulário de código
                    formTitle.textContent = 'Verifique seu código'; // Altera o título
                } else {
                    showMessage(data.message, 'error');
                }
            })
            .catch(() => showMessage('Erro na comunicação com o servidor. Tente novamente.', 'error'));
    });

    /**
     * Passo 2: Valida o código recebido.
     * Ouve o evento de 'submit' do formulário de código.
     */
    codeForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const codigo = document.getElementById('codigo').value.trim();

        fetch(codeForm.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body: JSON.stringify({ email: userEmail, codigo: codigo })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage(data.message, 'success');
                    codeForm.style.display = 'none'; // Oculta o formulário de código
                    passwordForm.style.display = 'block'; // Exibe o formulário de senha
                    formTitle.textContent = 'Definir nova senha'; // Altera o título
                } else {
                    showMessage(data.message, 'error');
                }
            })
            .catch(() => showMessage('Erro na comunicação com o servidor. Tente novamente.', 'error'));
    });

    /**
     * Passo 3: Redefine a nova senha.
     * Ouve o evento de 'submit' do formulário de senha.
     */
    passwordForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const novaSenha = document.getElementById('nova_senha').value;
        const repetirSenha = document.getElementById('repetir_nova_senha').value;

        // Validação simples de senhas
        if (novaSenha !== repetirSenha) {
            showMessage('As senhas não coincidem. Por favor, tente novamente.', 'error');
            return;
        }

        fetch(passwordForm.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body: JSON.stringify({ email: userEmail, nova_senha: novaSenha })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage(data.message, 'success');
                    passwordForm.style.display = 'none';
                    // Redireciona para a página de login após 3 segundos
                    setTimeout(() => {
                        window.location.href = '/login/';
                    }, 3000);
                } else {
                    showMessage(data.message, 'error');
                }
            })
            .catch(() => showMessage('Erro na comunicação com o servidor. Tente novamente.', 'error'));
    });

})();