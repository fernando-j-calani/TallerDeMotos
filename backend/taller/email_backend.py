"""Backend de correo que usa la API HTTP de Brevo en vez de SMTP.

Render (y otros hosting similares) bloquea el trafico saliente por los
puertos SMTP (587/465), pero permite HTTPS sin restricciones. Este backend
implementa la misma interfaz que los backends de Django (send_messages),
asi que cualquier codigo existente que use send_mail()/EmailMessage.send()
sigue funcionando igual, sin tocar esos puntos.
"""
import base64
import json
import urllib.error
import urllib.request
from email.utils import parseaddr

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'


class BrevoApiEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        enviados = 0
        for mensaje in email_messages:
            if self._enviar_uno(mensaje):
                enviados += 1
        return enviados

    def _enviar_uno(self, mensaje):
        nombre_remitente, email_remitente = parseaddr(mensaje.from_email or settings.DEFAULT_FROM_EMAIL)

        payload = {
            "sender": {"name": nombre_remitente or "Taller La Roca", "email": email_remitente},
            "to": [{"email": destinatario} for destinatario in mensaje.to],
            "subject": mensaje.subject,
            "textContent": mensaje.body,
        }

        adjuntos = []
        for nombre_archivo, contenido, _content_type in getattr(mensaje, 'attachments', []):
            if isinstance(contenido, str):
                contenido = contenido.encode('utf-8')
            adjuntos.append({
                "name": nombre_archivo,
                "content": base64.b64encode(contenido).decode('ascii'),
            })
        if adjuntos:
            payload["attachment"] = adjuntos

        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(BREVO_API_URL, data=data, method='POST')
        req.add_header('Content-Type', 'application/json')
        req.add_header('Accept', 'application/json')
        req.add_header('api-key', settings.BREVO_API_KEY)

        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp.read()
            return True
        except urllib.error.HTTPError as exc:
            detalle = exc.read().decode('utf-8')
            if self.fail_silently:
                return False
            raise RuntimeError(f"Brevo respondio {exc.code}: {detalle}") from exc
        except urllib.error.URLError as exc:
            if self.fail_silently:
                return False
            raise RuntimeError(f"No se pudo conectar con Brevo: {exc}") from exc
