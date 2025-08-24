# accounts/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Produto, HistoricoNotaFiscal 

def atualizar_precos_do_produto(produto):
    """
    Busca a última nota fiscal de um produto e atualiza seus preços.
    Se não houver mais notas, os preços são zerados.
    """
    ultima_nota = HistoricoNotaFiscal.objects.filter(produto=produto).order_by('-data_entrada').first()

    if ultima_nota:
        # AGORA ATUALIZANDO AMBOS OS PREÇOS
        produto.preco_compra = ultima_nota.preco_compra_nota
        produto.preco_venda = ultima_nota.preco_venda_nota # <-- LINHA CORRIGIDA
        
    else:
        # Se não há mais notas para este produto, zera os preços
        produto.preco_compra = 0.00
        produto.preco_venda = 0.00
    
    produto.save()


@receiver(post_save, sender=HistoricoNotaFiscal)
def on_save_nota(sender, instance, **kwargs):
    produto_relacionado = instance.produto
    atualizar_precos_do_produto(produto_relacionado)


@receiver(post_delete, sender=HistoricoNotaFiscal)
def on_delete_nota(sender, instance, **kwargs):
    produto_relacionado = instance.produto
    atualizar_precos_do_produto(produto_relacionado)