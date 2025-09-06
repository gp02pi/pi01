# accounts/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class Perfil(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    celular = models.CharField(max_length=20, unique=True, null=True, blank=True)
    def __str__(self):
        return self.user.username
        
class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    def is_valid(self):
        return self.created_at >= timezone.now() - timezone.timedelta(minutes=10)
        
class Fornecedor(models.Model):
    nome = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=18, unique=True, primary_key=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    cep = models.CharField(max_length=9, blank=True, null=True)
    # --- CAMPOS ADICIONADOS ---
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)

    def __str__(self):
        return self.nome
        
class Produto(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=255)
    quantidade = models.IntegerField()
    quantidade_minima = models.IntegerField(default=0)
    preco_compra = models.DecimalField(max_digits=10, decimal_places=2)
    preco_venda = models.DecimalField(max_digits=10, decimal_places=2)
    fornecedor = models.ForeignKey(Fornecedor, on_delete=models.SET_NULL, null=True, blank=True)
    data_entrada = models.DateTimeField(default=timezone.now)
    def __str__(self):
        return self.nome
        
class HistoricoNotaFiscal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='historico_notas')
    numero_nota = models.CharField(max_length=255)
    quantidade_adicionada = models.IntegerField()
    preco_compra_nota = models.DecimalField(max_digits=10, decimal_places=2)
    preco_venda_nota = models.DecimalField(max_digits=10, decimal_places=2) 
    data_entrada = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Nota Fiscal {self.numero_nota} para {self.produto.nome}"
        
class Cliente(models.Model):
    nome = models.CharField(max_length=255)
    cpf = models.CharField(max_length=14, unique=True, primary_key=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    cep = models.CharField(max_length=9, blank=True, null=True)
    # --- CAMPOS ADICIONADOS ---
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)

    def __str__(self):
        return self.nome
        
class Venda(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE)
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True)
    quantidade = models.IntegerField()
    preco_total = models.DecimalField(max_digits=10, decimal_places=2)
    data_venda = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Venda {self.id} - {self.produto.nome}"