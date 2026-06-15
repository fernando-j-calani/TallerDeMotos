"""Cliente minimo para la API REST de PayPal (Orders v2), usando solo
la libreria estandar (urllib) para no agregar dependencias nuevas.
"""
import base64
import json
import urllib.error
import urllib.request

from django.conf import settings


class PayPalError(Exception):
    pass


def _request(method, path, body=None, headers=None):
    url = f"{settings.PAYPAL_API_BASE}{path}"
    data = json.dumps(body).encode('utf-8') if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Content-Type', 'application/json')
    for clave, valor in (headers or {}).items():
        req.add_header(clave, valor)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        detalle = exc.read().decode('utf-8')
        raise PayPalError(f"PayPal respondio {exc.code}: {detalle}") from exc
    except urllib.error.URLError as exc:
        raise PayPalError(f"No se pudo conectar con PayPal: {exc}") from exc


def obtener_token_acceso():
    credenciales = f"{settings.PAYPAL_CLIENT_ID}:{settings.PAYPAL_SECRET}".encode('utf-8')
    auth = base64.b64encode(credenciales).decode('utf-8')

    url = f"{settings.PAYPAL_API_BASE}/v1/oauth2/token"
    data = b"grant_type=client_credentials"
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', f"Basic {auth}")
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            respuesta = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        detalle = exc.read().decode('utf-8')
        raise PayPalError(f"No se pudo autenticar con PayPal: {detalle}") from exc
    except urllib.error.URLError as exc:
        raise PayPalError(f"No se pudo conectar con PayPal: {exc}") from exc

    return respuesta['access_token']


def crear_orden_paypal(monto):
    token = obtener_token_acceso()
    cuerpo = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "amount": {
                    "currency_code": "USD",
                    "value": f"{monto:.2f}",
                }
            }
        ],
    }
    respuesta = _request(
        'POST',
        '/v2/checkout/orders',
        body=cuerpo,
        headers={'Authorization': f"Bearer {token}"},
    )
    return respuesta['id']


def capturar_orden_paypal(paypal_order_id):
    token = obtener_token_acceso()
    respuesta = _request(
        'POST',
        f"/v2/checkout/orders/{paypal_order_id}/capture",
        body={},
        headers={'Authorization': f"Bearer {token}"},
    )
    return respuesta.get('status'), respuesta.get('id')
