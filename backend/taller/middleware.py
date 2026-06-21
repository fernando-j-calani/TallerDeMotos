import threading

_local = threading.local()


class CurrentRequestMiddleware:
    """Guarda el request actual en una variable de hilo, para que
    registrar_bitacora() pueda leer la IP del cliente sin que cada una de
    sus ~60 llamadas existentes tenga que pasar el request explícitamente.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _local.request = request
        try:
            return self.get_response(request)
        finally:
            _local.request = None


def obtener_ip_request_actual():
    request = getattr(_local, 'request', None)
    if not request:
        return None
    ip = (
        request.META.get('HTTP_X_FORWARDED_FOR')
        or request.META.get('REMOTE_ADDR')
        or ''
    ).split(',')[0].strip()
    return ip or None
