from django.contrib import messages 
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponseBadRequest
import os
import json
import openai
from django.views.decorators.csrf import csrf_exempt

# Configure sua chave da OpenAI via variável de ambiente
openai.api_key = os.getenv("OPENAI_API_KEY")

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

        if not nomecompleto or not username or not email or not senha or not repetir_senha:
            return JsonResponse({'success': False, 'message': 'Todos os campos obrigatórios devem ser preenchidos.'})

        if senha != repetir_senha:
            return JsonResponse({'success': False, 'message': 'As senhas não coincidem. Tente novamente.'})

        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'message': 'Nome de usuário já está em uso.'})

        try:
            user = User.objects.create_user(username=username, password=senha, email=email)
            user.first_name = nomecompleto
            user.last_name = ""
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

def fornecedores(request):
    return render(request, 'fornecedores.html')

def relatorios(request):
    return render(request, 'relatorios.html')

def produtos(request):
    return render(request, 'produtos.html')

def configuracoes(request):
    return render(request, 'configuracoes.html')

# View para integração com OpenAI Chat
@csrf_exempt  # Você pode remover isso se configurar corretamente CSRF no frontend
def api_openai_chat(request):
    if request.method != "POST":
        return HttpResponseBadRequest("Apenas POST permitido.")

    try:
        data = json.loads(request.body)
        user_message = data.get("message", "").strip()
        if not user_message:
            return JsonResponse({"error": "Mensagem vazia"}, status=400)

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # Altere para "gpt-4" se disponível e quiser usar
            messages=[
                {"role": "system", "content": "Você é um assistente útil."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500,
            temperature=0.7,
        )

        reply = response.choices[0].message.content.strip()
        return JsonResponse({"reply": reply})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
