from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    # Páginas
    path('', views.login_page, name='login'),
    path('login/', views.login_page, name='login'),
    path('inicio/', views.inicio, name='inicio'),
    path('clientes/', views.clientes, name='clientes'),
    path('fornecedores/', views.fornecedores, name='fornecedores'),
    path('vendas/', views.vendas, name='vendas'),
    path('relatorios/', views.relatorios, name='relatorios'),
    path('produtos/', views.produtos, name='produtos'),
    path('configuracoes/', views.configuracoes, name='configuracoes'),
    path('logout/', views.user_logout, name='logout'),
    path('senha/', views.senha, name='senha'),
    path('cadastrar/', views.cadastrar, name='cadastrar'),

    # APIs de Autenticação e Perfil
    path('api/reauthenticate/', views.api_reauthenticate, name='api_reauthenticate'),
    path('api/user-profile/', views.api_user_profile, name='api_user_profile'),
    path('api/enviar-codigo-alteracao-senha/', views.api_enviar_codigo_alteracao_senha, name='api_enviar_codigo_alteracao_senha'),
    path('api/update-user-profile/', views.api_update_user_profile, name='api_update_user_profile'),
    path('api/recuperar_senha/', views.recuperar_senha, name='recuperar_senha'),
    path('api/validar_codigo/', views.validar_codigo, name='validar_codigo'),
    path('api/redefinir_senha/', views.redefinir_senha, name='redefinir_senha'),

    # APIs de Produtos
    path('api/produtos/', views.api_produtos, name='api_produtos'),
    path('api/produtos/<int:id>/', views.api_produto_detalhe, name='api_produto_detalhe'),
    path('api/historico-notas/', views.api_historico_notas, name='api_historico_notas'),
    path('api/historico-notas/<int:id>/', views.api_historico_nota_detalhe, name='api_historico_nota_detalhe'),
    path('api/produtos/<uuid:id>/', views.api_produto_detalhe, name='api_produto_detalhe'),

    # APIs de Fornecedores e Clientes
    path('api/fornecedores/', views.api_fornecedores, name='api_fornecedores'),
    path('api/fornecedores/<str:cnpj>/', views.api_fornecedor_detalhe, name='api_fornecedor_detalhe'),
    path('api/clientes/', views.api_clientes, name='api_clientes'),
    path('api/clientes/<str:cpf>/', views.api_cliente_detalhe, name='api_cliente_detalhe'),

    # APIs de Vendas
    path('api/vendas/', views.api_vendas, name='api_vendas'),
    path('api/vendas/<int:id>/', views.api_vendas, name='api_venda_detalhe'),

    # APIs de Relatórios e Dashboard
    path('api/exportar-produtos/', views.api_exportar_produtos, name='api_exportar_produtos'),
    path('api/relatorios/', views.api_relatorios, name='api_relatorios'),
    path('api/enviar-relatorios-email/', views.api_enviar_relatorios_email, name='api_enviar_relatorios_email'),
    path('api/dashboard/data/', views.api_dashboard_data, name='api_dashboard_data'),
    path('api/keep-alive/', views.api_keep_alive, name='api_keep_alive'),
    
    # API de Geocodificação
    path('api/map/locations/', views.api_map_locations, name='api_map_locations'),
    
    # Nova API para busca de CEP
    path('api/buscar_cep/<str:cep>/', views.api_buscar_cep, name='api_buscar_cep'),
    path('api/cidade-rankings/', views.api_cidade_rankings, name='api_cidade_rankings'),
    
    path('api/user/profile/', views.api_user_profile, name='api_user_profile'),
    path('api/user/profile/update/', views.api_update_user_profile, name='api_update_user_profile'),
    path('api/user/profile/send-code/', views.api_enviar_codigo_alteracao_senha, name='api_send_code'),
]