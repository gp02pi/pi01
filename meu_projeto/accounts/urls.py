from django.urls import path
from .views import login, senha, cadastrar, barra, inicio, clientes, produtos, relatorios, fornecedores, configuracoes, api_openai_chat

urlpatterns = [
    path('login/', login, name='login'), 
    path('senha/', senha, name='senha'),
    path('cadastrar/', cadastrar, name='cadastrar'),
    path('barra/', barra, name='barra'),
    path('inicio/', inicio, name='inicio'),
    path('clientes/', clientes, name='clientes'),
    path('produtos/', produtos, name='produtos'),
    path('relatorios/', relatorios, name='relatorios'),
    path('fornecedores/', fornecedores, name='fornecedores'),
    path('configuracoes/', configuracoes, name='configuracoes'),
    path('api/openai/chat/', api_openai_chat, name='api_openai_chat'),
]

