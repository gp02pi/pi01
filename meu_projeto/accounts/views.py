from django.contrib import messages
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.http import JsonResponse

# Login
def login(request):
    return render(request, 'login.html')

# Esqueci minha senha
def senha(request):
    return render(request, 'senha.html')

# Cadastro
def cadastrar(request):
    if request.method == 'POST':
        nomecompleto = request.POST.get('nomecompleto', '').strip()
        username = request.POST.get('usuario', '').strip()
        email = request.POST.get('email', '').strip()
        celular = request.POST.get('celular', '').strip()
        senha = request.POST.get('senha', '').strip()
        repetir_senha = request.POST.get('repetir_senha', '').strip()

        # Verifica se algum campo obrigatório está vazio
        if not nomecompleto or not username or not email or not senha or not repetir_senha:
            return JsonResponse({'success': False, 'message': 'Todos os campos obrigatórios devem ser preenchidos.'})

        # Verificar se a senha e a repetição são iguais
        if senha != repetir_senha:
            return JsonResponse({'success': False, 'message': 'As senhas não coincidem. Tente novamente.'})

        # Verificar se o username já existe
        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'message': 'Nome de usuário já está em uso.'})

        try:
            # Criar o usuário com nome completo
            user = User.objects.create_user(username=username, password=senha, email=email)
            user.first_name = nomecompleto  # Armazena o nome completo em first_name
            user.last_name = ""  # Evita erro do banco de dados ao tentar salvar um campo vazio
            user.save()

            return JsonResponse({'success': True, 'message': 'Usuário cadastrado com sucesso!'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Erro ao criar usuário: {str(e)}'})

    return render(request, 'cadastrar.html')

# Outras views
def barra(request):
    return render(request, 'barra.html')

def inicio(request):
    return render(request, 'inicio.html')

def clientes(request):
    return render(request, 'clientes.html')

def financeiro(request):
    return render(request, 'financeiro.html')

def fornecedores(request):
    return render(request, 'fornecedores.html')

def relatorios(request):
    return render(request, 'relatorios.html')

def produtos(request):
    return render(request, 'produtos.html')