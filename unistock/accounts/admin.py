# accounts/admin.py

from django.contrib import admin
from .models import Perfil, Fornecedor, Produto, HistoricoNotaFiscal, Cliente, Venda

# Registrando os modelos para que apareçam na interface de administração

admin.site.register(Perfil)
admin.site.register(Fornecedor)
admin.site.register(Produto)
admin.site.register(HistoricoNotaFiscal)
admin.site.register(Cliente)
admin.site.register(Venda)