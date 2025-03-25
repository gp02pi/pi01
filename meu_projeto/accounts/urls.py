from django.urls import path
from . import views  # Importando a view de login para criar em seguida

urlpatterns = [
    path('login/', views.login_view, name='login'),  # Esta URL redireciona para a página de login
    path('esqueci-minha-senha/', views.forgot_password_view, name='esqueci-minha-senha'), # Esta URL redireciona para a página de esqueci minha senha
    path('cadastrar-usuario/', views.cadastrar_usuario, name='cadastrar-usuario'), # Esta URL redireciona para a página de cadastro de usuario
]