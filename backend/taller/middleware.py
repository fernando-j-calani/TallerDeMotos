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
    
    # 1. PRIMERO: Si el frontend envía X-Client-IP (que obtuvo desde /api/get-client-ip/),
    #    usarla como fuente primaria
    client_ip_header = request.META.get('HTTP_X_CLIENT_IP', '').strip()
    if client_ip_header and client_ip_header not in ('127.0.0.1', '::1', 'unknown'):
        return client_ip_header
    
    # 2. SEGUNDO: Intentar extraer de X-Forwarded-For (para proxies)
    #    Tomar la última IP porque es la del cliente real
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '').strip()
    if x_forwarded_for:
        ips = [ip.strip() for ip in x_forwarded_for.split(',') if ip.strip()]
        for ip in reversed(ips):
            if ip and ip not in ('127.0.0.1', '::1'):
                return ip
    
    # 3. TERCERO: Otros headers comunes de proxies/CDNs
    for header in ['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP']:
        ip = request.META.get(header, '').strip()
        if ip and ip not in ('127.0.0.1', '::1'):
            return ip
    
    # 4. ÚLTIMO: REMOTE_ADDR (puede ser el proxy en Docker/proxies)
    remote_addr = request.META.get('REMOTE_ADDR', '').strip()
    if remote_addr and remote_addr not in ('127.0.0.1', '::1'):
        return remote_addr
    
    return None
