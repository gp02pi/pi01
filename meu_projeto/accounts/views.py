from django.shortcuts import render

# Login
def login_view(request):
    return render(request, 'login.html')

# Esqueci minha senha
def forgot_password_view(request):
    return render(request, 'esqueci-minha-senha.html')

# Cadastrar um novo usuário
def cadastrar_usuario(request):
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
            return redirect('cadastrar_usuario')

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

    return render(request, 'cadastrar-usuario.html')