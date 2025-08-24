# accounts/middleware.py

from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin

class SessionTimeoutMiddleware(MiddlewareMixin):
    """
    Middleware que adiciona o tempo restante da sessão ao contexto de
    respostas que renderizam templates.
    """
    def process_template_response(self, request, response):
        # Este método só é chamado para respostas que renderizam um template.
        
        if request.user.is_authenticated:
            try:
                expiry_datetime = request.session.get_expiry_date()
                now = timezone.now()
                
                remaining_seconds = (expiry_datetime - now).total_seconds()

                # Adiciona um buffer de 2 segundos
                if remaining_seconds > 2:
                    response.context_data['session_timeout_seconds'] = int(remaining_seconds - 2) * 1000
            except AttributeError:
                # Caso response.context_data não exista por algum motivo,
                # apenas ignoramos para não quebrar a aplicação.
                pass
        
        return response