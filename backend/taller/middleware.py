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
    """Determina la IP real del cliente a partir de cabeceras que solo
    pueden poner los proxies/balanceadores de la infraestructura (Render,
    Azure App Service, nginx), NUNCA a partir de un header que el propio
    navegador del usuario pueda mandar (como el extinto 'X-Client-IP'):
    ese tipo de header es controlado por el cliente y cualquiera puede
    falsificarlo con DevTools/curl/Postman, lo que dejaría la Bitácora de
    auditoría con datos no confiables.
    """
    request = getattr(_local, 'request', None)
    if not request:
        return None

    # 1. X-Forwarded-For: el primer proxy de la cadena le agrega la IP real
    #    del cliente al inicio de la lista; los siguientes proxies/balanceadores
    #    van anexando la suya a la derecha. Por eso se toma la IP más a la
    #    izquierda que no sea loopback, no la más reciente.
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '').strip()
    if x_forwarded_for:
        ips = [ip.strip() for ip in x_forwarded_for.split(',') if ip.strip()]
        for ip in ips:
            if ip and ip not in ('127.0.0.1', '::1'):
                return ip

    # 2. Otros headers que ponen proxies/CDNs específicos (Cloudflare, nginx)
    for header in ['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP']:
        ip = request.META.get(header, '').strip()
        if ip and ip not in ('127.0.0.1', '::1'):
            return ip

    # 3. ÚLTIMO: REMOTE_ADDR (la conexión TCP directa; en Docker/desarrollo
    #    local puede ser la IP del gateway del contenedor, no la del usuario)
    remote_addr = request.META.get('REMOTE_ADDR', '').strip()
    if remote_addr and remote_addr not in ('127.0.0.1', '::1'):
        return remote_addr

    return None
