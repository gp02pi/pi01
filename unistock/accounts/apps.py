# seu_app/apps.py

from django.apps import AppConfig

class SeuAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Importa os sinais para que sejam registrados quando o app iniciar
        import accounts.signals