# accounts/serializers.py

from rest_framework import serializers
# ADICIONE 'HistoricoNotaFiscal' NA LINHA DE IMPORTAÇÃO DOS MODELS
from .models import Produto, Cliente, HistoricoNotaFiscal 

class ProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = '__all__'

# --- ADICIONE ESTE NOVO CÓDIGO ABAIXO ---

class HistoricoNotaFiscalSerializer(serializers.ModelSerializer):
    """
    Este serializer vai lidar com a criação e listagem das notas fiscais.
    """
    class Meta:
        model = HistoricoNotaFiscal
        # '__all__' é um atalho para incluir todos os campos do seu modelo,
        # o que vai resolver o problema, pois incluirá o novo campo 'preco_venda_nota'.
        fields = '__all__'