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
    'django.contrib.sessions.middleware.SessionMiddleware', # Gerencia as sessões
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    #'accounts.middleware.SessionTimeoutMiddleware', 
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
    os.path.join(BASE_DIR, 'static'),
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

# 1. URL para onde o @login_required redireciona usuários não autenticados.
#    'login' é o nome que demos para a nossa URL de login em accounts/urls.py
LOGIN_URL = 'login'

# 2. URL para onde o usuário é redirecionado APÓS o login bem-sucedido.
LOGIN_REDIRECT_URL = '/inicio/'

# 3. URL para onde o usuário é redirecionado APÓS o logout.
LOGOUT_REDIRECT_URL = 'login'

# 4. Garante que a sessão seja encerrada quando o usuário fechar o navegador.
SESSION_EXPIRE_AT_BROWSER_CLOSE = True


# --- CONFIGURAÇÕES DE SESSÃO COM LOGOUT AUTOMÁTICO POR INATIVIDADE ---

# 1. Define o tempo de vida da sessão em segundos.
#    Após este tempo de inatividade, o usuário será deslogado na próxima ação.
#    Exemplos:
#    900 segundos = 15 minutos
#    1800 segundos = 30 minutos
#    3600 segundos = 1 hora
SESSION_COOKIE_AGE = 3600

# 2. Garante que o tempo de vida da sessão seja atualizado a cada requisição.
#    Esta é a chave para o "tempo de inatividade". Cada clique do usuário
#    reinicia a contagem dos 15 minutos.
SESSION_SAVE_EVERY_REQUEST = True

# 3. Desativamos a configuração anterior. Agora o tempo é controlado
#    explicitamente pelo SESSION_COOKIE_AGE, e não mais pelo fechamento do navegador.
SESSION_EXPIRE_AT_BROWSER_CLOSE = False