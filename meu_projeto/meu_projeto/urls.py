from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('accounts.urls')),  # Isso vai garantir que o caminho raiz '/login' seja redirecionado para a página de login
]
