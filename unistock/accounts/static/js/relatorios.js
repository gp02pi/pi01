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
    if (emailInput) {
        emailInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendAllFiles();
            }
        });
    }

    if (mainExportBtn) {
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
        if (!toastMsg) return;
        toastMsg.textContent = message;
        toastMsg.classList.remove('success', 'error');
        toastMsg.classList.add(type, 'show');
        setTimeout(() => toastMsg.classList.remove('show'), duration);
    }

    // ====================
    // Funções de Lógica de Negócio
    // ====================

    window.openEmailInput = function() {
        if (dropdownContent && emailInputContainer && emailInput) {
            dropdownContent.classList.remove('show');
            emailInputContainer.classList.add('show');
            emailInput.focus();
        }
    };
window.sendAllFiles = async function() {
    const email = emailInput.value;
    if (!email || !email.includes('@')) {
        showToast('Por favor, insira um e-mail válido.', 'error');
        return;
    }

    if (!reportData) {
        showToast('Nenhum dado para exportar.', 'error');
        return;
    }

    emailInputContainer.classList.remove('show');
    emailInput.value = '';

    // AVISO IMEDIATO AO CLICAR
    showToast('E-mail enviado com sucesso!', 'success');

    try {
        const pdfBlob = window.generatePDFBlob(reportData);
        const wordBlob = window.generateWordBlob(reportData);
        const excelBlob = window.generateExcelBlob(reportData);

        const formData = new FormData();
        formData.append('email', email);
        formData.append('pdfFile', pdfBlob, 'relatorio_completo_sistema.pdf');
        formData.append('wordFile', wordBlob, 'relatorio_completo_sistema.doc');
        formData.append('excelFile', excelBlob, 'relatorio_completo_sistema.xls');

        const response = await fetch('/api/enviar-relatorios-email/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData,
        });

        // Se a resposta do servidor indicar um erro, substitua a mensagem de sucesso
        if (!response.ok) {
            const result = await response.json();
            showToast(result.message || 'Erro ao tentar enviar o e-mail.', 'error');
        }

    } catch (error) {
        console.error('Erro na requisição:', error);
        // Em caso de erro de conexão, substitua a mensagem
        showToast('Erro ao tentar conectar com o servidor.', 'error');
    } finally {
        if (dropdownContent) dropdownContent.classList.remove('show');
    }
};


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
     */
    function updateUI(data) {
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

    // =====================================================================
    // FUNÇÕES DE EXPORTAÇÃO (AGORA DENTRO DO ESCOPO DO DOMContentLoaded)
    // =====================================================================
    
    window.exportToPDF = function() {
        if (!reportData) {
            showToast('Nenhum dado para exportar.', 'error');
            return;
        }
        const pdfBlob = window.generatePDFBlob(reportData);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pdfBlob);
        a.download = 'relatorio_completo_sistema.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (dropdownContent) dropdownContent.classList.remove('show');
    };

    window.exportToWord = function() {
        if (!reportData) {
            showToast('Nenhum dado para exportar.', 'error');
            return;
        }
        const wordBlob = window.generateWordBlob(reportData);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(wordBlob);
        a.download = 'relatorio_completo_sistema.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (dropdownContent) dropdownContent.classList.remove('show');
    };

    window.exportToExcel = function() {
        if (!reportData) {
            showToast('Nenhum dado para exportar.', 'error');
            return;
        }
        const excelBlob = window.generateExcelBlob(reportData);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(excelBlob);
        a.download = 'relatorio_completo_sistema.xls';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (dropdownContent) dropdownContent.classList.remove('show');
    };

    // INICIA A PRIMEIRA CHAMADA E AGENDA AS PRÓXIMAS
    fetchAndUpdateUI();
    setInterval(fetchAndUpdateUI, 30000);

}); // FECHAMOS O LISTENER AQUI, NO FIM DE TUDO

// =====================================================================
// FUNÇÕES DE GERAÇÃO DE BLOB (MOVIDAS PARA O ESCOPO GLOBAL)
// Agora elas aceitam 'data' como argumento
// =====================================================================
window.generatePDFBlob = function(data) {
    const doc = new window.jspdf.jsPDF();
    const margin = 15;
    let y = margin;
    const addTitle = (text, size = 16) => {
        doc.setFontSize(size);
        doc.setTextColor("#26A0B8");
        doc.text(text, margin, y);
        y += 10;
    };
    const addText = (text, size = 12) => {
        doc.setFontSize(size);
        doc.setTextColor("#26A0B8");
        doc.text(text, margin, y);
        y += 7;
    };
    const addTable = (headers, tableData) => { // Use um nome diferente para evitar conflito com 'data'
        doc.autoTable({
            startY: y,
            head: [headers],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: "#26A0B8"
            }
        });
        y = doc.autoTable.previous.finalY + 10;
    };
    const addList = (title, items) => {
        addTitle(title);
        if (items && items.length > 0) {
            items.forEach(item => addText(`• ${item.nome || item}`));
        } else {
            addText('Nenhum dado encontrado.');
        }
        y += 5;
    };
    addTitle("Relatório Completo do Sistema", 24);
    addText(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 10);
    y += 5;
    addTitle("Visão Geral");
    addTable(
        ["Métrica", "Valor"],
        [
            [`Produtos em Estoque`, data.produtosEstoque],
            [`Valor Total do Estoque`, data.valorEstoque],
            [`Total de Vendas`, data.totalVendas],
            [`Valor Total Ganho`, data.valorGanho],
            [`Total de Fornecedores`, data.fornecedores],
            [`Total de Clientes`, data.clientes]
        ]
    );
    addList("Produtos em Falta", data.produtosFalta);
    addTable(
        ["Ranking de Produtos", "Vendas"],
        [
            ...data.produtosMaisSaem.map(item => [`Mais vendidos: ${item.nome}`, item.vendas]),
            ...data.produtosMenosSaem.map(item => [`Menos vendidos: ${item.nome}`, item.vendas])
        ]
    );
    addList("Principais Clientes", data.topClientes);
    addTable(
        ["Principal Fornecedor", "Valor Gasto"],
        [
            [data.principalFornecedor.nome, data.principalFornecedor.valorGasto]
        ]
    );
    return doc.output('blob');
};

window.generateWordBlob = function(data) {
    const content = `
        <html>
            <head>
                <meta charset="UTF-8">
                <title>Relatório Completo do Sistema</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
                    h1 { color: #26a0b8; border-bottom: 3px solid #EB9941; padding-bottom: 10px; font-size: 28px; }
                    h2 { color: #26a0b8; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 22px; margin-top: 30px; }
                    h3 { color: #EB9941; font-size: 18px; margin-top: 20px; }
                    .header-date { color: #666; font-style: italic; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                    th, td { padding: 12px 15px; border: 1px solid #e0e0e0; text-align: left; }
                    th { background-color: #26A0B8; color: white; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    ul { list-style-type: none; padding-left: 20px; }
                    ul li::before { content: '• '; color: #EB9941; font-weight: bold; display: inline-block; width: 1em; margin-left: -1em; }
                    .summary-list li { margin-bottom: 8px; }
                </style>
            </head>
            <body>
                <h1>Relatório Completo do Sistema</h1>
                <p class="header-date">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
                
                <h2>Visão Geral</h2>
                <table class="summary-table">
                    <tr><th>Métrica</th><th>Valor</th></tr>
                    <tr><td>Produtos em Estoque</td><td>${data.produtosEstoque}</td></tr>
                    <tr><td>Valor Total do Estoque</td><td>${data.valorEstoque}</td></tr>
                    <tr><td>Total de Vendas</td><td>${data.totalVendas}</td></tr>
                    <tr><td>Valor Total Ganho</td><td>${data.valorGanho}</td></tr>
                    <tr><td>Total de Fornecedores</td><td>${data.fornecedores}</td></tr>
                    <tr><td>Total de Clientes</td><td>${data.clientes}</td></tr>
                </table>
                
                <h2>Produtos em Falta</h2>
                ${data.produtosFalta.length > 0 ? `
                    <ul>
                        ${data.produtosFalta.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                ` : `<p>Nenhum produto em falta.</p>`}
                
                <h2>Ranking de Produtos</h2>
                <table>
                    <tr><th>Posição</th><th>Nome do Produto</th><th>Vendas</th></tr>
                    ${data.produtosMaisSaem.map(item => `<tr><td>Mais Vendido</td><td>${item.nome}</td><td>${item.vendas}</td></tr>`).join('')}
                    ${data.produtosMenosSaem.map(item => `<tr><td>Menos Vendido</td><td>${item.nome}</td><td>${item.vendas}</td></tr>`).join('')}
                </table>

                <h2>Análise de Clientes e Fornecedores</h2>
                <h3>Principal Fornecedor</h3>
                <p><b>Nome:</b> ${data.principalFornecedor.nome}</p>
                <p><b>Valor Gasto:</b> ${data.principalFornecedor.valorGasto}</p>
                
                <h3>Principais Clientes</h3>
                ${data.topClientes.length > 0 ? `
                    <ul>
                        ${data.topClientes.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                ` : `<p>Nenhum cliente com histórico de compras.</p>`}
            </body>
        </html>
    `;
    return new Blob([content], {
        type: 'application/msword;charset=utf-8;'
    });
};

window.generateExcelBlob = function(data) {
    const tableHtml = `
        <meta charset="UTF-8">
        <table>
            <caption><b>Relatório Completo do Sistema</b></caption>
            <tr><td colspan="2" style="text-align: right; font-style: italic;">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</td></tr>
        </table>

        <br>
        <table>
            <thead>
                <tr><th colspan="2" style="background-color: #26A0B8; color: #FFFFFF; font-weight: bold; font-size: 14px;">Visão Geral</th></tr>
            </thead>
            <tbody>
                <tr><td style="background-color: #f2f2f2;">Produtos em Estoque</td><td>${data.produtosEstoque}</td></tr>
                <tr><td style="background-color: #f2f2f2;">Valor Total do Estoque</td><td>${data.valorEstoque}</td></tr>
                <tr><td style="background-color: #f2f2f2;">Total de Vendas</td><td>${data.totalVendas}</td></tr>
                <tr><td style="background-color: #f2f2f2;">Valor Total Ganho</td><td>${data.valorGanho}</td></tr>
                <tr><td style="background-color: #f2f2f2;">Total de Fornecedores</td><td>${data.fornecedores}</td></tr>
                <tr><td style="background-color: #f2f2f2;">Total de Clientes</td><td>${data.clientes}</td></tr>
            </tbody>
        </table>
        
        <br>
        <table>
            <thead>
                <tr><th colspan="2" style="background-color: #26A0B8; color: #FFFFFF; font-weight: bold; font-size: 14px;">Produtos em Falta</th></tr>
            </thead>
            <tbody>
                <tr><td colspan="2" style="background-color: #EB9941; color: #FFFFFF; font-weight: bold;">Nome do Produto</td></tr>
                ${data.produtosFalta.length > 0 ? data.produtosFalta.map(item => `<tr><td colspan="2">${item}</td></tr>`).join('') : '<tr><td colspan="2">Nenhum produto em falta.</td></tr>'}
            </tbody>
        </table>
        
        <br>
        <table>
            <thead>
                <tr><th colspan="3" style="background-color: #26A0B8; color: #FFFFFF; font-weight: bold; font-size: 14px;">Ranking de Produtos</th></tr>
                <tr>
                    <td style="background-color: #EB9941; color: #FFFFFF; font-weight: bold;">Posição</td>
                    <td style="background-color: #EB9941; color: #FFFFFF; font-weight: bold;">Nome do Produto</td>
                    <td style="background-color: #EB9941; color: #FFFFFF; font-weight: bold;">Vendas</td>
                </tr>
            </thead>
            <tbody>
                ${data.produtosMaisSaem.map((item, index) => `<tr><td>Mais Vendido ${index+1}</td><td>${item.nome}</td><td>${item.vendas}</td></tr>`).join('')}
                ${data.produtosMenosSaem.map((item, index) => `<tr><td>Menos Vendido ${index+1}</td><td>${item.nome}</td><td>${item.vendas}</td></tr>`).join('')}
            </tbody>
        </table>

        <br>
        <table>
            <thead>
                <tr><th colspan="2" style="background-color: #26A0B8; color: #FFFFFF; font-weight: bold; font-size: 14px;">Análise de Clientes e Fornecedores</th></tr>
            </thead>
            <tbody>
                <tr><td colspan="2" style="background-color: #EB9941; color: #FFFFFF; font-weight: bold;">Principal Fornecedor</td></tr>
                <tr><td>Nome</td><td>${data.principalFornecedor.nome}</td></tr>
                <tr><td>Valor Gasto</td><td>${data.principalFornecedor.valorGasto}</td></tr>
                <tr><td colspan="2" style="background-color: #EB9941; color: #FFFFFF; font-weight: bold;">Principais Clientes</td></tr>
                ${data.topClientes.map(item => `<tr><td colspan="2">${item}</td></tr>`).join('')}
            </tbody>
        </table>
    `;

    const blob = new Blob([tableHtml], {
        type: 'application/vnd.ms-excel'
    });
    return blob;
};