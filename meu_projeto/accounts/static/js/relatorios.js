// ABRIMOS O LISTENER AQUI, NO COMEÇO DE TUDO
document.addEventListener('DOMContentLoaded', () => {

    // ====================
    // Variáveis e Seletores do DOM
    // ====================
    const API_URL = '/api/relatorios/';
    const loadingContainer = document.getElementById('loading-container');
    const toastMsg = document.getElementById('toast-message');
    const mainExportBtn = document.querySelector('.main-export-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    const emailInputContainer = document.querySelector('.email-input-container');
    const emailInput = document.getElementById('emailInput');

    let reportData = null; // Armazena os dados mais recentes

    // ====================
    // Listeners de Eventos
    // ====================

    // Verifica se os elementos existem antes de adicionar listeners
    if(emailInput) {
        emailInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendAllFiles();
            }
        });
    }

    if(mainExportBtn) {
        mainExportBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdownContent.classList.toggle('show');
            emailInputContainer.classList.remove('show');
        });
    }

    window.addEventListener('click', (event) => {
        const dropdown = document.querySelector('.dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
            dropdownContent.classList.remove('show');
            emailInputContainer.classList.remove('show');
        }
    });

    // ====================
    // Funções de Utilitário
    // ====================

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function showToast(message, type = 'success', duration = 3000) {
        if(!toastMsg) return;
        toastMsg.textContent = message;
        toastMsg.classList.remove('success', 'error');
        toastMsg.classList.add(type, 'show');
        setTimeout(() => toastMsg.classList.remove('show'), duration);
    }

    // ====================
    // Funções de Lógica de Negócio
    // ====================

    window.openEmailInput = function() {
        if(dropdownContent && emailInputContainer && emailInput){
            dropdownContent.classList.remove('show');
            emailInputContainer.classList.add('show');
            emailInput.focus();
        }
    }

    window.sendAllFiles = async function() {
        const email = emailInput.value;
        if (!email || !email.includes('@')) {
            showToast('Por favor, insira um e-mail válido.', 'error');
            return;
        }

        emailInputContainer.classList.remove('show');
        emailInput.value = '';
        showToast('Enviando e-mail, por favor aguarde...', 'success', 2500);

        try {
            const response = await fetch('/api/enviar-relatorios-email/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();
            showToast(result.message || 'E-mail enviado!', response.ok ? 'success' : 'error');
        } catch (error) {
            console.error('Erro na requisição:', error);
            showToast('Erro ao tentar conectar com o servidor.', 'error');
        }
    }

    /**
     * NOVA FUNÇÃO PRINCIPAL: Busca os dados e chama a função de atualização da UI.
     */
    async function fetchAndUpdateUI() {
        if (!reportData && loadingContainer) {
            loadingContainer.style.display = 'block';
        }

        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Erro ao carregar os dados.');
            
            const newData = await response.json();
            reportData = newData; 
            updateUI(newData); 
            
        } catch (error) {
            console.error("Erro:", error);
            showToast(error.message, 'error');
        } finally {
            if (loadingContainer && loadingContainer.style.display === 'block') {
                loadingContainer.style.display = 'none';
            }
        }
    }

    /**
     * NOVA FUNÇÃO DE ATUALIZAÇÃO: Apenas atualiza o conteúdo dos elementos existentes.
     * @param {Object} data - Objeto com os dados dos relatórios.
     */
    function updateUI(data) {
        // Função para atualizar texto de forma segura
        const updateText = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`Elemento com id '${id}' não encontrado.`);
            }
        };

        updateText('report-produtosEstoque', data.produtosEstoque);
        updateText('report-valorEstoque', data.valorEstoque);
        updateText('report-principalFornecedorNome', data.principalFornecedor.nome);
        updateText('report-principalFornecedorValor', `Valor gasto: ${data.principalFornecedor.valorGasto}`);
        updateText('report-fornecedores', data.fornecedores);
        updateText('report-clientes', data.clientes);
        updateText('report-totalVendas', data.totalVendas);
        updateText('report-valorGanho', data.valorGanho);

        const renderSimpleList = (elementId, items) => {
            const ul = document.getElementById(elementId);
            if (!ul) return;
            ul.innerHTML = ''; 
            if (items && items.length > 0) {
                items.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="name">${item}</span>`;
                    ul.appendChild(li);
                });
            } else {
                ul.innerHTML = `<p style="text-align: center; color: var(--light-text-color);">Nenhum dado.</p>`;
            }
        };
        
        const renderComplexList = (elementId, items) => {
            const ul = document.getElementById(elementId);
            if (!ul) return;
            ul.innerHTML = '';
            if (items && items.length > 0) {
                items.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="name">${item.nome}</span> <span class="value">${item.vendas}</span>`;
                    ul.appendChild(li);
                });
            } else {
                 ul.innerHTML = `<p style="text-align: center; color: var(--light-text-color);">Nenhum dado.</p>`;
            }
        };

        renderSimpleList('report-produtosFalta', data.produtosFalta);
        renderSimpleList('report-topClientes', data.topClientes);
        renderComplexList('report-produtosMaisSaem', data.produtosMaisSaem);
        renderComplexList('report-produtosMenosSaem', data.produtosMenosSaem);
    }

    // ====================
    // Funções de Exportação - movidas para o escopo global com 'window'
    // ====================
    window.exportToPDF = function() {
        if (!reportData) { showToast('Nenhum dado para exportar.', 'error'); return; }
        const doc = new window.jspdf.jsPDF();
        // ... (o resto da sua função PDF)
        const margin = 15;
        let y = margin;
        const addTitle = (text, size = 16) => { doc.setFontSize(size); doc.text(text, margin, y); y += 10; };
        const addText = (text, size = 12) => { doc.setFontSize(size); doc.text(text, margin, y); y += 7; };
        const addTable = (headers, data) => { doc.autoTable({ startY: y, head: [headers], body: data, theme: 'grid' }); y = doc.autoTable.previous.finalY + 10; };
        addTitle("Relatório Completo do Sistema", 24);
        addText(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 10);
        y += 5;
        addTitle("Visão Geral");
        addTable(["Métrica", "Valor"], [[`Produtos em Estoque`, reportData.produtosEstoque], [`Valor Total do Estoque`, reportData.valorEstoque], [`Total de Vendas`, reportData.totalVendas], [`Valor Total Ganho`, reportData.valorGanho]]);
        doc.save("relatorio_completo_sistema.pdf");
        if(dropdownContent) dropdownContent.classList.remove('show');
    }

    window.exportToWord = function() {
        if (!reportData) { showToast('Nenhum dado para exportar.', 'error'); return; }
        const content = `... (seu HTML para Word aqui) ...`;
        const blob = new Blob([content], { type: 'application/msword;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'relatorio_completo_sistema.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if(dropdownContent) dropdownContent.classList.remove('show');
    }

    window.exportToExcel = function() {
        if (!reportData) { showToast('Nenhum dado para exportar.', 'error'); return; }
        const htmlContent = `... (seu HTML para Excel aqui) ...`;
        const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'relatorio_completo_sistema.xls';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if(dropdownContent) dropdownContent.classList.remove('show');
    }

    // INICIA A PRIMEIRA CHAMADA E AGENDA AS PRÓXIMAS
    fetchAndUpdateUI();
    setInterval(fetchAndUpdateUI, 30000);

}); // FECHAMOS O LISTENER AQUI, NO FIM DE TUDO