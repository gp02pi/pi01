# accounts/urls.py - NENHUMA ALTERAÇÃO NECESSÁRIA

from django.urls import path
from .views import (
    login_page, validar_codigo, redefinir_senha, recuperar_senha,
    senha, cadastrar, barra, inicio, clientes, produtos, relatorios,
    fornecedores, configuracoes, user_logout,
    api_produtos, api_produto_detalhe, api_fornecedor_detalhe, api_fornecedores,
    api_clientes, api_cliente_detalhe, vendas, api_vendas,
    api_relatorios, api_enviar_relatorios_email,
    api_user_profile, api_update_user_profile,
    api_enviar_codigo_alteracao_senha, api_dashboard_data, api_historico_notas, 
    api_historico_nota_detalhe, api_exportar_produtos, api_keep_alive, api_reauthenticate
)
urlpatterns = [
    # Rotas de Autenticação e Páginas (Públicas)
    path('login/', login_page, name='login'),
    path('senha/', senha, name='senha'),
    path('cadastrar/', cadastrar, name='cadastrar'),
    path('logout/', user_logout, name='logout'),
    path('recuperar-senha/', recuperar_senha, name='recuperar_senha'),
    path('validar-codigo/', validar_codigo, name='validar_codigo'),
    path('redefinir-senha/', redefinir_senha, name='redefinir_senha'),
    
    # Rotas do Sistema (Protegidas pelo @login_required nas views)
    path('inicio/', inicio, name='inicio'),
    path('clientes/', clientes, name='clientes'),
    path('produtos/', produtos, name='produtos'),
    path('vendas/', vendas, name='vendas'),
    path('relatorios/', relatorios, name='relatorios'),
    path('fornecedores/', fornecedores, name='fornecedores'),
    path('configuracoes/', configuracoes, name='configuracoes'),
    path('barra/', barra, name='barra'),
    
    # Rotas da API (Protegidas dentro das próprias views)
    path('api/produtos/', api_produtos, name='api_produtos'),
    path('api/produtos/exportar/', api_exportar_produtos, name='api_exportar_produtos'),
    path('api/produtos/<uuid:id>/', api_produto_detalhe, name='api_produto_detalhe'),
    
    path('api/fornecedores/', api_fornecedores, name='api_fornecedores'),
    path('api/fornecedores/<str:cnpj>/', api_fornecedor_detalhe, name='api_fornecedor_detalhe'),
    
    path('api/clientes/', api_clientes, name='api_clientes'),
    path('api/clientes/<str:cpf>/', api_cliente_detalhe, name='api_cliente_detalhe'),
    
    path('api/vendas/', api_vendas, name='api_vendas'),
    path('api/vendas/<uuid:id>/', api_vendas, name='api_venda_detalhe'),
    
    path('api/relatorios/', api_relatorios, name='api_relatorios'),
    path('api/enviar-relatorios-email/', api_enviar_relatorios_email, name='api_enviar_relatorios_email'),
    
    path('api/user/profile/', api_user_profile, name='api_user_profile'),
    path('api/user/profile/update/', api_update_user_profile, name='api_update_user_profile'),
    path('api/user/profile/send-code/', api_enviar_codigo_alteracao_senha, name='api_enviar_codigo_alteracao_senha'),
    
    path('api/dashboard/data/', api_dashboard_data, name='api_dashboard_data'),
    
    path('api/historico_notas/', api_historico_notas, name='api_historico_notas'),
    path('api/historico_notas/<uuid:id>/', api_historico_nota_detalhe, name='api_historico_nota_detalhe'),
    path('api/keep_alive/', api_keep_alive, name='api_keep_alive'),
    path('api/historico_notas/<uuid:id>/', api_historico_nota_detalhe, name='api_historico_nota_detalhe'),
     path('api/reauthenticate/', api_reauthenticate, name='api_reauthenticate'),
]