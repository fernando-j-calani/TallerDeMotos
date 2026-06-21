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
    
    # Intenta extraer la IP real desde encabezados comunes de proxy
    # En Render, Docker Compose, etc., vienen en estos headers
    
    # 1. X-Forwarded-For: lista de IPs, la última es la más confiable
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '').strip()
    if x_forwarded_for:
        ips = [ip.strip() for ip in x_forwarded_for.split(',') if ip.strip()]
        # Tomar la última IP válida (cliente real)
        for ip in reversed(ips):
            if ip and ip not in ('127.0.0.1', '::1'):
                return ip
    
    # 2. Otros headers comunes de proxies/CDNs
    for header in ['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP']:
        ip = request.META.get(header, '').strip()
        if ip and ip not in ('127.0.0.1', '::1'):
            return ip
    
    # 3. REMOTE_ADDR (último recurso, puede ser el proxy)
    remote_addr = request.META.get('REMOTE_ADDR', '').strip()
    if remote_addr and remote_addr not in ('127.0.0.1', '::1'):
        return remote_addr
    
    return None
