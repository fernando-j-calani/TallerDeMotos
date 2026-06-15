from django.core.management.base import BaseCommand
from django.db import transaction
from taller.models import Cliente, Usuario
from taller.views import obtener_o_crear_usuario_cliente


class Command(BaseCommand):
    help = 'Crea el Usuario (rol Cliente) correspondiente a cada Cliente que aún no tenga uno y sincroniza su email con el del cliente.'

    def handle(self, *args, **options):
        clientes = Cliente.objects.all().order_by('codigo')
        creados = 0
        actualizados = 0

        for cliente in clientes:
            with transaction.atomic():
                usuario, creado = obtener_o_crear_usuario_cliente(cliente)

            if creado:
                creados += 1
                self.stdout.write(self.style.SUCCESS(
                    f"✓ Cliente '{cliente.nombre}' -> usuario '{usuario.email}' creado."
                ))
                continue

            email_cliente = (cliente.email or '').strip()
            if email_cliente and usuario.email.lower() != email_cliente.lower():
                colision = Usuario.objects.filter(email__iexact=email_cliente).exclude(codigo=usuario.codigo).exists()
                if not colision:
                    anterior = usuario.email
                    usuario.email = email_cliente
                    usuario.save(update_fields=['email'])
                    actualizados += 1
                    self.stdout.write(self.style.SUCCESS(
                        f"✓ Usuario de '{cliente.nombre}': email actualizado de '{anterior}' a '{email_cliente}'."
                    ))

        if creados == 0 and actualizados == 0:
            self.stdout.write(self.style.SUCCESS('Todos los clientes ya tenían un usuario asociado y sincronizado.'))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'\nUsuarios creados: {creados}. Emails actualizados: {actualizados}. Total clientes: {clientes.count()}.'
            ))
