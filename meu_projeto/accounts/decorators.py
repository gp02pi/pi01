from functools import wraps
from django.utils import timezone

def add_session_timeout_context(view_func):
    """
    Decorator que calcula o tempo restante da sessão e o adiciona
    ao contexto da resposta da view.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        response = view_func(request, *args, **kwargs)

        if hasattr(response, 'context_data'):
            # Garante que response.context_data seja um dicionário antes de usá-lo.
            response.context_data = response.context_data or {}

            if request.user.is_authenticated:
                expiry_datetime = request.session.get_expiry_date()
                now = timezone.now()
                remaining_seconds = (expiry_datetime - now).total_seconds()

                # Adiciona um buffer de segurança (ex: 2 segundos)
                if remaining_seconds > 2:
                    timeout_ms = int(remaining_seconds - 2) * 1000
                    response.context_data['session_timeout_seconds'] = timeout_ms
        
        return response
    return _wrapped_view