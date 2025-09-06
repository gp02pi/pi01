from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('accounts.urls')),
    
    # ADICIONE A LINHA ABAIXO PARA O CAPTCHA
    path('captcha/', include('captcha.urls')),
    
    # ... (seu redirect da raiz continua aqui)
    path('', RedirectView.as_view(url='login/', permanent=False), name='root_redirect'),
]