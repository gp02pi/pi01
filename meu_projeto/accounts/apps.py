# seu_app/apps.py

from django.apps import AppConfig

class SeuAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts' # Substitua pelo nome do seu app

    def ready(self):
        # Importa os sinais para que sejam registrados quando o app iniciar
        import accounts.signals