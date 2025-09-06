/**
 * @file Gerencia a interatividade da barra de navegação, incluindo o menu responsivo e o modal de logout.
 * @author Seu Nome/Equipe
 * @version 2.1
 */

// Executa o script somente após o carregamento completo do DOM.
document.addEventListener('DOMContentLoaded', () => {

    // --- Seleção de Elementos para o Menu Responsivo ---
    const menuToggle = document.querySelector(".menu-toggle");
    const closeMenuBtn = document.querySelector(".close-menu-btn");
    const sidebarOverlay = document.querySelector(".sidebar-overlay");
    const body = document.body;

    // --- Funções do Menu Responsivo ---
    const closeMenu = () => {
        body.classList.remove("sidebar-open");
        menuToggle.setAttribute("aria-expanded", "false");
    };

    const toggleMenu = () => {
        // Alterna a classe no body
        const isMenuOpen = body.classList.toggle("sidebar-open");
        // Atualiza o atributo ARIA para acessibilidade
        menuToggle.setAttribute("aria-expanded", isMenuOpen);
    };

    // --- Event Listeners do Menu Responsivo ---
    if (menuToggle && closeMenuBtn && sidebarOverlay) {
        // O botão hambúrguer agora alterna o menu (abre e fecha)
        menuToggle.addEventListener("click", toggleMenu);
        
        // O botão de fechar (X) e o overlay apenas fecham
        closeMenuBtn.addEventListener("click", closeMenu);
        sidebarOverlay.addEventListener("click", closeMenu);
    } else {
        console.error("Elementos do menu responsivo não foram encontrados.");
    }

    // --- LÓGICA EXISTENTE PARA O LOGOUT (não foi alterada) ---

    // --- Seleção e Cache dos Elementos do DOM ---
    const logoutBtn = document.getElementById("logout-btn");
    const popupOverlay = document.getElementById("logout-popup");
    const cancelBtn = document.getElementById("cancel-logout");
    const confirmBtn = document.getElementById("confirm-logout");

    // --- Validação de Elementos (Guard Clause) ---
    if (!logoutBtn || !popupOverlay || !cancelBtn || !confirmBtn) {
        console.error("Um ou mais elementos da UI para o logout não foram encontrados. Verifique os IDs no HTML.");
        return; // Interrompe a execução do script se os elementos do popup não existirem.
    }

    // --- Funções de Manipulação da UI ---
    const showPopup = () => {
        popupOverlay.style.display = "flex";
        cancelBtn.focus();
    };

    const hidePopup = () => {
        popupOverlay.style.display = "none";
        logoutBtn.focus();
    };

    // --- Event Listeners (Tratamento de Eventos) ---
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showPopup();
    });

    cancelBtn.addEventListener("click", hidePopup);

    confirmBtn.addEventListener("click", () => {
        const logoutUrl = confirmBtn.dataset.logoutUrl;
        if (logoutUrl) {
            window.location.href = logoutUrl;
        } else {
            console.error("URL de logout não encontrada no atributo data-logout-url.");
        }
    });

    popupOverlay.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            hidePopup();
        }
    });

    /**
     * @description Função utilitária para obter o valor de um cookie pelo nome.
     * @param {string} name - O nome do cookie a ser recuperado.
     * @returns {string|null} O valor do cookie ou null se não for encontrado.
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
});