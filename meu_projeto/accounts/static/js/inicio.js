'use strict';

/**
 * @fileoverview Gerencia o Painel de Gestão de Estoque.
 * @description Este script é responsável por buscar dados de múltiplas APIs,
 * inicializar e atualizar gráficos (Chart.js), popular um mapa interativo
 * (Leaflet) e atualizar os KPIs do dashboard.
 */

document.addEventListener('DOMContentLoaded', () => {

    const DashboardManager = {
        API_URLS: {
            dashboard: '/api/dashboard/data/',
            map: '/api/map/locations/',
            ranking: '/api/cidade-rankings/',
        },
        elements: {},
        charts: {},
        map: null,

        CHART_DEFAULTS: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { usePointStyle: true } } },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#e9ecef' } } },
            animation: { duration: 1500, easing: 'easeOutQuart' }
        },

        init() {
            this.cacheDOM();
            this.initializeCharts();
            this.initializeMap();
            this.loadInitialData();
            setInterval(() => this.loadDashboardData(), 5000);
        },

        cacheDOM() {
            this.elements = {
                kpiVendasValor: document.getElementById('kpi-vendas-valor'),
                kpiVendasNumero: document.getElementById('kpi-vendas-numero'),
                kpiEstoqueTotal: document.getElementById('kpi-estoque-total'),
                kpiEntradaProdutos: document.getElementById('kpi-entrada-produtos'),
                topClientesList: document.getElementById('top-clientes-list'),
                topFornecedoresList: document.getElementById('top-fornecedores-list'),
            };
        },

        initializeCharts() {
            const createChart = (id, type, data, options) => {
                const ctx = document.getElementById(id).getContext('2d');
                return new Chart(ctx, { type, data, options });
            };
            
            const months = ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

            this.charts.mainChart = createChart('mainChart', 'bar', {
                labels: months,
                datasets: [
                    { type: 'bar', label: 'Vendas', data: [], backgroundColor: '#26A0B8' },
                    { type: 'bar', label: 'Estoque', data: [], backgroundColor: '#EB9941' }
                ]
            }, this.CHART_DEFAULTS);
            
            this.charts.inventoryValueChart = createChart('inventoryValueChart', 'bar', {
                labels: [],
                datasets: [{
                    label: 'Vendas',
                    data: [],
                    backgroundColor: ['#26A0B8', '#EB9941', '#26A0B8', '#EB9941'],
                }]
            }, {
                ...this.CHART_DEFAULTS,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Quantidade: ${context.formattedValue}`;
                            }
                        }
                    }
                },
                scales: { // <-- CONFIGURAÇÃO RESTAURADA DO JS1
                    x: {
                        beginAtZero: true,
                        grid: { display: true, color: '#e9ecef' },
                    },
                    y: {
                        ticks: {
                            font: { size: 14, weight: 'bold' },
                        }
                    }
                }
            });
            // ===== FIM DO BLOCO ALTERADO =====
            
            this.charts.salesTrendChart = createChart('salesTrendChart', 'line', {
                labels: months, datasets: [{ label: 'Crescimento', data: [], borderColor: '#26A0B8', tension: 0.4, fill: true }]
            }, { ...this.CHART_DEFAULTS, plugins: { legend: { display: false } } });

            this.charts.payableAgingChart = createChart('payableAgingChart', 'bar', {
                labels: [], // Ex: ['Custos', 'Receita']
                datasets: [{
                    label: 'Valor (R$)',
                    data: [], // Ex: [5000, 8000]
                    backgroundColor: [
                        '#EB9941',  // Vermelho para Custos
                        '#26A0B8'  // Verde para Receita
                    ],
                    borderColor: [
                        '#f09737ff',
                        '#1bbbdbff'
                    ],
                    borderWidth: 1
                }]
            }, { 
                ...this.CHART_DEFAULTS,
                plugins: { 
                    legend: { display: false }
                } 
            });
        },

        initializeMap() {
            this.map = L.map('map-container', { zoomControl: false }).setView([-14.235, -51.9253], 4);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);
        },

        loadInitialData() {
            this.loadDashboardData();
            this.loadRankingData();
            this.loadMapData();
        },

        async loadDashboardData() {
            try {
                const response = await fetch(this.API_URLS.dashboard);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();

                this.elements.kpiVendasValor.textContent = data.kpis.totalVendas;
                this.elements.kpiVendasNumero.textContent = data.kpis.numeroVendas;
                this.elements.kpiEstoqueTotal.textContent = data.kpis.produtosEstoque;
                this.elements.kpiEntradaProdutos.textContent = data.kpis.entradaProdutos;

                const top10Labels = data.inventoryValueChart.labels.slice(0, 10);
                const top10Data = data.inventoryValueChart.data.slice(0, 10);

                this.updateChartData(this.charts.mainChart, data.mainChart.labels, [data.mainChart.vendas, data.mainChart.estoque]);
                this.updateChartData(this.charts.inventoryValueChart, top10Labels, [top10Data]);
                this.updateChartData(this.charts.salesTrendChart, data.salesTrendChart.labels, [data.salesTrendChart.data]);
                this.updateChartData(this.charts.payableAgingChart, data.payableAgingChart.labels, [data.payableAgingChart.data]);
            } catch (error) {
                console.error("Erro ao buscar dados do dashboard:", error);
            }
        },

        async loadRankingData() {
            try {
                const response = await fetch(this.API_URLS.ranking);
                if (!response.ok) throw new Error('Falha ao carregar rankings.');
                const data = await response.json();
                
                this.renderRankingList(this.elements.topClientesList, data.top_clientes, 'fa-city', '#26A0B8');
                this.renderRankingList(this.elements.topFornecedoresList, data.top_fornecedores, 'fa-store', '#EB9941');
            } catch (error) {
                console.error("Erro ao buscar rankings:", error);
                this.elements.topClientesList.innerHTML = '<li>Erro ao carregar.</li>';
                this.elements.topFornecedoresList.innerHTML = '<li>Erro ao carregar.</li>';
            }
        },

        async loadMapData() {
            try {
                const response = await fetch(this.API_URLS.map);
                if (!response.ok) throw new Error('Falha ao carregar dados do mapa.');
                const data = await response.json();

                const markers = [];
                if (data.locations) {
                    data.locations.forEach(loc => {
                        if (loc.latitude && loc.longitude) {
                            const markerColor = loc.tipo === 'cliente' ? '#26A0B8' : '#EB9941';
                            const customIcon = L.divIcon({
                                className: 'custom-div-icon',
                                html: `<i class="fa-solid fa-map-pin" style="color:${markerColor}; font-size: 24px;"></i>`,
                                iconSize: [24, 24], iconAnchor: [12, 24],
                            });
                            const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon })
                                .addTo(this.map)
                                .bindPopup(`<b>${loc.nome}</b><br>${loc.endereco}`);
                            markers.push(marker);
                        }
                    });
                }
                if (markers.length > 0) {
                    const group = new L.featureGroup(markers);
                    this.map.fitBounds(group.getBounds().pad(0.5));
                }
            } catch (error) {
                console.error("Erro ao buscar dados do mapa:", error);
            }
        },

        updateChartData(chart, labels, datasetsData) {
            chart.data.labels = labels;
            datasetsData.forEach((data, index) => {
                chart.data.datasets[index].data = data;
            });
            chart.update();
        },

        renderRankingList(listElement, items, icon, color) {
            listElement.innerHTML = '';
            if (items && items.length > 0) {
                items.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="fa-solid ${icon}" style="color: ${color};"></i> ${item.cidade}/${item.estado} - <strong>${item.count}</strong>`;
                    listElement.appendChild(li);
                });
            } else {
                listElement.innerHTML = '<li>Nenhum dado disponível.</li>';
            }
        },
    };

    DashboardManager.init();
});