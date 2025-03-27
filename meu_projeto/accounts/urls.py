from django.urls import path
from .views import login, senha, cadastrar, barra, inicio, clientes, financeiro, produtos, relatorios, fornecedores

urlpatterns = [
    path('login/', login, name='login'), 
    path('senha/', senha, name='senha'),
    path('cadastrar/', cadastrar, name='cadastrar'),
    path('barra/', barra, name='barra'),
    path('inicio/', inicio, name='inicio'),
    path('clientes/', clientes, name='clientes'),
    path('financeiro/', financeiro, name='financeiro'),
    path('produtos/', produtos, name='produtos'),
    path('relatorios/', relatorios, name='relatorios'),
    path('fornecedores/', fornecedores, name='fornecedores'),
]

