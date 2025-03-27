from django.shortcuts import render

# Login
def login(request):
    return render(request, 'login.html')

# Esqueci minha senha
def senha(request):
    return render(request, 'senha.html')

# Cadastrar um novo usuário
def cadastrar(request):
    if request.method == 'POST':
        nome = request.POST.get('nome')
        sobrenome = request.POST.get('sobrenome')
        username = request.POST.get('username')
        email = request.POST.get('email')
        celular = request.POST.get('celular')
        senha = request.POST.get('senha')
        repetir_senha = request.POST.get('repetir_senha')

        # Verificar se a senha e a repetição são iguais
        if senha != repetir_senha:
            messages.error(request, 'As senhas não coincidem. Tente novamente.')
            return redirect('cadastrar')

        try:
            # Criar o usuário
            user = User.objects.create_user(username=username, password=senha, email=email)
            user.first_name = nome
            user.last_name = sobrenome
            user.save()
            messages.success(request, 'Usuário cadastrado com sucesso!')
            return redirect('login')  # Redireciona para a página de login
        except Exception as e:
            messages.error(request, f'Erro ao criar usuário: {str(e)}')

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
