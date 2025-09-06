# meu_projeto/settings.py

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-js$ry%#=92^n_+jzht2_3*r=46-4-ws=i+8q2u=ji4wt-osuug'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'accounts',
    'captcha',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'accounts.middleware.CacheControlMiddleware', # <-- NOSSO NOVO MIDDLEWARE AQUI
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'meu_projeto.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'meu_projeto.wsgi.application'

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/
STATIC_URL = 'static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'account', 'static'),
]

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Configuração de E-mail
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'unistock.univesp@gmail.com'
EMAIL_HOST_PASSWORD = 'efnm zhnx rvee jheq'

# --- CONFIGURAÇÕES DE AUTENTICAÇÃO E SESSÃO ---

# URL para onde o @login_required redireciona usuários não autenticados.
LOGIN_URL = 'login'

# URL para onde o usuário é redirecionado APÓS o login bem-sucedido.
LOGIN_REDIRECT_URL = '/inicio/'

# URL para onde o usuário é redirecionado APÓS o logout.
LOGOUT_REDIRECT_URL = 'login'

# 1. ATIVADO: GARANTE QUE A SESSÃO SEJA ENCERRADA QUANDO O USUÁRIO FECHAR O NAVEGADOR/ABA.
# Isso atende diretamente ao seu pedido.
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# 2. CONFIGURAÇÃO DE TIMEOUT POR INATIVIDADE (OPCIONAL, MAS RECOMENDADO)
# Define o tempo de vida da sessão em segundos. Após este tempo de inatividade,
# o usuário será deslogado na próxima ação.
SESSION_COOKIE_AGE = 3600 # Você pode ajustar esse valor

# 3. ATIVADO: GARANTE QUE O TEMPO DE VIDA DA SESSÃO SEJA ATUALIZADO A CADA REQUISIÇÃO.
# Cada clique do usuário reinicia a contagem do SESSION_COOKIE_AGE.
SESSION_SAVE_EVERY_REQUEST = True

# --- CABEÇALHOS DE SEGURANÇA ADICIONAIS (RECOMENDADO PARA PRODUÇÃO) ---
# Para usar em produção (com HTTPS), descomente as linhas abaixo
# SECURE_HSTS_SECONDS = 31536000 # 1 ano
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True
# SECURE_CONTENT_TYPE_NOSNIFF = True
# SECURE_BROWSER_XSS_FILTER = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
# X_FRAME_OPTIONS = 'DENY'