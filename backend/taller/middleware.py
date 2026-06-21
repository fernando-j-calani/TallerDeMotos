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
    
    # 1. PRIMERO: intentar obtener la IP desde el header que envía el frontend
    #    (capturada directamente desde el navegador con ipify)
    client_ip_header = request.META.get('HTTP_X_CLIENT_IP', '').strip()
    if client_ip_header and client_ip_header != '127.0.0.1':
        return client_ip_header
    
    # 2. FALLBACK: si no viene en header, intentar extraer de X-Forwarded-For
    #    (para proxies, tomar la última IP que es la más confiable)
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if x_forwarded_for:
        ips = [ip.strip() for ip in x_forwarded_for.split(',')]
        # Tomar la última IP válida
        for ip in reversed(ips):
            if ip and ip != '127.0.0.1':
                return ip
    
    # 3. FALLBACK: otros encabezados comunes
    for header in ['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP']:
        ip = request.META.get(header, '').strip()
        if ip and ip != '127.0.0.1':
            return ip
    
    # 4. ÚLTIMO: REMOTE_ADDR (puede ser el proxy)
    remote_addr = request.META.get('REMOTE_ADDR', '').strip()
    if remote_addr and remote_addr != '127.0.0.1':
        return remote_addr
    
    return None
