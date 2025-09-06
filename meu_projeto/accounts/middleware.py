# accounts/middleware.py

from django.utils.deprecation import MiddlewareMixin

class CacheControlMiddleware(MiddlewareMixin):
    """
    Middleware para adicionar cabeçalhos de controle de cache em respostas
    para usuários autenticados.
    
    Isso instrui o navegador a não armazenar em cache as páginas seguras,
    impedindo que um usuário deslogado possa usar o botão "voltar"
    para ver conteúdo restrito.
    """
    def process_response(self, request, response):
        # Verifica se o usuário da requisição está autenticado
        if request.user.is_authenticated:
            # Adiciona os cabeçalhos que impedem o cache
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        return response