from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from django.core import signing # Para generar el Token de sesión
from django.core.signing import BadSignature, SignatureExpired
from django.core.files.storage import default_storage
from django.conf import settings
from django.utils import timezone
from django.http import HttpResponse
from django.core.mail import send_mail, EmailMessage
from django.core.cache import cache
from django.db import connection, IntegrityError, OperationalError, transaction
from django.db.models import Q, F, Sum
from django.utils.dateparse import parse_date
from .middleware import obtener_ip_request_actual
from datetime import datetime, timedelta
import math
import logging
import traceback
import json
import uuid
import secrets
import csv
import re
import unicodedata
from decimal import Decimal, InvalidOperation
from .models import (
    Usuario,
    Bitacora,
    Rol,
    Privilegio,
    PermisoModulo,
    Cliente,
    Motocicleta,
    Cotizacion,
    Detallecotizacion,
    Detalleordentrabajo,
    Ordentrabajo,
    Notatrabajo,
    Notaservicio,
    Factura,
    Seguimiento,
    Producto,
    Proveedor,
    Compra,
    Detallecompra,
    AjusteInventario,
)
from .serializers import BitacoraSerializer
from .serializers import (
    UsuarioSerializer,
    RolSerializer,
    PrivilegioSerializer,
    ClienteSerializer,
    MotocicletaSerializer,
    PerfilSerializer,
    ProveedorSerializer,
    ProductoSerializer,
    CotizacionSerializer,
    OrdenTrabajoSerializer,
    NotaTrabajoSerializer,
    CompraSerializer,
    PermisoModuloSerializer,
    NotaServicioSerializer,
    FacturaSerializer,
    HistorialOrdenSerializer,
    DetalleOrdenTrabajoSerializer,
    SeguimientoSerializer,
)
from django.contrib.auth.hashers import make_password
from .reportes_export import columnas_para, generar_csv_reporte, generar_excel_reporte, generar_pdf_reporte
from .paypal_client import crear_orden_paypal, capturar_orden_paypal, PayPalError


MAX_LOGIN_INTENTOS = 3
LOGIN_BLOQUEO_SEGUNDOS = 60
logger = logging.getLogger(__name__)


def registrar_bitacora(usuario, accion, descripcion):
    ip = obtener_ip_request_actual()
    Bitacora.objects.create(
        id_usuario=usuario,
        fecha_hora=timezone.now(),
        accion=accion,
        descripcion=descripcion,
        ip=ip,
    )


def obtener_usuario_autenticado(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, Response({"exito": False, "error": "Token no proporcionado."}, status=401)

    token = auth_header.split(' ', 1)[1].strip()
    if not token:
        return None, Response({"exito": False, "error": "Token inválido."}, status=401)

    try:
        token_data = signing.loads(token, max_age=settings.TOKEN_MAX_AGE_SECONDS)
        usuario = Usuario.objects.get(codigo=token_data.get('id_usuario'))

        pwd_sig = token_data.get('pwd_sig')
        current_pwd_sig = usuario.contrasena[-16:]
        if pwd_sig != current_pwd_sig:
            return None, Response({"exito": False, "error": "Sesión inválida. Inicie sesión nuevamente."}, status=401)

        if token_data.get('sesion') != usuario.sesion_actual:
            return None, Response(
                {
                    "exito": False,
                    "error": "Tu sesión se cerró porque iniciaste sesión en otro dispositivo.",
                    "sesion_reemplazada": True,
                },
                status=401,
            )

        requiere_cambio = (
            usuario.id_rol.nombre == 'Cliente'
            and check_password(settings.CLIENT_TEMP_PASSWORD, usuario.contrasena)
        )
        rutas_permitidas = {'/api/password/force-change/', '/api/logout/', '/api/refresh-token/'}
        if requiere_cambio and request.path not in rutas_permitidas:
            return None, Response(
                {
                    "exito": False,
                    "error": "Debe cambiar su contraseña antes de continuar.",
                    "requires_password_change": True,
                },
                status=403,
            )

        return usuario, None
    except SignatureExpired:
        return None, Response({"exito": False, "error": "Token expirado."}, status=401)
    except (BadSignature, Usuario.DoesNotExist, TypeError, ValueError):
        return None, Response({"exito": False, "error": "Token inválido."}, status=401)


def exigir_admin(usuario):
    if usuario.id_rol.nombre != 'Administrador':
        return Response({"exito": False, "error": "No autorizado. Solo Administrador."}, status=403)
    return None


def exigir_roles(usuario, roles_permitidos):
    if usuario.id_rol.nombre not in roles_permitidos:
        return Response({"exito": False, "error": "No autorizado para esta operación."}, status=403)
    return None


def tiene_permiso_modulo(usuario, codigo_cu, accion):
    try:
        ensure_permiso_modulo_table()
    except Exception as e:
        print(f"[DEBUG] Error en ensure_permiso_modulo_table: {e}")
        return False
    
    try:
        return PermisoModulo.objects.filter(
            id_rol=usuario.id_rol,
            codigo_cu=codigo_cu,
            accion__iexact=accion,
            permitido=True,
        ).exists()
    except Exception as e:
        print(f"[DEBUG] Error verificando permiso {codigo_cu}-{accion}: {e}")
        return False


def exigir_permiso_modulo(usuario, codigo_cu, acciones):
    # Administrador siempre tiene acceso a todo
    if usuario.id_rol.nombre and usuario.id_rol.nombre.strip().lower() == 'administrador':
        return None

    if isinstance(acciones, (list, tuple, set)):
        acciones_validas = acciones
    else:
        acciones_validas = [acciones]

    if any(tiene_permiso_modulo(usuario, codigo_cu, accion) for accion in acciones_validas):
        return None

    return Response({"exito": False, "error": "No autorizado para esta operación."}, status=403)


def ensure_permiso_modulo_table():
    """Asegura que la tabla permiso_modulo existe y está inicializada con los permisos"""
    try:
        # Verificar si la tabla existe
        table_exists = False
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                          AND table_name = 'permiso_modulo'
                    )
                    """
                )
                table_exists = cursor.fetchone()[0]
        except Exception as e:
            print(f"[DEBUG] Error verificando tabla permiso_modulo: {e}")
            return
        
        if not table_exists:
            try:
                with connection.cursor() as cursor:
                    # Crear tabla
                    cursor.execute(
                        """
                        CREATE TABLE IF NOT EXISTS public.permiso_modulo (
                            id serial PRIMARY KEY,
                            id_rol integer NOT NULL REFERENCES rol(codigo),
                            codigo_cu varchar(20) NOT NULL,
                            nombre_modulo varchar(255) NOT NULL,
                            accion varchar(50) NOT NULL,
                            permitido boolean NOT NULL DEFAULT true
                        )
                        """
                    )
                    # Crear índice único
                    cursor.execute(
                        """
                        CREATE UNIQUE INDEX IF NOT EXISTS permiso_modulo_unique_idx
                        ON public.permiso_modulo (id_rol, codigo_cu, nombre_modulo, accion)
                        """
                    )
                print("[DEBUG] Tabla permiso_modulo creada exitosamente")
            except Exception as e:
                print(f"[DEBUG] Error creando tabla permiso_modulo: {e}")
                return
        
        # Inicializar permisos si faltan
        try:
            print("[DEBUG] Inicializando permisos de módulo si faltan...")
            _inicializar_permisos()
            print("[DEBUG] Permisos inicializados exitosamente")
        except Exception as e:
            print(f"[DEBUG] Error inicializando permisos: {e}")
    except Exception as e:
        print(f"[DEBUG] Error en ensure_permiso_modulo_table: {e}")


def _normalizar_clave_rol(texto):
    """Colapsa cualquier secuencia de caracteres no alfanuméricos a un único
    separador, para poder emparejar nombres de rol aunque tengan tildes
    corrompidas (p. ej. 'Mec??nico' en la BD vs 'Mecánico' en el código)."""
    return re.sub(r'[^a-z0-9]+', '#', (texto or '').lower().strip())


def _buscar_rol_por_nombre(nombre_rol):
    rol = Rol.objects.filter(nombre=nombre_rol).first()
    if rol:
        return rol

    objetivo = _normalizar_clave_rol(nombre_rol)
    for candidato in Rol.objects.all():
        if _normalizar_clave_rol(candidato.nombre) == objetivo:
            return candidato
    return None


def _inicializar_permisos():
    """Crea los permisos iniciales para todos los roles no-administrador"""
    
    permisos_por_rol = {
        'Recepcionista': {
            'CU05': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
            'CU06': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
            'CU07': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
            'CU08': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
            'CU09': ['Mostrar', 'Buscar', 'Adicionar'],
            'CU10': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
            'CU11': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
            'CU12': ['Mostrar', 'Buscar', 'Adicionar'],
            'CU13': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
            'CU14': ['Mostrar', 'Buscar', 'Adicionar', 'Eliminar'],
            'CU15': ['Mostrar', 'Buscar', 'Exportar'],
            'CU16': ['Mostrar', 'Buscar', 'Adicionar'],
            'CU18': ['Mostrar', 'Buscar', 'Exportar'],
        },
        'Mecánico': {
            'CU08': ['Mostrar', 'Buscar'],
            'CU09': ['Mostrar', 'Buscar', 'Adicionar'],
            'CU10': ['Mostrar', 'Buscar'],
            'CU11': ['Mostrar', 'Buscar'],
            'CU13': ['Mostrar', 'Buscar'],
        },
        'Cliente': {
            'CU05': ['Mostrar'],
            'CU06': ['Mostrar'],
            'CU08': ['Mostrar', 'Buscar'],
            'CU09': ['Mostrar', 'Buscar'],
            'CU14': ['Mostrar', 'Buscar'],
            'CU16': ['Mostrar', 'Buscar', 'Adicionar'],
        },
    }
    
    # IMPORTANTE: estos nombres deben coincidir EXACTAMENTE con los de
    # PERMISOS_DATA en frontend/src/AsignarPrivilegios.js. Si difieren,
    # get_or_create() crea una fila duplicada con el nombre nuevo en vez de
    # reutilizar la fila existente, y una revocación hecha desde Asignar
    # Privilegios queda "fantasma": la fila vieja (con el nombre antiguo y
    # permitido=True) sigue otorgando el permiso aunque el admin lo haya quitado.
    nombres_modulos = {
        'CU05': 'Gestionar Clientes',
        'CU06': 'Gestionar Motocicletas',
        'CU07': 'Elaborar Cotizaciones',
        'CU08': 'Gestionar Órdenes de Trabajo',
        'CU09': 'Redactar Notas de Trabajo',
        'CU10': 'Gestionar Productos (Repuestos)',
        'CU11': 'Monitorear Inventario',
        'CU12': 'Procesar Compras a Proveedores',
        'CU13': 'Administrar Proveedores',
        'CU14': 'Emitir Facturación',
        'CU15': 'Consultar Historial de Mantenimiento',
        'CU16': 'Dar Seguimiento para Clientes',
        'CU18': 'Generar Reportes',
    }
    
    try:
        with transaction.atomic():
            contador = 0
            for nombre_rol, permisos_cu in permisos_por_rol.items():
                rol = _buscar_rol_por_nombre(nombre_rol)
                if not rol:
                    print(f"[DEBUG] Rol '{nombre_rol}' no encontrado")
                    continue
                
                for codigo_cu, acciones in permisos_cu.items():
                    nombre_modulo = nombres_modulos.get(codigo_cu, codigo_cu)
                    
                    for accion in acciones:
                        try:
                            perm, creado = PermisoModulo.objects.get_or_create(
                                id_rol=rol,
                                codigo_cu=codigo_cu,
                                nombre_modulo=nombre_modulo,
                                accion=accion,
                                defaults={'permitido': True}
                            )
                            if creado:
                                contador += 1
                        except Exception as e:
                            print(f"[DEBUG] Error creando permiso {nombre_rol}-{codigo_cu}-{accion}: {e}")
            
            print(f"[DEBUG] Total permisos creados: {contador}")
    except Exception as e:
        print(f"[DEBUG] Error en _inicializar_permisos: {e}")


def normalizar_usuario_desde_nombre(nombre_completo):
    texto = unicodedata.normalize('NFKD', nombre_completo or '')
    texto = ''.join(ch for ch in texto if not unicodedata.combining(ch))
    texto = texto.lower()
    partes = re.findall(r'[a-z0-9]+', texto)
    base = ''.join(partes)
    return base or 'cliente'


def resolver_rol_por_nombre(nombre_rol):
    if not nombre_rol:
        return None

    rol = Rol.objects.filter(nombre__iexact=nombre_rol).first()
    if rol:
        return rol

    nombre_normalizado = normalizar_usuario_desde_nombre(nombre_rol)
    for candidato in Rol.objects.all():
        if normalizar_usuario_desde_nombre(candidato.nombre) == nombre_normalizado:
            return candidato

    return None


def generar_usuario_unico_para_cliente(nombre_completo):
    base = normalizar_usuario_desde_nombre(nombre_completo)
    candidato = base
    i = 1
    while Usuario.objects.filter(email=candidato).exists():
        candidato = f"{base}{i}"
        i += 1
    return candidato


def obtener_o_crear_usuario_cliente(cliente):
    """Garantiza que exista un Usuario con rol 'Cliente' vinculado al cliente dado.

    Devuelve una tupla (usuario, creado).
    """
    try:
        rol_cliente = Rol.objects.get(nombre='Cliente')
    except Rol.DoesNotExist:
        rol_cliente = Rol.objects.create(nombre='Cliente', descripcion='Rol de cliente final')

    usuario_cliente = Usuario.objects.filter(nombre=cliente.nombre, id_rol=rol_cliente).first()
    if usuario_cliente:
        return usuario_cliente, False

    email_cliente = (cliente.email or '').strip()
    if email_cliente and not Usuario.objects.filter(email__iexact=email_cliente).exists():
        email_usuario = email_cliente
    else:
        email_usuario = generar_usuario_unico_para_cliente(cliente.nombre)

    usuario_cliente = Usuario.objects.create(
        id_rol=rol_cliente,
        nombre=cliente.nombre,
        email=email_usuario,
        contrasena=make_password(settings.CLIENT_TEMP_PASSWORD),
        telefono=cliente.telefono,
        estado='Activo',
    )
    return usuario_cliente, True


def obtener_cliente_vinculado(usuario_sesion):
    nombre_usuario = (usuario_sesion.nombre or '').strip()
    if not nombre_usuario:
        return None

    nombre_normalizado = normalizar_usuario_desde_nombre(nombre_usuario)
    clientes = Cliente.objects.filter(estado='Activo').order_by('codigo')

    for cliente in clientes:
      if normalizar_usuario_desde_nombre(cliente.nombre) == nombre_normalizado:
        return cliente

    return None


def excede_limite(clave, limite, ventana_segundos):
    actual = cache.get(clave)
    if actual is None:
        cache.set(clave, 1, timeout=ventana_segundos)
        return False

    if int(actual) >= limite:
        return True

    try:
        cache.incr(clave)
    except ValueError:
        cache.set(clave, int(actual) + 1, timeout=ventana_segundos)
    return False


def _normalizar_correo_login(correo):
    return (correo or '').strip().lower()


def _clave_intentos_fallidos(correo_normalizado):
    return f"login:intentos:{correo_normalizado}"


def _clave_bloqueo_login(correo_normalizado):
    return f"login:bloqueo:{correo_normalizado}"


def _segundos_restantes_bloqueo(correo_normalizado):
    desbloqueo_en = cache.get(_clave_bloqueo_login(correo_normalizado))
    if not desbloqueo_en:
        return 0

    restante = int(math.ceil(float(desbloqueo_en) - timezone.now().timestamp()))
    return max(0, restante)


def _registrar_password_incorrecta(correo_normalizado):
    clave_intentos = _clave_intentos_fallidos(correo_normalizado)
    intentos_actuales = int(cache.get(clave_intentos, 0)) + 1

    if intentos_actuales >= MAX_LOGIN_INTENTOS:
        cache.delete(clave_intentos)
        cache.set(
            _clave_bloqueo_login(correo_normalizado),
            timezone.now().timestamp() + LOGIN_BLOQUEO_SEGUNDOS,
            timeout=LOGIN_BLOQUEO_SEGUNDOS,
        )
        return True, 0

    cache.set(clave_intentos, intentos_actuales, timeout=LOGIN_BLOQUEO_SEGUNDOS)
    return False, (MAX_LOGIN_INTENTOS - intentos_actuales)


def _limpiar_estado_login(correo_normalizado):
    cache.delete(_clave_intentos_fallidos(correo_normalizado))
    cache.delete(_clave_bloqueo_login(correo_normalizado))


def validar_password_segura(password):
    if not password:
        return "La nueva contraseña es obligatoria."

    if len(password) < 8:
        return "La nueva contraseña debe tener al menos 8 caracteres."

    if not re.search(r'[a-z]', password):
        return "La nueva contraseña debe incluir al menos una letra minúscula."

    if not re.search(r'[A-Z]', password):
        return "La nueva contraseña debe incluir al menos una letra mayúscula."

    if not re.search(r'[^A-Za-z0-9]', password):
        return "La nueva contraseña debe incluir al menos un carácter especial."

    return None


def _normalizar_alias_destinatario(valor):
    texto = unicodedata.normalize('NFKD', valor or '')
    texto = ''.join(ch for ch in texto if not unicodedata.combining(ch))
    texto = texto.lower()
    texto = re.sub(r'[^a-z0-9]+', '', texto)
    return texto or 'usuario'


def _resolver_destinatario_reset_online(usuario):
    destinatario_original = (usuario.email or '').strip().lower()

    if settings.MAIL_MODE != 'online':
        return destinatario_original

    if not destinatario_original.endswith('@laroca.com'):
        return destinatario_original

    inbox = (getattr(settings, 'MAIL_ONLINE_TEST_INBOX', '') or '').strip().lower()
    if '@' not in inbox:
        return destinatario_original

    local_inbox, dominio_inbox = inbox.split('@', 1)
    alias = _normalizar_alias_destinatario(destinatario_original.split('@', 1)[0])
    return f"{local_inbox}+{alias}@{dominio_inbox}"


def _enviar_codigo_verificacion(usuario, cache_prefix, asunto, intro_mensaje):
    """Genera un código de 6 dígitos, lo cachea y lo envía por correo al usuario."""
    codigo = f"{secrets.randbelow(1000000):06d}"
    cache.set(f"{cache_prefix}:code:{usuario.codigo}", codigo, timeout=settings.PASSWORD_RESET_CODE_MAX_AGE_SECONDS)
    cache.delete(f"{cache_prefix}:code_attempts:{usuario.codigo}")

    destinatario_envio = _resolver_destinatario_reset_online(usuario)

    if settings.PASSWORD_RESET_LOG_TO_CONSOLE:
        print(
            f"[{cache_prefix.upper()}] mode={settings.MAIL_MODE} from={settings.DEFAULT_FROM_EMAIL} "
            f"to={destinatario_envio} original={usuario.email} codigo={codigo}"
        )

    for intento in range(1, settings.EMAIL_SEND_RETRIES + 1):
        try:
            send_mail(
                subject=asunto,
                message=(
                    f'{intro_mensaje}\n\n'
                    f'Tu código de confirmación es: {codigo}\n'
                    f'Este código es válido por {settings.PASSWORD_RESET_CODE_MAX_AGE_SECONDS // 60} minutos.\n\n'
                    'Si no solicitaste esto, ignora este mensaje.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[destinatario_envio],
                fail_silently=False,
            )
            if settings.PASSWORD_RESET_LOG_TO_CONSOLE:
                print(f"[{cache_prefix.upper()}] intento={intento} resultado_envio=ok")
            return
        except Exception as exc:
            if settings.PASSWORD_RESET_LOG_TO_CONSOLE:
                print(f"[{cache_prefix.upper()}] intento={intento} error_envio={exc}")

            es_dns_temporal = isinstance(exc, OSError) and getattr(exc, 'errno', None) == -3
            if not es_dns_temporal:
                return


def _normalizar_decimal(valor):
    if valor is None or valor == '':
        return None
    try:
        return Decimal(str(valor))
    except (InvalidOperation, ValueError, TypeError):
        return None


def _validar_detalle_cotizacion(detalle):
    if not isinstance(detalle, dict):
        return None, "Cada detalle debe ser un objeto válido."

    tipo = (detalle.get('tipo') or '').strip()
    descripcion = (detalle.get('descripcion') or '').strip()
    cantidad_raw = detalle.get('cantidad')
    cantidad = None
    try:
        cantidad = int(cantidad_raw)
    except (TypeError, ValueError):
        return None, "La cantidad del item debe ser un número entero."

    if cantidad <= 0:
        return None, "La cantidad del item debe ser mayor que cero."

    id_producto = detalle.get('id_producto')
    precio_unitario = _normalizar_decimal(detalle.get('precio_unitario'))
    subtotal = _normalizar_decimal(detalle.get('subtotal'))

    if id_producto in (None, ''):
        id_producto = None
    else:
        try:
            producto = Producto.objects.get(codigo=id_producto)
        except Producto.DoesNotExist:
            return None, f"Producto con id {id_producto} no encontrado."

        id_producto = producto.codigo
        if not tipo:
            tipo = 'Producto'
        if not descripcion:
            descripcion = producto.nombre or 'Producto'
        if precio_unitario is None:
            precio_unitario = producto.precio_venta

    if not tipo:
        return None, "El tipo del item es obligatorio."

    if not descripcion:
        return None, "La descripción del item es obligatoria."

    if precio_unitario is None or precio_unitario < 0:
        return None, "El precio unitario del item es inválido."

    subtotal_esperado = precio_unitario * Decimal(cantidad)
    if subtotal is None:
        subtotal = subtotal_esperado
    elif subtotal != subtotal_esperado:
        return None, "El subtotal del item no coincide con cantidad * precio_unitario."

    return {
        'tipo': tipo,
        'descripcion': descripcion,
        'cantidad': cantidad,
        'precio_unitario': precio_unitario,
        'subtotal': subtotal,
        'id_producto_id': id_producto,
    }, None


def _validar_cliente_motocicleta_para_cotizacion(cliente, motocicleta):
    if not cliente:
        return "Cliente no encontrado."

    if (cliente.estado or 'Activo') != 'Activo':
        return "El cliente debe estar activo para generar cotizaciones."

    if not motocicleta:
        return "Motocicleta no encontrada."

    if (motocicleta.estado or 'Activo') != 'Activo':
        return "La motocicleta debe estar activa para generar cotizaciones."

    if motocicleta.id_cliente_id != cliente.codigo:
        return "La motocicleta no pertenece al cliente seleccionado."

    return None


def _validar_detalle_orden_trabajo(detalle):
    if not isinstance(detalle, dict):
        return None, "Cada detalle debe ser un objeto válido."

    tipo = (detalle.get('tipo') or '').strip()
    descripcion = (detalle.get('descripcion') or '').strip()
    cantidad_raw = detalle.get('cantidad')
    try:
        cantidad = int(cantidad_raw)
    except (TypeError, ValueError):
        return None, "La cantidad del detalle debe ser un número entero."

    if cantidad <= 0:
        return None, "La cantidad del detalle debe ser mayor que cero."

    id_producto = detalle.get('id_producto')
    precio_unitario = _normalizar_decimal(detalle.get('precio_unitario'))
    subtotal = _normalizar_decimal(detalle.get('subtotal'))
    provisto_por_cliente = detalle.get('provisto_por_cliente', False)
    provisto_por_cliente = bool(provisto_por_cliente)

    producto = None
    if id_producto not in (None, ''):
        try:
            producto = Producto.objects.get(codigo=id_producto)
        except Producto.DoesNotExist:
            return None, f"Producto con id {id_producto} no encontrado."

        if not tipo:
            tipo = 'Repuesto'
        if not descripcion:
            descripcion = producto.nombre or 'Repuesto'
        if precio_unitario is None:
            precio_unitario = producto.precio_venta

    if not tipo:
        return None, "El tipo del detalle es obligatorio."

    if not descripcion:
        return None, "La descripción del detalle es obligatoria."

    if precio_unitario is None or precio_unitario < 0:
        return None, "El precio unitario del detalle es inválido."

    subtotal_esperado = precio_unitario * Decimal(cantidad)
    if subtotal is None:
        subtotal = subtotal_esperado
    elif subtotal != subtotal_esperado:
        return None, "El subtotal del detalle no coincide con cantidad * precio_unitario."

    return {
        'id_producto': producto,
        'tipo': tipo,
        'descripcion': descripcion,
        'cantidad': cantidad,
        'provisto_por_cliente': provisto_por_cliente,
        'precio_unitario': precio_unitario,
        'subtotal': subtotal,
    }, None


def _validar_orden_para_nota(orden):
    if not orden:
        return "Orden de trabajo no encontrada."

    estado = (orden.estado or '').strip()
    if estado in ('Finalizado', 'Facturado', 'Cancelado'):
        return f"No se pueden registrar notas en una orden con estado '{estado}'."

    return None


# ==========================================
# DEBUG ENDPOINT
# ==========================================
@api_view(['POST'])
def debug_login(request):
    email = request.data.get('email') if hasattr(request, 'data') else request.POST.get('email')
    password = request.data.get('password') if hasattr(request, 'data') else request.POST.get('password')
    
    logger.warning(f"DEBUG: email={email}, password={password}")
    logger.warning(f"DEBUG: request.data={getattr(request, 'data', None)}")
    logger.warning(f"DEBUG: request.POST={dict(request.POST)}")
    
    return Response({"debug": f"email={email}, password={password}"}, status=200)

# ==========================================
# CU01: GESTIONAR INICIO DE SESIÓN
# ==========================================
@api_view(['POST'])
def login_api(request):
    correo_recibido = request.data.get('email')
    password_recibida = request.data.get('password')
    correo_normalizado = _normalizar_correo_login(correo_recibido)

    if not correo_normalizado or not password_recibida:
        return Response({"exito": False, "error": "Email y contraseña son obligatorios."}, status=400)

    segundos_restantes = _segundos_restantes_bloqueo(correo_normalizado)
    if segundos_restantes > 0:
        return Response(
            {
                "exito": False,
                "error": f"Cuenta bloqueada temporalmente. Intente nuevamente en {segundos_restantes} segundos.",
            },
            status=423,
        )

    try:
        usuario = Usuario.objects.get(email__iexact=correo_normalizado)
        
        # LA MAGIA: Compara el '123456' que escribe el usuario con el Hash de la BD
        if check_password(password_recibida, usuario.contrasena):
            _limpiar_estado_login(correo_normalizado)

            if (usuario.estado or 'Activo') != 'Activo':
                return Response({"exito": False, "error": "Usuario inactivo."}, status=403)

            requiere_cambio = (
                usuario.id_rol.nombre == 'Cliente'
                and check_password(settings.CLIENT_TEMP_PASSWORD, usuario.contrasena)
            )
            
            # Sesión única por cuenta: cada login genera un identificador nuevo y lo
            # guarda en el usuario, invalidando cualquier sesión anterior (otro
            # dispositivo/navegador) ya que su token quedará con un 'sesion' viejo.
            nueva_sesion = secrets.token_hex(16)
            usuario.sesion_actual = nueva_sesion
            usuario.save(update_fields=['sesion_actual'])

            # Generamos un TOKEN firmado criptográficamente para que React lo guarde
            token_data = {
                'id_usuario': usuario.codigo,
                'rol': usuario.id_rol.nombre,
                'pwd_sig': usuario.contrasena[-16:],
                'sesion': nueva_sesion,
            }
            token_seguro = signing.dumps(token_data)

            # --- NUEVO: REGISTRAR LOGIN EN BITÁCORA CON IP ---
            registrar_bitacora(
                usuario,
                'LOGIN',
                f"El usuario {usuario.nombre} inició sesión en el sistema."
            )
            # ------------------------------------------

            return Response({
                "exito": True,
                "mensaje": f"¡Bienvenido, {usuario.nombre}!",
                "token": token_seguro,
                "usuario": {
                    "id": usuario.codigo,
                    "nombre": usuario.nombre,
                    "rol": usuario.id_rol.nombre
                },
                "requires_password_change": requiere_cambio,
            }, status=200)
        else:
            bloqueado, restantes = _registrar_password_incorrecta(correo_normalizado)
            if bloqueado:
                registrar_bitacora(
                    usuario,
                    'BLOQUEO_CUENTA',
                    f"Cuenta bloqueada por 1 minuto tras 3 intentos fallidos de contraseña para el usuario {usuario.nombre}.",
                )
                return Response(
                    {
                        "exito": False,
                        "error": "Se alcanzó el máximo de 3 intentos fallidos. Cuenta bloqueada por 1 minuto.",
                    },
                    status=423,
                )

            return Response(
                {
                    "exito": False,
                    "error": f"Contraseña incorrecta. Le quedan {restantes} intento(s).",
                },
                status=401,
            )
            
    except Usuario.DoesNotExist:
        return Response({"exito": False, "error": "El correo no existe en el sistema"}, status=404)
    
# ==========================================
# REFRESCAR TOKEN (mantiene la sesión viva mientras el usuario está activo)
# ==========================================
@api_view(['POST'])
def refresh_token_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    # Volvemos a firmar el token con un timestamp nuevo: esto reinicia la
    # ventana de expiración de TOKEN_MAX_AGE_SECONDS sin tocar 'sesion_actual',
    # asi que no afecta el control de sesión única por dispositivo.
    token_data = {
        'id_usuario': usuario_sesion.codigo,
        'rol': usuario_sesion.id_rol.nombre,
        'pwd_sig': usuario_sesion.contrasena[-16:],
        'sesion': usuario_sesion.sesion_actual,
    }
    token_seguro = signing.dumps(token_data)

    return Response({"exito": True, "token": token_seguro}, status=200)

# ==========================================
# CERRAR SESIÓN (Para la Bitácora)
# ==========================================
@api_view(['POST'])
def logout_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    usuario_sesion.sesion_actual = None
    usuario_sesion.save(update_fields=['sesion_actual'])

    # --- NUEVO: REGISTRAR LOGOUT EN BITÁCORA ---
    registrar_bitacora(
        usuario_sesion,
        'LOGOUT',
        f"El usuario {usuario_sesion.nombre} cerró su sesión."
    )
    return Response({"exito": True}, status=200)

# ==========================================
# CU20: GESTIONAR BITÁCORA
# ==========================================
@api_view(['GET'])
def bitacora_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    usuario_id = request.GET.get('usuario')
    accion = request.GET.get('accion', '').strip()
    fecha_desde = request.GET.get('fecha_desde', '').strip()
    fecha_hasta = request.GET.get('fecha_hasta', '').strip()
    exportar = request.GET.get('export', '').strip().lower()

    if usuario_sesion.id_rol.nombre != 'Administrador':
        acciones_requeridas = []
        if exportar == 'csv':
            acciones_requeridas.append('Exportar')
        if usuario_id or accion or fecha_desde or fecha_hasta:
            acciones_requeridas.append('Buscar')
        if not acciones_requeridas:
            acciones_requeridas.append('Mostrar')

        if not any(tiene_permiso_modulo(usuario_sesion, 'CU20', acc) for acc in acciones_requeridas):
            return Response({"exito": False, "error": "No autorizado para ver la bitacora."}, status=403)

    registros = Bitacora.objects.select_related('id_usuario', 'id_usuario__id_rol').all()

    if usuario_id:
        registros = registros.filter(id_usuario_id=usuario_id)

    if accion:
        registros = registros.filter(accion__iexact=accion)

    if fecha_desde:
        fecha_desde_obj = parse_date(fecha_desde)
        if not fecha_desde_obj:
            return Response({"exito": False, "error": "fecha_desde inválida. Use formato YYYY-MM-DD."}, status=400)
        registros = registros.filter(fecha_hora__date__gte=fecha_desde_obj)

    if fecha_hasta:
        fecha_hasta_obj = parse_date(fecha_hasta)
        if not fecha_hasta_obj:
            return Response({"exito": False, "error": "fecha_hasta inválida. Use formato YYYY-MM-DD."}, status=400)
        registros = registros.filter(fecha_hora__date__lte=fecha_hasta_obj)

    registros = registros.order_by('-fecha_hora')

    if exportar == 'csv':
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="bitacora.csv"'

        writer = csv.writer(response)
        writer.writerow(['codigo', 'fecha_hora', 'usuario', 'rol', 'accion', 'descripcion', 'ip'])

        for reg in registros:
            writer.writerow([
                reg.codigo,
                reg.fecha_hora.isoformat() if reg.fecha_hora else '',
                reg.id_usuario.nombre if reg.id_usuario else '',
                reg.id_usuario.id_rol.nombre if reg.id_usuario and reg.id_usuario.id_rol else '',
                reg.accion,
                reg.descripcion,
                reg.ip if reg.ip else '',
            ])
        return response

    # --- Estadísticas sobre el conjunto filtrado (antes de paginar) ---
    valores = list(registros.values('fecha_hora', 'accion', 'id_usuario__nombre'))
    total_registros = len(valores)
    hoy_la_paz = BitacoraSerializer._to_la_paz(timezone.now()).date()

    eventos_hoy = 0
    contador_acciones = {}
    contador_usuarios = {}
    for valor in valores:
        fecha_local = BitacoraSerializer._to_la_paz(valor['fecha_hora'])
        if fecha_local and fecha_local.date() == hoy_la_paz:
            eventos_hoy += 1

        accion_valor = valor['accion']
        if accion_valor:
            contador_acciones[accion_valor] = contador_acciones.get(accion_valor, 0) + 1

        usuario_nombre = valor['id_usuario__nombre']
        if usuario_nombre:
            contador_usuarios[usuario_nombre] = contador_usuarios.get(usuario_nombre, 0) + 1

    accion_top, accion_top_total = max(contador_acciones.items(), key=lambda x: x[1], default=(None, 0))
    usuario_top, usuario_top_total = max(contador_usuarios.items(), key=lambda x: x[1], default=(None, 0))

    estadisticas = {
        'total_eventos': total_registros,
        'eventos_hoy': eventos_hoy,
        'accion_mas_frecuente': accion_top,
        'accion_mas_frecuente_total': accion_top_total,
        'usuario_mas_activo': usuario_top,
        'usuario_mas_activo_total': usuario_top_total,
    }

    # --- Paginación ---
    try:
        pagina = int(request.GET.get('page', '1'))
    except ValueError:
        pagina = 1
    try:
        por_pagina = int(request.GET.get('page_size', '25'))
    except ValueError:
        por_pagina = 25

    pagina = max(pagina, 1)
    por_pagina = min(max(por_pagina, 1), 100)
    total_paginas = max(math.ceil(total_registros / por_pagina), 1) if total_registros else 1
    pagina = min(pagina, total_paginas)

    inicio = (pagina - 1) * por_pagina
    registros_pagina = registros[inicio:inicio + por_pagina]

    serializer = BitacoraSerializer(registros_pagina, many=True)
    return Response({
        'resultados': serializer.data,
        'paginacion': {
            'pagina': pagina,
            'por_pagina': por_pagina,
            'total_registros': total_registros,
            'total_paginas': total_paginas,
        },
        'estadisticas': estadisticas,
    }, status=200)

# ==========================================
# CU02: GESTIONAR USUARIOS
# ==========================================
@api_view(['GET', 'POST'])
def usuarios_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_admin = exigir_admin(usuario_sesion)
    if error_admin:
        return error_admin

    if request.method == 'GET':
        # Devolvemos todos los usuarios ordenados por ID
        usuarios = Usuario.objects.all().order_by('codigo')
        serializer = UsuarioSerializer(usuarios, many=True)
        data = serializer.data
        for usuario_data, usuario_obj in zip(data, usuarios):
            es_rol_cliente = (usuario_data.get('rol_nombre') or '').strip().lower() == 'cliente'
            usuario_data['es_rol_cliente'] = es_rol_cliente
            usuario_data['cliente_vinculado'] = bool(es_rol_cliente and obtener_cliente_vinculado(usuario_obj))
        return Response(data, status=200)

    elif request.method == 'POST':
        # Lógica para CREAR un nuevo usuario
        datos = request.data
        email = (datos.get('email') or '').strip().lower()

        if not email:
            return Response({"exito": False, "error": "El email es obligatorio."}, status=400)

        if Usuario.objects.filter(email__iexact=email).exists():
            return Response({"exito": False, "error": "Ya existe un usuario registrado con ese email."}, status=400)

        try:
            rol_asignado = Rol.objects.get(codigo=datos['id_rol'])

            es_rol_cliente = (rol_asignado.nombre or '').strip().lower() == 'cliente'
            cedula = (datos.get('cedula') or '').strip()
            if es_rol_cliente:
                if not cedula:
                    return Response({"exito": False, "error": "La cédula es obligatoria para usuarios con rol Cliente."}, status=400)
                if Cliente.objects.filter(cedula=cedula).exists():
                    return Response({"exito": False, "error": "Ya existe un cliente registrado con esa cédula."}, status=400)

            nuevo_usuario = Usuario.objects.create(
                nombre=datos['nombre'],
                email=email,
                # ¡Encriptamos la contraseña antes de guardarla!
                contrasena=make_password(datos['password']),
                telefono=datos.get('telefono', ''),
                estado='Activo',
                id_rol=rol_asignado
            )

            # --- NUEVO: REGISTRAR CREACIÓN EN BITÁCORA ---
            registrar_bitacora(
                usuario_sesion,
                'CREACIÓN',
                f"Registró al nuevo usuario: {nuevo_usuario.nombre} con el rol {rol_asignado.nombre}."
            )
            # ---------------------------------------------

            # Si el rol es Cliente, generamos tambien su registro en la tabla Cliente
            # para que aparezca en /clientes (antes solo se creaba en la direccion inversa).
            if es_rol_cliente:
                cliente_nuevo = Cliente.objects.create(
                    cedula=cedula,
                    nombre=nuevo_usuario.nombre,
                    telefono=nuevo_usuario.telefono,
                    email=nuevo_usuario.email,
                    fecha_registro=timezone.now().date(),
                    estado='Activo',
                )
                registrar_bitacora(
                    usuario_sesion,
                    'CREACIÓN',
                    f"Generó cliente vinculado: {cliente_nuevo.nombre} ({cliente_nuevo.cedula})."
                )

            return Response({"exito": True, "mensaje": "Usuario creado exitosamente"}, status=201)
        except Rol.DoesNotExist:
            return Response({"exito": False, "error": "El rol seleccionado no existe."}, status=400)
        except IntegrityError:
            return Response({"exito": False, "error": "Ya existe un usuario registrado con ese email."}, status=400)
        except Exception as e:
            return Response({"exito": False, "error": str(e)}, status=400)


@api_view(['PUT', 'PATCH'])
def usuario_detalle_api(request, usuario_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_admin = exigir_admin(usuario_sesion)
    if error_admin:
        return error_admin

    try:
        usuario_obj = Usuario.objects.get(codigo=usuario_id)
    except Usuario.DoesNotExist:
        return Response({"exito": False, "error": "Usuario no encontrado."}, status=404)

    nombre = request.data.get('nombre', usuario_obj.nombre)
    email = (request.data.get('email', usuario_obj.email) or '').strip().lower()
    telefono = request.data.get('telefono', usuario_obj.telefono)
    estado = request.data.get('estado', usuario_obj.estado)
    id_rol = request.data.get('id_rol', usuario_obj.id_rol_id)

    try:
        rol = Rol.objects.get(codigo=id_rol)
    except Rol.DoesNotExist:
        return Response({"exito": False, "error": "Rol inválido."}, status=400)

    if not nombre or not email:
        return Response({"exito": False, "error": "Nombre y email son obligatorios."}, status=400)

    email_duplicado = Usuario.objects.filter(email__iexact=email).exclude(codigo=usuario_obj.codigo).exists()
    if email_duplicado:
        return Response({"exito": False, "error": "Ya existe otro usuario con ese email."}, status=400)

    cliente_vinculado = obtener_cliente_vinculado(usuario_obj)

    usuario_obj.nombre = nombre
    usuario_obj.email = email
    usuario_obj.telefono = telefono
    usuario_obj.estado = estado
    usuario_obj.id_rol = rol
    try:
        usuario_obj.save(update_fields=['nombre', 'email', 'telefono', 'estado', 'id_rol'])
    except IntegrityError:
        return Response({"exito": False, "error": "Ya existe otro usuario con ese email."}, status=400)

    if cliente_vinculado:
        cliente_vinculado.nombre = nombre
        cliente_vinculado.email = email
        cliente_vinculado.telefono = telefono
        cliente_vinculado.save(update_fields=['nombre', 'email', 'telefono'])

    registrar_bitacora(
        usuario_sesion,
        'MODIFICACIÓN',
        f"Actualizó usuario {usuario_obj.nombre} (estado: {usuario_obj.estado}, rol: {rol.nombre})."
    )

    return Response({"exito": True, "mensaje": "Usuario actualizado."}, status=200)


@api_view(['POST'])
def usuario_vincular_cliente_api(request, usuario_id):
    """Genera el registro Cliente faltante para un Usuario con rol Cliente
    creado antes de que existiera la vinculación automática (ver CU02)."""
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_admin = exigir_admin(usuario_sesion)
    if error_admin:
        return error_admin

    try:
        usuario_obj = Usuario.objects.get(codigo=usuario_id)
    except Usuario.DoesNotExist:
        return Response({"exito": False, "error": "Usuario no encontrado."}, status=404)

    if (usuario_obj.id_rol.nombre or '').strip().lower() != 'cliente':
        return Response({"exito": False, "error": "El usuario no tiene rol Cliente."}, status=400)

    if obtener_cliente_vinculado(usuario_obj):
        return Response({"exito": False, "error": "Este usuario ya tiene un cliente vinculado."}, status=400)

    cedula = (request.data.get('cedula') or '').strip()
    if not cedula:
        return Response({"exito": False, "error": "La cédula es obligatoria."}, status=400)

    if Cliente.objects.filter(cedula=cedula).exists():
        return Response({"exito": False, "error": "Ya existe un cliente registrado con esa cédula."}, status=400)

    cliente_nuevo = Cliente.objects.create(
        cedula=cedula,
        nombre=usuario_obj.nombre,
        telefono=usuario_obj.telefono,
        email=usuario_obj.email,
        fecha_registro=timezone.now().date(),
        estado='Activo',
    )
    registrar_bitacora(
        usuario_sesion,
        'CREACIÓN',
        f"Vinculó manualmente al cliente: {cliente_nuevo.nombre} ({cliente_nuevo.cedula})."
    )

    return Response({"exito": True, "mensaje": "Cliente vinculado exitosamente."}, status=201)

# ==========================================
# CU03: GESTIONAR ROLES (Solo lectura por ahora)
# ==========================================
@api_view(['GET', 'POST'])
def roles_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_admin = exigir_admin(usuario_sesion)
    if error_admin:
        return error_admin

    if request.method == 'GET':
        roles = Rol.objects.all().order_by('codigo')
        serializer = RolSerializer(roles, many=True)
        return Response(serializer.data, status=200)

    nombre = request.data.get('nombre', '').strip()
    descripcion = request.data.get('descripcion', '').strip()

    if not nombre:
        return Response({"exito": False, "error": "El nombre del rol es obligatorio."}, status=400)

    if Rol.objects.filter(nombre__iexact=nombre).exists():
        return Response({"exito": False, "error": "Ya existe un rol con ese nombre."}, status=400)

    nuevo_rol = Rol.objects.create(nombre=nombre, descripcion=descripcion or None)
    registrar_bitacora(usuario_sesion, 'CREACIÓN', f"Creó el rol: {nuevo_rol.nombre}.")
    return Response({"exito": True, "mensaje": "Rol creado exitosamente."}, status=201)


@api_view(['PUT', 'DELETE'])
def rol_detalle_api(request, rol_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_admin = exigir_admin(usuario_sesion)
    if error_admin:
        return error_admin

    try:
        rol = Rol.objects.get(codigo=rol_id)
    except Rol.DoesNotExist:
        return Response({"exito": False, "error": "Rol no encontrado."}, status=404)

    if request.method == 'PUT':
        nombre = request.data.get('nombre', rol.nombre).strip()
        descripcion = request.data.get('descripcion', rol.descripcion)

        if rol.nombre == 'Administrador' and nombre != 'Administrador':
            return Response({"exito": False, "error": "No se permite renombrar el rol Administrador."}, status=400)

        if not nombre:
            return Response({"exito": False, "error": "El nombre del rol es obligatorio."}, status=400)

        existe_otro = Rol.objects.filter(nombre__iexact=nombre).exclude(codigo=rol.codigo).exists()
        if existe_otro:
            return Response({"exito": False, "error": "Ya existe otro rol con ese nombre."}, status=400)

        rol.nombre = nombre
        rol.descripcion = descripcion
        rol.save(update_fields=['nombre', 'descripcion'])
        registrar_bitacora(usuario_sesion, 'MODIFICACIÓN', f"Actualizó el rol: {rol.nombre}.")
        return Response({"exito": True, "mensaje": "Rol actualizado."}, status=200)

    usuarios_asociados = Usuario.objects.filter(id_rol=rol).exists()
    if usuarios_asociados:
        return Response({"exito": False, "error": "No se puede eliminar el rol porque tiene usuarios asociados."}, status=400)

    if rol.nombre == 'Administrador':
        return Response({"exito": False, "error": "No se permite eliminar el rol Administrador."}, status=400)

    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM rol_privilegio WHERE id_rol = %s", [rol.codigo])
    nombre_rol = rol.nombre
    rol.delete()
    registrar_bitacora(usuario_sesion, 'ELIMINACIÓN', f"Eliminó el rol: {nombre_rol}.")
    return Response({"exito": True, "mensaje": "Rol eliminado."}, status=200)


@api_view(['GET', 'POST'])  
def privilegios_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_admin = exigir_admin(usuario_sesion)
    if error_admin:
        return error_admin

    if request.method == 'GET':
        privilegios = Privilegio.objects.all().order_by('codigo')
        serializer = PrivilegioSerializer(privilegios, many=True)
        return Response(serializer.data, status=200)

    nombre = request.data.get('nombre', '').strip()
    descripcion = request.data.get('descripcion', '').strip()

    if not nombre:
        return Response({"exito": False, "error": "El nombre del privilegio es obligatorio."}, status=400)

    if Privilegio.objects.filter(nombre__iexact=nombre).exists():
        return Response({"exito": False, "error": "Ya existe un privilegio con ese nombre."}, status=400)

    nuevo_privilegio = Privilegio.objects.create(nombre=nombre, descripcion=descripcion or None)
    registrar_bitacora(usuario_sesion, 'CREACIÓN', f"Creó el privilegio: {nuevo_privilegio.nombre}.")
    return Response({"exito": True, "mensaje": "Privilegio creado exitosamente."}, status=201)


@api_view(['PUT', 'DELETE'])
def privilegio_detalle_api(request, privilegio_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_admin = exigir_admin(usuario_sesion)
    if error_admin:
        return error_admin

    try:
        privilegio = Privilegio.objects.get(codigo=privilegio_id)
    except Privilegio.DoesNotExist:
        return Response({"exito": False, "error": "Privilegio no encontrado."}, status=404)

    if request.method == 'PUT':
        nombre = request.data.get('nombre', privilegio.nombre).strip()
        descripcion = request.data.get('descripcion', privilegio.descripcion)

        if not nombre:
            return Response({"exito": False, "error": "El nombre del privilegio es obligatorio."}, status=400)

        existe_otro = Privilegio.objects.filter(nombre__iexact=nombre).exclude(codigo=privilegio.codigo).exists()
        if existe_otro:
            return Response({"exito": False, "error": "Ya existe otro privilegio con ese nombre."}, status=400)

        privilegio.nombre = nombre
        privilegio.descripcion = descripcion
        privilegio.save(update_fields=['nombre', 'descripcion'])
        registrar_bitacora(usuario_sesion, 'MODIFICACIÓN', f"Actualizó el privilegio: {privilegio.nombre}.")
        return Response({"exito": True, "mensaje": "Privilegio actualizado."}, status=200)

    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM rol_privilegio WHERE id_privilegio = %s", [privilegio.codigo])
    nombre_privilegio = privilegio.nombre
    privilegio.delete()
    registrar_bitacora(usuario_sesion, 'ELIMINACIÓN', f"Eliminó el privilegio: {nombre_privilegio}.")
    return Response({"exito": True, "mensaje": "Privilegio eliminado."}, status=200)


@api_view(['GET', 'POST', 'DELETE'])
def roles_privilegios_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_admin = exigir_admin(usuario_sesion)
    if error_admin:
        return error_admin

    if request.method == 'GET':
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT rp.id_rol, rp.id_privilegio, r.nombre, p.nombre
                FROM rol_privilegio rp
                JOIN rol r ON r.codigo = rp.id_rol
                JOIN privilegio p ON p.codigo = rp.id_privilegio
                ORDER BY rp.id_rol, rp.id_privilegio
                """
            )
            filas = cursor.fetchall()

        data = [
            {
                "id_rol": fila[0],
                "id_privilegio": fila[1],
                "rol_nombre": fila[2],
                "privilegio_nombre": fila[3],
            }
            for fila in filas
        ]
        return Response(data, status=200)

    rol_id = request.data.get('id_rol')
    privilegio_id = request.data.get('id_privilegio')

    if not rol_id or not privilegio_id:
        return Response({"exito": False, "error": "id_rol e id_privilegio son obligatorios."}, status=400)

    try:
        rol = Rol.objects.get(codigo=rol_id)
        privilegio = Privilegio.objects.get(codigo=privilegio_id)
    except (Rol.DoesNotExist, Privilegio.DoesNotExist):
        return Response({"exito": False, "error": "Rol o privilegio no existe."}, status=404)

    if request.method == 'POST':
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM rol_privilegio WHERE id_rol = %s AND id_privilegio = %s LIMIT 1",
                [rol.codigo, privilegio.codigo],
            )
            existe = cursor.fetchone()

            if existe:
                return Response({"exito": False, "error": "La asignación ya existe."}, status=400)

            cursor.execute(
                "INSERT INTO rol_privilegio (id_rol, id_privilegio) VALUES (%s, %s)",
                [rol.codigo, privilegio.codigo],
            )

        registrar_bitacora(usuario_sesion, 'CREACIÓN', f"Asignó privilegio '{privilegio.nombre}' al rol '{rol.nombre}'.")
        return Response({"exito": True, "mensaje": "Privilegio asignado al rol."}, status=201)

    with connection.cursor() as cursor:
        cursor.execute(
            "DELETE FROM rol_privilegio WHERE id_rol = %s AND id_privilegio = %s",
            [rol.codigo, privilegio.codigo],
        )
        borrados = cursor.rowcount

    if borrados == 0:
        return Response({"exito": False, "error": "La asignación no existe."}, status=404)

    registrar_bitacora(usuario_sesion, 'ELIMINACIÓN', f"Revocó privilegio '{privilegio.nombre}' del rol '{rol.nombre}'.")
    return Response({"exito": True, "mensaje": "Privilegio revocado del rol."}, status=200)

# ==========================================
# CU05 GESTION DE CLIENTES
# ==========================================
@api_view(['GET', 'POST'])
def clientes_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'GET':
        accion = 'Buscar' if request.GET.get('q') else 'Mostrar'
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU05', accion)
        if error_permiso:
            return error_permiso
    else:
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU05', 'Adicionar')
        if error_permiso:
            return error_permiso

    if request.method == 'GET':
        busqueda = request.GET.get('q', '').strip()
        incluir_inactivos = request.GET.get('incluir_inactivos', '').strip().lower() == 'true'
        
        # SEGURIDAD: Los Clientes solo ven su propio perfil
        if usuario_sesion.id_rol.nombre and usuario_sesion.id_rol.nombre.strip().lower() == 'cliente':
            cliente_vinculado = obtener_cliente_vinculado(usuario_sesion)
            if not cliente_vinculado:
                return Response({"exito": True, "data": [], "mensaje": "No se encontró un cliente vinculado a tu usuario."}, status=200)
            clientes = Cliente.objects.filter(codigo=cliente_vinculado.codigo)
        else:
            # Administrador y Recepcionista ven todos
            clientes = Cliente.objects.all().order_by('codigo')

        if not incluir_inactivos:
            clientes = clientes.filter(estado='Activo')

        if busqueda:
            clientes = clientes.filter(
                Q(nombre__icontains=busqueda)
                | Q(cedula__icontains=busqueda)
                | Q(telefono__icontains=busqueda)
            )

        serializer = ClienteSerializer(clientes, many=True)
        return Response(serializer.data, status=200)

    serializer = ClienteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    payload = dict(serializer.validated_data)
    payload['estado'] = 'Activo'
    cliente = Cliente.objects.create(**payload)
    registrar_bitacora(usuario_sesion, 'CREACIÓN', f"Registró cliente: {cliente.nombre} ({cliente.cedula}).")

    usuario_cliente, creado = obtener_o_crear_usuario_cliente(cliente)
    if creado:
        registrar_bitacora(
            usuario_sesion,
            'CREACIÓN',
            f"Generó usuario cliente '{usuario_cliente.email}' al registrar cliente {cliente.nombre}."
        )

    return Response({"exito": True, "mensaje": "Cliente creado."}, status=201)


@api_view(['GET'])
def mis_motocicletas_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if usuario_sesion.id_rol.nombre != 'Cliente':
        return Response({"exito": False, "error": "No autorizado para esta consulta."}, status=403)

    cliente = obtener_cliente_vinculado(usuario_sesion)
    if not cliente:
        return Response({"exito": True, "cliente": None, "motocicletas": [], "mensaje": "No se encontró un cliente vinculado a tu usuario."}, status=200)

    motos = Motocicleta.objects.filter(id_cliente=cliente).order_by('codigo')
    serializer = MotocicletaSerializer(motos, many=True)

    return Response(
        {
            "exito": True,
            "cliente": ClienteSerializer(cliente).data,
            "motocicletas": serializer.data,
        },
        status=200,
    )


@api_view(['GET'])
def mis_motocicletas_historial_api(request, moto_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if usuario_sesion.id_rol.nombre != 'Cliente':
        return Response({"exito": False, "error": "No autorizado para esta consulta."}, status=403)

    cliente = obtener_cliente_vinculado(usuario_sesion)
    if not cliente:
        return Response({"exito": False, "error": "No se encontró un cliente vinculado a tu usuario."}, status=404)

    try:
        moto = Motocicleta.objects.get(codigo=moto_id)
    except Motocicleta.DoesNotExist:
        return Response({"exito": False, "error": "Motocicleta no encontrada."}, status=404)

    if moto.id_cliente_id != cliente.codigo:
        return Response({"exito": False, "error": "Esta motocicleta no pertenece a tu cuenta."}, status=403)

    ordenes = (
        Ordentrabajo.objects.select_related('id_mecanico')
        .filter(id_motocicleta=moto)
        .order_by('-fecha_creacion', '-codigo')
    )

    respuesta_ordenes = []
    for orden in ordenes:
        data = OrdenTrabajoSerializer(orden).data
        data['total_general'] = str(Decimal(orden.costo_repuestos or 0) + Decimal(orden.costo_mano_obra or 0))
        notas = Notatrabajo.objects.filter(id_orden_trabajo=orden).select_related('id_mecanico').order_by('fecha_hora')
        data['notas'] = NotaTrabajoSerializer(notas, many=True).data
        respuesta_ordenes.append(data)

    return Response(
        {
            "exito": True,
            "motocicleta": MotocicletaSerializer(moto).data,
            "ordenes": respuesta_ordenes,
        },
        status=200,
    )


@api_view(['PUT', 'DELETE'])
def cliente_detalle_api(request, cliente_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'PUT':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU05', 'Editar')
        if error_permiso:
            return error_permiso
    elif request.method == 'DELETE':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU05', 'Eliminar')
        if error_permiso:
            return error_permiso

    try:
        cliente = Cliente.objects.get(codigo=cliente_id)
    except Cliente.DoesNotExist:
        return Response({"exito": False, "error": "Cliente no encontrado."}, status=404)

    if request.method == 'PUT':
        nombre_anterior = cliente.nombre

        serializer = ClienteSerializer(cliente, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({"exito": False, "errores": serializer.errors}, status=400)

        cliente_actualizado = serializer.save()

        if cliente_actualizado.nombre != nombre_anterior:
            nombre_anterior_normalizado = normalizar_usuario_desde_nombre(nombre_anterior)
            usuario_vinculado = Usuario.objects.filter(
                id_rol__nombre='Cliente'
            ).filter(
                nombre__iexact=nombre_anterior
            ).first()
            if not usuario_vinculado:
                # Reintenta comparando el nombre normalizado por si difiere en tildes/espacios.
                for candidato in Usuario.objects.filter(id_rol__nombre='Cliente'):
                    if normalizar_usuario_desde_nombre(candidato.nombre) == nombre_anterior_normalizado:
                        usuario_vinculado = candidato
                        break
            if usuario_vinculado:
                usuario_vinculado.nombre = cliente_actualizado.nombre
                usuario_vinculado.save(update_fields=['nombre'])

        registrar_bitacora(usuario_sesion, 'MODIFICACIÓN', f"Actualizó cliente: {cliente_actualizado.nombre}.")
        return Response({"exito": True, "mensaje": "Cliente actualizado."}, status=200)

    if (cliente.estado or 'Activo') == 'Inactivo':
        return Response({"exito": False, "error": "El cliente ya está inactivo."}, status=400)

    cliente.estado = 'Inactivo'
    cliente.save(update_fields=['estado'])

    Motocicleta.objects.filter(id_cliente=cliente).exclude(estado='Inactivo').update(estado='Inactivo')

    registrar_bitacora(usuario_sesion, 'MODIFICACIÓN', f"Desactivó cliente: {cliente.nombre}.")
    return Response({"exito": True, "mensaje": "Cliente desactivado."}, status=200)

# ==========================================
# CU06: GESTIONAR MOTOCICLETAS 
# ==========================================
@api_view(['GET', 'POST'])
def motocicletas_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'GET':
        accion = 'Buscar' if request.GET.get('q') else 'Mostrar'
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU06', accion)
        if error_permiso:
            return error_permiso
    else:
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU06', 'Adicionar')
        if error_permiso:
            return error_permiso

    if request.method == 'GET':
        busqueda = request.GET.get('q', '').strip()
        incluir_inactivos = request.GET.get('incluir_inactivos', '').strip().lower() == 'true'
        
        # SEGURIDAD: Los Clientes solo ven sus propias motocicletas
        if usuario_sesion.id_rol.nombre and usuario_sesion.id_rol.nombre.strip().lower() == 'cliente':
            cliente_vinculado = obtener_cliente_vinculado(usuario_sesion)
            if not cliente_vinculado:
                return Response({"exito": True, "data": [], "mensaje": "No se encontró un cliente vinculado a tu usuario."}, status=200)
            motos = Motocicleta.objects.select_related('id_cliente').filter(id_cliente=cliente_vinculado)
        else:
            # Administrador y Recepcionista ven todos
            motos = Motocicleta.objects.select_related('id_cliente').all().order_by('codigo')

        if not incluir_inactivos:
            motos = motos.filter(estado='Activo')

        if busqueda:
            motos = motos.filter(
                Q(placa__icontains=busqueda)
                | Q(marca__icontains=busqueda)
                | Q(modelo__icontains=busqueda)
                | Q(id_cliente__nombre__icontains=busqueda)
            )

        serializer = MotocicletaSerializer(motos, many=True)
        return Response(serializer.data, status=200)

    serializer = MotocicletaSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    payload = dict(serializer.validated_data)
    payload['estado'] = 'Activo'
    moto = Motocicleta.objects.create(**payload)
    registrar_bitacora(usuario_sesion, 'CREACIÓN', f"Registró motocicleta placa {moto.placa} para cliente ID {moto.id_cliente.codigo}.")
    return Response({"exito": True, "mensaje": "Motocicleta creada."}, status=201)


@api_view(['PUT', 'DELETE'])
def motocicleta_detalle_api(request, motocicleta_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'PUT':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU06', 'Editar')
        if error_permiso:
            return error_permiso
    elif request.method == 'DELETE':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU06', 'Eliminar')
        if error_permiso:
            return error_permiso

    try:
        moto = Motocicleta.objects.get(codigo=motocicleta_id)
    except Motocicleta.DoesNotExist:
        return Response({"exito": False, "error": "Motocicleta no encontrada."}, status=404)

    if request.method == 'PUT':
        serializer = MotocicletaSerializer(moto, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({"exito": False, "errores": serializer.errors}, status=400)

        moto_actualizada = serializer.save()
        registrar_bitacora(usuario_sesion, 'MODIFICACIÓN', f"Actualizó motocicleta placa {moto_actualizada.placa}.")
        return Response({"exito": True, "mensaje": "Motocicleta actualizada."}, status=200)

    if (moto.estado or 'Activo') == 'Inactivo':
        return Response({"exito": False, "error": "La motocicleta ya está inactiva."}, status=400)

    moto.estado = 'Inactivo'
    moto.save(update_fields=['estado'])
    registrar_bitacora(usuario_sesion, 'MODIFICACIÓN', f"Desactivó motocicleta placa {moto.placa}.")
    return Response({"exito": True, "mensaje": "Motocicleta desactivada."}, status=200)

# ==========================================
# CU13: ADMINISTRAR PROVEEDORES
# ==========================================
@api_view(['GET', 'POST'])
def proveedores_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'GET':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU13', 'Mostrar')
        if error_permiso:
            return error_permiso
        proveedores = Proveedores.mostrarProveedor()
        serializer = ProveedorSerializer(proveedores, many=True)
        return Response(serializer.data, status=200)

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU13', 'Adicionar')
    if error_permiso:
        return error_permiso

    serializer = Proveedores.verificarDatosProveedor(request.data)
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    proveedor = Proveedores.registrarNuevoProveedor(serializer.validated_data)
    Proveedores.notificarActualizacion(usuario_sesion, proveedor)
    confirmacion = Proveedores.RetornaDatosYConfirmacion(True)
    return Response({"exito": True, "mensaje": "Proveedor creado.", **confirmacion}, status=201)


@api_view(['PUT', 'DELETE'])
def proveedor_detalle_api(request, proveedor_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    try:
        proveedor = Proveedor.objects.get(codigo=proveedor_id)
    except Proveedor.DoesNotExist:
        return Response({"exito": False, "error": "Proveedor no encontrado."}, status=404)

    if request.method == 'PUT':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU13', 'Editar')
        if error_permiso:
            return error_permiso
        serializer = ProveedorSerializer(proveedor, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({"exito": False, "errores": serializer.errors}, status=400)

        proveedor_actualizado = Proveedores.modificarProveedor(proveedor, serializer.validated_data)
        Proveedores.notificarActualizacion(usuario_sesion, proveedor_actualizado)
        confirmacion = Proveedores.RetornaDatosYConfirmacion(True)
        return Response({"exito": True, "mensaje": "Proveedor actualizado.", **confirmacion}, status=200)

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU13', 'Eliminar')
    if error_permiso:
        return error_permiso

    try:
        proveedor.delete()
    except IntegrityError:
        return Response(
            {"exito": False, "error": "No se puede eliminar el proveedor porque tiene productos o compras asociadas."},
            status=409,
        )
    registrar_bitacora(usuario_sesion, 'ELIMINACIÓN', f"Eliminó proveedor: {proveedor.empresa}.")
    return Response({"exito": True, "mensaje": "Proveedor eliminado."}, status=200)


# ==========================================
# CU10: GESTIONAR PRODUCTOS (REPUESTOS)
# ==========================================
@api_view(['GET', 'POST'])
def productos_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'GET':
        busqueda = request.GET.get('q', '').strip()
        incluir_inactivos = request.GET.get('incluir_inactivos', '').strip().lower() == 'true'
        accion_permiso = 'Buscar' if busqueda or incluir_inactivos else 'Mostrar'
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU10', accion_permiso)
        if error_permiso:
            return error_permiso
        productos = Productos.SolicitaBusqueda(busqueda, incluir_inactivos)
        serializer = ProductoSerializer(productos, many=True)
        return Response(serializer.data, status=200)

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU10', 'Adicionar')
    if error_permiso:
        return error_permiso

    serializer = Productos.ValidaDatos(request.data)
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    producto = Productos.Registra(serializer.validated_data)
    Productos.SolicitaRegistroBitacora(usuario_sesion, 'CREACIÓN', f"Registró producto: {producto.nombre}.")
    confirmacion = Productos.RetornaDatosYConfirmacion(True)
    return Response({"exito": True, "mensaje": "Producto creado.", **confirmacion}, status=201)


@api_view(['PUT', 'DELETE'])
def producto_detalle_api(request, producto_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    try:
        producto = Producto.objects.get(codigo=producto_id)
    except Producto.DoesNotExist:
        return Response({"exito": False, "error": "Producto no encontrado."}, status=404)

    if request.method == 'PUT':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU10', 'Editar')
        if error_permiso:
            return error_permiso
        serializer = ProductoSerializer(producto, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({"exito": False, "errores": serializer.errors}, status=400)

        producto_actualizado = Productos.Modifica(producto, serializer.validated_data)
        Productos.SolicitaRegistroBitacora(usuario_sesion, 'MODIFICACIÓN', f"Actualizó producto: {producto_actualizado.nombre}.")
        confirmacion = Productos.RetornaDatosYConfirmacion(True)
        return Response({"exito": True, "mensaje": "Producto actualizado.", **confirmacion}, status=200)

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU10', 'Eliminar')
    if error_permiso:
        return error_permiso

    if (producto.estado or 'Activo') == 'Inactivo':
        return Response({"exito": False, "error": "El producto ya está inactivo."}, status=400)

    producto_actualizado = Productos.Desactiva(producto)
    Productos.SolicitaRegistroBitacora(usuario_sesion, 'MODIFICACIÓN', f"Desactivó producto: {producto_actualizado.nombre}.")
    confirmacion = Productos.RetornaDatosYConfirmacion(True)
    return Response({"exito": True, "mensaje": "Producto desactivado.", **confirmacion}, status=200)


class Cotizaciones:
    @staticmethod
    def SolicitaValidacion(cliente, motocicleta):
        return _validar_cliente_motocicleta_para_cotizacion(cliente, motocicleta)

    @staticmethod
    def BuscaProducto(id_producto):
        try:
            return Producto.objects.get(codigo=id_producto)
        except Producto.DoesNotExist:
            return None

    @staticmethod
    def CreaItems(detalles):
        items = []
        for idx, detalle in enumerate(detalles, start=1):
            item_data, error = _validar_detalle_cotizacion(detalle)
            if error:
                raise ValueError(f"Detalle {idx}: {error}")
            items.append(item_data)
        return items

    @staticmethod
    def Registra(cotizacion_data):
        return Cotizacion(**cotizacion_data)

    @staticmethod
    def Modifica(cotizacion, datos):
        for campo, valor in datos.items():
            setattr(cotizacion, campo, valor)
        cotizacion.save()
        return cotizacion

    @staticmethod
    def Elimina(cotizacion_id):
        cotizacion = Cotizacion.objects.get(codigo=cotizacion_id)
        cotizacion.delete()
        return True

    @staticmethod
    def BuscaCotizacion(cotizacion_id):
        return Cotizacion.objects.filter(codigo=cotizacion_id).first()

    @staticmethod
    def RegistraBitacora(usuario, accion, descripcion):
        registrar_bitacora(usuario, accion, descripcion)

    @staticmethod
    def RecibeConfirmacion(respuesta):
        return respuesta

    @staticmethod
    def RecibePrecio(detalle):
        try:
            return Decimal(detalle.get('precio_unitario', 0))
        except (InvalidOperation, TypeError):
            return Decimal('0')

    @staticmethod
    def SolicitaCreacionOT(cotizacion):
        return True


ESTADOS_ORDEN_TRABAJO_VALIDOS = ('En Progreso', 'Esperando Repuesto', 'Finalizado', 'Facturado')


def obtener_fecha_bolivia():
    # Bolivia no observa horario de verano: UTC-4 fijo.
    return (timezone.now() - timedelta(hours=4)).date()


def _es_rol_mecanico(usuario):
    nombre_rol = (usuario.id_rol.nombre or '').strip().lower()
    return 'mec' in nombre_rol and 'nico' in nombre_rol


def calcular_costos_desde_cotizacion(cotizacion):
    items = Detallecotizacion.objects.filter(id_cotizacion=cotizacion)
    costo_mano_obra = sum((i.subtotal for i in items if (i.tipo or '').strip().lower() == 'mano de obra'), Decimal('0'))
    costo_repuestos = sum((i.subtotal for i in items if (i.tipo or '').strip().lower() == 'repuesto'), Decimal('0'))
    total = cotizacion.total if cotizacion.total is not None else (costo_mano_obra + costo_repuestos)
    return costo_mano_obra, costo_repuestos, total


class OrdenTrabajo:
    @staticmethod
    def EnviaDatos(data):
        return data

    @staticmethod
    def ValidaCotizacionOrigen(cotizacion_id):
        if isinstance(cotizacion_id, Cotizacion):
            return cotizacion_id
        if isinstance(cotizacion_id, dict):
            cotizacion_id = cotizacion_id.get('codigo')
        try:
            return Cotizacion.objects.get(codigo=cotizacion_id)
        except Cotizacion.DoesNotExist:
            return None

    @staticmethod
    def RegistraMecanicoYPrioridad(orden, mecanico_id, prioridad):
        orden.id_mecanico_id = mecanico_id
        orden.prioridad = prioridad
        orden.save(update_fields=['id_mecanico', 'prioridad'])
        return orden

    @staticmethod
    def ModificaEstado(orden, estado):
        if estado:
            orden.estado = estado
            orden.save(update_fields=['estado'])
        return orden

    @staticmethod
    def DescuentaStock(producto, cantidad):
        if producto and cantidad is not None:
            producto.stock_actual = max(0, (producto.stock_actual or 0) - int(cantidad))
            producto.save(update_fields=['stock_actual'])
        return producto

    @staticmethod
    def SolicitaRegistroBitacora(usuario, accion, descripcion):
        registrar_bitacora(usuario, accion, descripcion)

    @staticmethod
    def RetornaConfirmacionGeneral(valor):
        return {"confirmacion": bool(valor)}


class NotasTrabajo:
    @staticmethod
    def SolicitaValidacionAsignacion(orden):
        return _validar_orden_para_nota(orden)

    @staticmethod
    def EnviaPayloadNota(data):
        return data

    @staticmethod
    def RegistraNota(orden, mecanico, datos):
        datos['id_orden_trabajo'] = orden
        datos['id_mecanico'] = mecanico
        return Notatrabajo.objects.create(**datos)

    @staticmethod
    def SolicitaRegistroBitacora(usuario, accion, descripcion):
        registrar_bitacora(usuario, accion, descripcion)

    @staticmethod
    def RetornaConfirmacionGeneral(valor):
        return {"confirmacion": bool(valor)}


class Productos:
    @staticmethod
    def SolicitaBusqueda(busqueda='', incluir_inactivos=False):
        productos = Producto.objects.all().order_by('codigo')
        if not incluir_inactivos:
            productos = productos.filter(estado='Activo')
        if busqueda:
            productos = productos.filter(
                Q(nombre__icontains=busqueda)
                | Q(categoria__icontains=busqueda)
                | Q(marca__icontains=busqueda)
            )
        return productos

    @staticmethod
    def ValidaDatos(data):
        serializer = ProductoSerializer(data=data)
        return serializer

    @staticmethod
    def Registra(datos):
        payload = Productos.GeneraProductoAlmacen(datos)
        payload['estado'] = 'Activo'
        return Producto.objects.create(**payload)

    @staticmethod
    def Modifica(producto, datos):
        for campo, valor in datos.items():
            setattr(producto, campo, valor)
        producto.save()
        return producto

    @staticmethod
    def Desactiva(producto):
        producto.estado = 'Inactivo'
        producto.save(update_fields=['estado'])
        return producto

    @staticmethod
    def SolicitaRegistroBitacora(usuario, accion, descripcion):
        registrar_bitacora(usuario, accion, descripcion)

    @staticmethod
    def RetornaDatosYConfirmacion(valor):
        return {"confirmacion": bool(valor)}

    @staticmethod
    def GeneraProductoAlmacen(datos):
        payload = dict(datos)
        payload['stock_minimo'] = max(1, int(payload.get('stock_minimo', 1) or 1))
        payload['ubicacion_almacen'] = str(payload.get('ubicacion_almacen', '')).strip() or 'Sin ubicación asignada'
        return payload

    @staticmethod
    def SolicitaCrearRepuesto(payload):
        return Producto.objects.create(**payload)

    @staticmethod
    def SolicitaEditarRepuesto(producto, datos):
        for campo, valor in datos.items():
            setattr(producto, campo, valor)
        producto.save()
        return producto

    @staticmethod
    def SolicitaDesactivarRepuesto(producto):
        producto.estado = 'Inactivo'
        producto.save(update_fields=['estado'])
        return producto

    @staticmethod
    def RecibeConfirmacionVisual(mensaje):
        return mensaje


class Inventario:
    @staticmethod
    def SolicitarDatosStock(alerta=''):
        productos = Producto.objects.all().order_by('codigo')
        if alerta == 'bajo':
            productos = productos.filter(stock_actual__lte=F('stock_minimo'))
        return productos

    @staticmethod
    def EvaluaAlertas(producto):
        return (producto.stock_actual or 0) <= (producto.stock_minimo or 1)

    @staticmethod
    def SolicitaHistorial():
        return []

    @staticmethod
    def EnviaAjustes(producto, cantidad):
        return Inventario.RegistraAjusteManual(producto, cantidad)

    @staticmethod
    def ValidaStock(producto):
        return Inventario.ValidarStockYAlertas(producto)

    @staticmethod
    def SolicitaRegistroBitacora(usuario, accion, descripcion):
        registrar_bitacora(usuario, accion, descripcion)

    @staticmethod
    def RetornaDatosYConfirmacion(datos):
        return datos

    @staticmethod
    def ValidarStockYAlertas(producto):
        return (producto.stock_actual or 0) <= (producto.stock_minimo or 1)

    @staticmethod
    def ConsultaHistorialProductos():
        return []

    @staticmethod
    def RegistraAjusteManual(producto, cantidad):
        producto.stock_actual = max(0, (producto.stock_actual or 0) + int(cantidad))
        producto.save(update_fields=['stock_actual'])
        return producto

    @staticmethod
    def RecibeConfirmacionYDatos(datos):
        return datos


class Compras:
    @staticmethod
    def SolicitarValidacion(proveedor, detalles):
        return proveedor is not None and isinstance(detalles, list)

    @staticmethod
    def EnviarPayloadComprasYDetalle(data):
        detalles_raw = data.get('detalles', [])
        if isinstance(detalles_raw, str):
            try:
                detalles = json.loads(detalles_raw)
            except (TypeError, ValueError):
                detalles = []
        else:
            detalles = detalles_raw

        datos_compra = {
            'id_proveedor': data.get('id_proveedor') or None,
            'numero_factura': data.get('numero_factura'),
            'fecha': data.get('fecha'),
            'subtotal': data.get('subtotal'),
            'impuesto': data.get('impuesto'),
            'total': data.get('total'),
            'metodo_pago': data.get('metodo_pago'),
            'estado': data.get('estado'),
        }
        return datos_compra, detalles, (data.get('proveedor_nuevo_nombre') or '').strip()

    @staticmethod
    def SolicitaActualizarStockYRegistrarBitacora(usuario, producto, cantidad):
        producto.stock_actual = max(0, (producto.stock_actual or 0) + int(cantidad))
        producto.save(update_fields=['stock_actual'])
        registrar_bitacora(usuario, 'MODIFICACIÓN', f"Actualizó stock de producto {producto.nombre} en {cantidad} unidades.")
        return producto

    @staticmethod
    def RetornaConfirmacionGeneral(valor):
        return {"confirmacion": bool(valor)}

    @staticmethod
    def IniciaRegistroCompra(data):
        return data

    @staticmethod
    def SeleccionarProveedorYProductos(data):
        return data

    @staticmethod
    def IngresaDatos(data):
        return data

    @staticmethod
    def RegistraCompra(compra_data):
        return Compra.objects.create(**compra_data)

    @staticmethod
    def ActualizaStock(producto, cantidad):
        producto.stock_actual = max(0, (producto.stock_actual or 0) + int(cantidad))
        producto.save(update_fields=['stock_actual'])
        return producto

    @staticmethod
    def RecibeConfirmacionVisual(mensaje):
        return mensaje


class Proveedores:
    @staticmethod
    def mostrarProveedor():
        return Proveedor.objects.all().order_by('codigo')

    @staticmethod
    def verificarDatosProveedor(datos):
        serializer = ProveedorSerializer(data=datos)
        return serializer

    @staticmethod
    def validarProveedor(proveedor):
        return proveedor is not None

    @staticmethod
    def modificarProveedor(proveedor, datos):
        for campo, valor in datos.items():
            setattr(proveedor, campo, valor)
        proveedor.save()
        return proveedor

    @staticmethod
    def notificarActualizacion(usuario, proveedor):
        registrar_bitacora(usuario, 'MODIFICACIÓN', f"Actualizó proveedor: {proveedor.empresa}.")

    @staticmethod
    def RetornaDatosYConfirmacion(valor):
        return {"confirmacion": bool(valor)}

    @staticmethod
    def consultarProveedor():
        return Proveedor.objects.all().order_by('codigo')

    @staticmethod
    def actualizarProveedor(proveedor, datos):
        for campo, valor in datos.items():
            setattr(proveedor, campo, valor)
        proveedor.save()
        return proveedor

    @staticmethod
    def registrarNuevoProveedor(datos):
        return Proveedor.objects.create(**datos)

    @staticmethod
    def RecibeConfirmacionVisual(mensaje):
        return mensaje


# ==========================================
# CU11: MONITOREAR INVENTARIO
# ==========================================
@api_view(['GET'])
def inventario_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    alerta = request.GET.get('alerta', '').strip().lower()
    accion_permiso = 'Buscar' if alerta else 'Mostrar'
    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU11', accion_permiso)
    if error_permiso:
        return error_permiso
    productos = Inventario.SolicitarDatosStock(alerta)

    serializer = ProductoSerializer(productos, many=True)
    return Response(Inventario.RetornaDatosYConfirmacion(serializer.data), status=200)


@api_view(['POST'])
def inventario_ajuste_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU11', 'Editar')
    if error_permiso:
        return error_permiso

    try:
        producto = Producto.objects.get(codigo=request.data.get('id_producto'))
    except (Producto.DoesNotExist, ValueError, TypeError):
        return Response({"exito": False, "error": "Producto no encontrado."}, status=404)

    try:
        cantidad = int(request.data.get('cantidad'))
    except (ValueError, TypeError):
        return Response({"exito": False, "error": "Cantidad inválida."}, status=400)
    if cantidad == 0:
        return Response({"exito": False, "error": "La cantidad del ajuste no puede ser cero."}, status=400)

    motivo = (request.data.get('motivo') or '').strip()

    producto = Inventario.RegistraAjusteManual(producto, cantidad)
    AjusteInventario.objects.create(
        id_producto=producto,
        id_usuario=usuario_sesion,
        cantidad=cantidad,
        motivo=motivo or None,
        fecha_hora=timezone.now(),
        stock_resultante=producto.stock_actual,
    )
    registrar_bitacora(
        usuario_sesion,
        'MODIFICACIÓN',
        f"Ajuste manual de stock: {producto.nombre} ({'+' if cantidad > 0 else ''}{cantidad}). "
        f"Motivo: {motivo or 'No especificado'}.",
    )

    serializer = ProductoSerializer(producto)
    return Response({"exito": True, "mensaje": "Ajuste registrado.", "producto": serializer.data}, status=201)


@api_view(['GET'])
def inventario_historial_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU11', 'Buscar')
    if error_permiso:
        return error_permiso

    try:
        producto = Producto.objects.get(codigo=request.GET.get('producto'))
    except (Producto.DoesNotExist, ValueError, TypeError):
        return Response({"exito": False, "error": "Producto no encontrado."}, status=404)

    movimientos = []

    for detalle in Detallecompra.objects.filter(id_producto=producto).select_related('id_compra__id_proveedor'):
        compra = detalle.id_compra
        movimientos.append({
            "fecha": compra.fecha,
            "tipo": "Compra",
            "cantidad": detalle.cantidad,
            "descripcion": f"Compra #{compra.codigo} a {compra.id_proveedor.empresa} (factura {compra.numero_factura or 'N/D'}).",
        })

    consumos = Detalleordentrabajo.objects.filter(
        id_producto=producto, tipo='Repuesto', provisto_por_cliente=False
    ).select_related('id_orden_trabajo')
    for detalle in consumos:
        orden = detalle.id_orden_trabajo
        movimientos.append({
            "fecha": orden.fecha_creacion,
            "tipo": "Consumo en orden",
            "cantidad": -detalle.cantidad,
            "descripcion": f"Usado en orden de trabajo #{orden.codigo}.",
        })

    for ajuste in AjusteInventario.objects.filter(id_producto=producto).select_related('id_usuario'):
        movimientos.append({
            "fecha": ajuste.fecha_hora,
            "tipo": "Ajuste manual",
            "cantidad": ajuste.cantidad,
            "descripcion": f"{ajuste.motivo or 'Ajuste manual de stock'} (por {ajuste.id_usuario.nombre}).",
        })

    movimientos.sort(key=lambda m: str(m["fecha"] or ''), reverse=True)
    return Response(movimientos, status=200)


# ==========================================
# CU12: PROCESAR COMPRAS A PROVEEDORES
# ==========================================
@api_view(['GET', 'POST'])
def compras_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'GET':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU12', 'Mostrar')
        if error_permiso:
            return error_permiso
        compras = Compra.objects.select_related('id_proveedor').all().order_by('-fecha')
        serializer = CompraSerializer(compras, many=True)
        return Response(serializer.data, status=200)

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU12', 'Adicionar')
    if error_permiso:
        return error_permiso

    datos_compra, detalles, proveedor_nuevo_nombre = Compras.EnviarPayloadComprasYDetalle(request.data)

    if not datos_compra.get('id_proveedor') and proveedor_nuevo_nombre:
        nuevo_proveedor = Proveedor.objects.create(empresa=proveedor_nuevo_nombre, nit='S/N')
        datos_compra['id_proveedor'] = nuevo_proveedor.codigo
        registrar_bitacora(usuario_sesion, 'CREACIÓN', f"Registró nuevo proveedor (vía Compras): {nuevo_proveedor.empresa}.")

    metodo_pago = datos_compra.get('metodo_pago')
    if metodo_pago in ('Transferencia', 'QR'):
        comprobante_archivo = request.FILES.get('comprobante_pago')
        if not comprobante_archivo:
            return Response({"exito": False, "error": "Debe adjuntar el comprobante de pago."}, status=400)
        nombre_archivo = f"comprobantes_compra/{datos_compra.get('numero_factura') or 'compra'}_{comprobante_archivo.name}"
        nombre_guardado = default_storage.save(nombre_archivo, comprobante_archivo)
        datos_compra['comprobante_pago'] = default_storage.url(nombre_guardado)

    serializer = CompraSerializer(data=datos_compra)
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    if not Compras.SolicitarValidacion(serializer.validated_data.get('id_proveedor'), detalles):
        return Response({"exito": False, "error": "Proveedor o detalles no válidos."}, status=400)

    compra = Compras.RegistraCompra(serializer.validated_data)
    for detalle in detalles:
        id_producto = detalle.get('id_producto')
        producto_nuevo_nombre = (detalle.get('producto_nuevo_nombre') or '').strip()

        if not id_producto and producto_nuevo_nombre:
            precio_compra_nuevo = detalle.get('precio_compra', 0)
            producto = Producto.objects.create(
                nombre=producto_nuevo_nombre,
                precio_compra=precio_compra_nuevo,
                precio_venta=precio_compra_nuevo,
                stock_actual=0,
                estado='Activo',
                id_proveedor_id=compra.id_proveedor_id,
            )
            registrar_bitacora(usuario_sesion, 'CREACIÓN', f"Registró nuevo producto (vía Compras): {producto.nombre}.")
        else:
            try:
                producto = Producto.objects.get(codigo=id_producto)
            except Producto.DoesNotExist:
                continue

        item = Detallecompra.objects.create(
            id_compra=compra,
            id_producto=producto,
            cantidad=detalle.get('cantidad', 0),
            precio_compra=detalle.get('precio_compra', producto.precio_compra),
            subtotal=detalle.get('subtotal', 0),
        )

        Compras.SolicitaActualizarStockYRegistrarBitacora(usuario_sesion, producto, item.cantidad)

    confirmacion = Compras.RetornaConfirmacionGeneral(True)
    registrar_bitacora(usuario_sesion, 'CREACIÓN', f"Registró compra #{compra.codigo} a proveedor ID {compra.id_proveedor.codigo}.")
    return Response({"exito": True, "mensaje": "Compra registrada y stock actualizado.", **confirmacion}, status=201)


# ==========================================
# CU07: ELABORAR COTIZACIONES
# ==========================================
@api_view(['GET', 'POST'])
def cotizaciones_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'GET':
        query = request.GET.get('q', '').strip()
        accion_permiso = 'Buscar' if query else 'Mostrar'
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU07', accion_permiso)
        if error_permiso:
            return error_permiso
        cotizaciones = Cotizacion.objects.select_related('id_cliente', 'id_motocicleta').all()
        if query:
            filtros = (
                Q(id_cliente__nombre__icontains=query)
                | Q(id_motocicleta__placa__icontains=query)
                | Q(id_motocicleta__marca__icontains=query)
                | Q(id_motocicleta__modelo__icontains=query)
                | Q(estado__icontains=query)
            )
            if query.isdigit():
                filtros |= Q(codigo=int(query))
            cotizaciones = cotizaciones.filter(filtros)
        cotizaciones = cotizaciones.order_by('-fecha_emision')
        serializer = CotizacionSerializer(cotizaciones, many=True)
        return Response(serializer.data, status=200)

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU07', 'Adicionar')
    if error_permiso:
        return error_permiso

    detalles = request.data.get('detalles', [])
    if not isinstance(detalles, list) or len(detalles) == 0:
        return Response({"exito": False, "error": "La cotización debe incluir al menos un item."}, status=400)

    cotizacion_payload = {
        'id_cliente': request.data.get('id_cliente'),
        'id_motocicleta': request.data.get('id_motocicleta'),
        'fecha_emision': request.data.get('fecha_emision') or timezone.now().date(),
        'fecha_validez': request.data.get('fecha_validez'),
        'subtotal': request.data.get('subtotal'),
        'impuesto': request.data.get('impuesto'),
        'total': request.data.get('total'),
        'estado': request.data.get('estado', 'Pendiente'),
    }

    serializer = CotizacionSerializer(data=cotizacion_payload)
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    cotizacion_data = serializer.validated_data
    cliente = cotizacion_data['id_cliente']
    motocicleta = cotizacion_data['id_motocicleta']
    error_validacion = Cotizaciones.SolicitaValidacion(cliente, motocicleta)
    if error_validacion:
        return Response({"exito": False, "error": error_validacion}, status=400)

    try:
        detalles_creados = Cotizaciones.CreaItems(detalles)
    except ValueError as exc:
        return Response({"exito": False, "error": str(exc)}, status=400)

    subtotal_items = sum((item['subtotal'] for item in detalles_creados), Decimal('0'))

    if subtotal_items != cotizacion_data['subtotal']:
        return Response(
            {"exito": False, "error": "El subtotal de los items no coincide con el subtotal de la cotización."},
            status=400,
        )

    total_esperado = subtotal_items + cotizacion_data['impuesto']
    if total_esperado != cotizacion_data['total']:
        return Response(
            {"exito": False, "error": "El total de la cotización no coincide con el subtotal y el impuesto."},
            status=400,
        )

    cotizacion = Cotizaciones.Registra(cotizacion_data)
    error_fechas = cotizacion.validar_fechas()
    if error_fechas:
        return Response({"exito": False, "error": error_fechas}, status=400)

    try:
        cotizacion.iniciar_cotizacion(detalles_creados)
    except ValueError as exc:
        return Response({"exito": False, "error": str(exc)}, status=400)

    cotizacion.crear_items(detalles_creados)
    cotizacion.actualizar_estado(cotizacion.estado)

    Cotizaciones.RegistraBitacora(
        usuario_sesion,
        'CREACIÓN',
        f"Registró cotización #{cotizacion.codigo} para cliente ID {cotizacion.id_cliente.codigo}.",
    )

    Cotizaciones.RecibeConfirmacion(True)

    return Response(
        {
            "exito": True,
            "mensaje": "Cotización creada y validada correctamente.",
            "cotizacion": CotizacionSerializer(cotizacion).data,
            "detalles": detalles_creados,
            "confirmacion_guardado": True,
        },
        status=201,
    )


@api_view(['PUT', 'DELETE'])
def cotizacion_detalle_api(request, cotizacion_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'DELETE':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU07', 'Eliminar')
    else:
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU07', 'Editar')
    if error_permiso:
        return error_permiso

    cotizacion = Cotizaciones.BuscaCotizacion(cotizacion_id)
    if cotizacion is None:
        return Response({"exito": False, "error": "Cotización no encontrada."}, status=404)

    if request.method == 'DELETE':
        estaba_aprobada = (cotizacion.estado or '').strip().lower() == 'aprobada'
        items_con_producto = []
        if estaba_aprobada:
            items_con_producto = list(
                Detallecotizacion.objects.filter(id_cotizacion=cotizacion, id_producto__isnull=False)
                .select_related('id_producto')
            )

        with transaction.atomic():
            for item in items_con_producto:
                producto = item.id_producto
                producto.stock_actual = (producto.stock_actual or 0) + item.cantidad
                producto.save(update_fields=['stock_actual'])

            Detallecotizacion.objects.filter(id_cotizacion=cotizacion).delete()
            cotizacion.delete()

        registrar_bitacora(
            usuario_sesion,
            'ELIMINACIÓN',
            f"Eliminó cotización #{cotizacion_id}"
            + (" y repuso stock de repuestos asociados." if items_con_producto else "."),
        )
        return Response({"exito": True, "mensaje": "Cotización eliminada."}, status=200)

    detalles_nuevos = request.data.get('detalles')
    detalles_creados = None
    if detalles_nuevos is not None:
        if not isinstance(detalles_nuevos, list) or len(detalles_nuevos) == 0:
            return Response({"exito": False, "error": "La cotización debe incluir al menos un item."}, status=400)
        try:
            detalles_creados = Cotizaciones.CreaItems(detalles_nuevos)
        except ValueError as exc:
            return Response({"exito": False, "error": str(exc)}, status=400)

        subtotal_items = sum((item['subtotal'] for item in detalles_creados), Decimal('0'))
        subtotal_payload = _normalizar_decimal(request.data.get('subtotal'))
        if subtotal_payload is not None and subtotal_items != subtotal_payload:
            return Response(
                {"exito": False, "error": "El subtotal de los items no coincide con el subtotal de la cotización."},
                status=400,
            )

    serializer = CotizacionSerializer(cotizacion, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    try:
        cotizacion_actualizada = serializer.save()
    except Exception as exc:
        return Response({"exito": False, "error": str(exc)}, status=400)

    if detalles_creados is not None:
        Detallecotizacion.objects.filter(id_cotizacion=cotizacion_actualizada).delete()
        cotizacion_actualizada.crear_items(detalles_creados)

    registrar_bitacora(usuario_sesion, 'MODIFICACIÓN', f"Actualizó cotización #{cotizacion.codigo}.")
    return Response(
        {
            "exito": True,
            "mensaje": "Cotización actualizada.",
            "cotizacion": CotizacionSerializer(cotizacion_actualizada).data,
        },
        status=200,
    )


# ==========================================
# CU08: GESTIONAR ÓRDENES DE TRABAJO
# ==========================================
@api_view(['GET', 'POST'])
def ordenes_trabajo_api(request):
    try:
        print("PAYLOAD RECIBIDO:", request.data)
        usuario_sesion, error_auth = obtener_usuario_autenticado(request)
        if error_auth:
            return error_auth

        if request.method == 'GET':
            query = request.GET.get('q', '').strip()
            accion_permiso = 'Buscar' if query else 'Mostrar'
            error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU08', accion_permiso)
            if error_permiso:
                return error_permiso
            ordenes = Ordentrabajo.objects.select_related('id_cliente', 'id_motocicleta', 'id_mecanico').all()
            if query:
                filtros = (
                    Q(id_cliente__nombre__icontains=query)
                    | Q(id_motocicleta__placa__icontains=query)
                    | Q(id_motocicleta__marca__icontains=query)
                    | Q(id_motocicleta__modelo__icontains=query)
                    | Q(id_mecanico__nombre__icontains=query)
                    | Q(estado__icontains=query)
                    | Q(prioridad__icontains=query)
                )
                if query.isdigit():
                    filtros |= Q(codigo=int(query))
                ordenes = ordenes.filter(filtros)
            ordenes = ordenes.order_by('-fecha_creacion')
            serializer = OrdenTrabajoSerializer(ordenes, many=True)
            return Response(serializer.data, status=200)

        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU08', 'Adicionar')
        if error_permiso:
            return error_permiso

        datos_orden = OrdenTrabajo.EnviaDatos(request.data)
        serializer = OrdenTrabajoSerializer(data=datos_orden)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data

        if not datos.get('fecha_inicio'):
            return Response({"exito": False, "error": "La fecha de inicio es obligatoria."}, status=400)

        estado = (datos.get('estado') or 'En Progreso').strip()
        if estado not in ESTADOS_ORDEN_TRABAJO_VALIDOS:
            return Response(
                {"exito": False, "error": f"Estado inválido. Debe ser uno de: {', '.join(ESTADOS_ORDEN_TRABAJO_VALIDOS)}."},
                status=400,
            )
        datos['estado'] = estado

        datos['fecha_creacion'] = obtener_fecha_bolivia()

        mecanico = datos.get('id_mecanico')
        if mecanico is not None and not _es_rol_mecanico(mecanico):
            return Response({"exito": False, "error": "El usuario seleccionado no tiene rol de Mecánico."}, status=400)

        id_cotizacion = datos.get('id_cotizacion')
        if id_cotizacion is not None:
            origen_cotizacion = OrdenTrabajo.ValidaCotizacionOrigen(id_cotizacion)
            if origen_cotizacion is None:
                return Response({"exito": False, "error": "Cotización de origen no válida."}, status=400)
            if (origen_cotizacion.estado or '').strip().lower() != 'aprobada':
                return Response({"exito": False, "error": "Solo se pueden generar órdenes desde cotizaciones Aprobadas."}, status=400)

            orden_existente = (
                Ordentrabajo.objects.filter(id_cotizacion=origen_cotizacion)
                .exclude(estado__iexact='Cancelado')
                .exists()
            )
            if orden_existente:
                return Response(
                    {"exito": False, "error": "Esta cotización ya tiene una orden de trabajo registrada."},
                    status=400,
                )

            datos['id_cliente'] = origen_cotizacion.id_cliente
            datos['id_motocicleta'] = origen_cotizacion.id_motocicleta
            costo_mano_obra, costo_repuestos, total = calcular_costos_desde_cotizacion(origen_cotizacion)
            datos['costo_mano_obra'] = costo_mano_obra
            datos['costo_repuestos'] = costo_repuestos
            datos['total'] = total

        orden = Ordentrabajo.objects.create(**datos)

        autor_nota = orden.id_mecanico or usuario_sesion
        Notatrabajo.objects.create(
            id_orden_trabajo=orden,
            id_mecanico=autor_nota,
            fecha_hora=timezone.now(),
            contenido=f"Orden de trabajo creada con estado '{orden.estado}'.",
            tipo_nota='Sistema',
        )

        OrdenTrabajo.SolicitaRegistroBitacora(
            usuario_sesion,
            'CREACIÓN',
            f"Registró orden de trabajo #{orden.codigo} para cliente ID {orden.id_cliente.codigo}.",
        )

        confirmacion = OrdenTrabajo.RetornaConfirmacionGeneral(True)
        return Response({"exito": True, "mensaje": "Orden de trabajo creada.", **confirmacion}, status=201)
    except Exception as e:
        print("ERROR CRITICO:", str(e))
        trace = traceback.format_exc()
        return Response({"error_critico": str(e), "trace": trace}, status=500)


@api_view(['PUT', 'DELETE'])
def orden_trabajo_detalle_api(request, orden_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'DELETE':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU08', 'Eliminar')
        if error_permiso:
            return error_permiso

        try:
            orden = Ordentrabajo.objects.get(codigo=orden_id)
        except Ordentrabajo.DoesNotExist:
            return Response({"exito": False, "error": "Orden de trabajo no encontrada."}, status=404)

        if (orden.estado or '').strip().lower() == 'cancelado':
            return Response({"exito": False, "error": "Esta orden ya está cancelada."}, status=400)

        orden.estado = 'Cancelado'
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("SELECT set_config('app.usuario_accion', %s, true)", [str(usuario_sesion.codigo)])
            orden.save(update_fields=['estado'])
        # La nota "Sistema" por este cambio de estado la genera el trigger trg_auditoria_estado de la BD.

        OrdenTrabajo.SolicitaRegistroBitacora(usuario_sesion, 'MODIFICACIÓN', f"Canceló orden de trabajo #{orden.codigo}.")
        return Response({"exito": True, "mensaje": "Orden de trabajo cancelada."}, status=200)

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU08', 'Editar')
    if error_permiso:
        return error_permiso

    try:
        orden = Ordentrabajo.objects.get(codigo=orden_id)
    except Ordentrabajo.DoesNotExist:
        return Response({"exito": False, "error": "Orden de trabajo no encontrada."}, status=404)

    estado_solicitado = request.data.get('estado')
    if estado_solicitado and estado_solicitado.strip() not in ESTADOS_ORDEN_TRABAJO_VALIDOS:
        return Response(
            {"exito": False, "error": f"Estado inválido. Debe ser uno de: {', '.join(ESTADOS_ORDEN_TRABAJO_VALIDOS)}."},
            status=400,
        )

    if request.data.get('fecha_inicio') in ('', None) and 'fecha_inicio' in request.data:
        return Response({"exito": False, "error": "La fecha de inicio es obligatoria."}, status=400)

    serializer = OrdenTrabajoSerializer(orden, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    mecanico = serializer.validated_data.get('id_mecanico')
    if mecanico is not None and not _es_rol_mecanico(mecanico):
        return Response({"exito": False, "error": "El usuario seleccionado no tiene rol de Mecánico."}, status=400)

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("SELECT set_config('app.usuario_accion', %s, true)", [str(usuario_sesion.codigo)])
        orden_actualizada = serializer.save()
    OrdenTrabajo.ModificaEstado(orden_actualizada, request.data.get('estado'))
    # La nota "Sistema" por cambio de estado la genera el trigger trg_auditoria_estado de la BD.

    OrdenTrabajo.SolicitaRegistroBitacora(usuario_sesion, 'MODIFICACIÓN', f"Actualizó orden de trabajo #{orden.codigo}.")
    confirmacion = OrdenTrabajo.RetornaConfirmacionGeneral(True)
    return Response({"exito": True, "mensaje": "Orden de trabajo actualizada.", **confirmacion}, status=200)


# ==========================================
# CU09: REDACTAR NOTAS DE TRABAJO
# ==========================================
@api_view(['GET', 'POST'])
def notas_trabajo_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'GET':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU09', 'Mostrar')
        if error_permiso:
            return error_permiso
        notas = Notatrabajo.objects.select_related('id_orden_trabajo', 'id_mecanico').all().order_by('-fecha_hora')
        serializer = NotaTrabajoSerializer(notas, many=True)
        return Response(serializer.data, status=200)

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU09', 'Adicionar')
    if error_permiso:
        return error_permiso

    detalles = request.data.get('detalles', [])
    if detalles is None:
        detalles = []

    data = NotasTrabajo.EnviaPayloadNota(dict(request.data))
    if not data.get('fecha_hora'):
        data['fecha_hora'] = timezone.now()
    data['id_mecanico'] = usuario_sesion.codigo

    tipo_nota = (data.get('tipo_nota') or '').strip()
    if tipo_nota and tipo_nota not in ('Diagnóstico', 'Avance', 'Sistema'):
        return Response(
            {"exito": False, "error": "Tipo de nota inválido. Debe ser 'Diagnóstico', 'Avance' o 'Sistema'."},
            status=400,
        )

    serializer = NotaTrabajoSerializer(data=data)
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    orden_trabajo_id = data.get('id_orden_trabajo')
    try:
        orden = Ordentrabajo.objects.get(codigo=orden_trabajo_id)
    except Ordentrabajo.DoesNotExist:
        return Response({"exito": False, "error": "Orden de trabajo no encontrada."}, status=404)

    error_validacion = NotasTrabajo.SolicitaValidacionAsignacion(orden)
    if error_validacion:
        return Response({"exito": False, "error": error_validacion}, status=400)

    nota = NotasTrabajo.RegistraNota(orden, usuario_sesion, serializer.validated_data)

    detalles_creados = []
    total_repuestos = Decimal('0')
    for idx, detalle in enumerate(detalles, start=1):
        detalle_data, error_detalle = _validar_detalle_orden_trabajo(detalle)
        if error_detalle:
            return Response({"exito": False, "error": f"Detalle {idx}: {error_detalle}"}, status=400)

        detalle_obj = Detalleordentrabajo.objects.create(
            id_orden_trabajo=orden,
            id_producto=detalle_data['id_producto'],
            tipo=detalle_data['tipo'],
            descripcion=detalle_data['descripcion'],
            cantidad=detalle_data['cantidad'],
            provisto_por_cliente=detalle_data['provisto_por_cliente'],
            precio_unitario=detalle_data['precio_unitario'],
            subtotal=detalle_data['subtotal'],
        )
        detalles_creados.append(detalle_obj)
        total_repuestos += detalle_data['subtotal']

    if total_repuestos > 0:
        orden_total = Decimal(orden.total or 0)
        orden_costo_repuestos = Decimal(orden.costo_repuestos or 0)
        orden.total = orden_total + total_repuestos
        orden.costo_repuestos = orden_costo_repuestos + total_repuestos
        if (orden.estado or '').strip() == 'Abierta':
            orden.estado = 'En progreso'
        orden.save(update_fields=['total', 'costo_repuestos', 'estado'])

    registrar_bitacora(
        usuario_sesion,
        'CREACIÓN',
        f"Registró nota de trabajo #{nota.codigo} para orden ID {nota.id_orden_trabajo.codigo}.",
    )

    if detalles_creados:
        registrar_bitacora(
            usuario_sesion,
            'MODIFICACIÓN',
            f"Agregó {len(detalles_creados)} detalles de repuestos/trabajo a la orden #{orden.codigo}.",
        )

    return Response(
        {
            "exito": True,
            "mensaje": "Nota de trabajo registrada correctamente.",
            "nota": NotaTrabajoSerializer(nota).data,
            "orden": {
                "codigo": orden.codigo,
                "estado": orden.estado,
                "total": str(orden.total or '0'),
                "costo_repuestos": str(orden.costo_repuestos or '0'),
            },
            "detalles_registrados": len(detalles_creados),
        },
        status=201,
    )


@api_view(['PUT', 'DELETE'])
def nota_trabajo_detalle_api(request, nota_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'PUT':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU09', 'Editar')
        if error_permiso:
            return error_permiso
    else:
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU09', 'Eliminar')
        if error_permiso:
            return error_permiso

    try:
        nota = Notatrabajo.objects.get(codigo=nota_id)
    except Notatrabajo.DoesNotExist:
        return Response({"exito": False, "error": "Nota de trabajo no encontrada."}, status=404)

    if request.method == 'PUT':
        tipo_nota = (request.data.get('tipo_nota') or '').strip()
        if tipo_nota and tipo_nota not in ('Diagnóstico', 'Avance', 'Sistema'):
            return Response(
                {"exito": False, "error": "Tipo de nota inválido. Debe ser 'Diagnóstico', 'Avance' o 'Sistema'."},
                status=400,
            )

        serializer = NotaTrabajoSerializer(nota, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({"exito": False, "errores": serializer.errors}, status=400)

        nota_actualizada = serializer.save()
        registrar_bitacora(usuario_sesion, 'MODIFICACIÓN', f"Actualizó nota de trabajo #{nota.codigo}.")
        return Response(
            {
                "exito": True,
                "mensaje": "Nota de trabajo actualizada.",
                "nota": NotaTrabajoSerializer(nota_actualizada).data,
            },
            status=200,
        )

    registrar_bitacora(usuario_sesion, 'ELIMINACIÓN', f"Eliminó nota de trabajo #{nota.codigo}.")
    nota.delete()
    return Response({"exito": True, "mensaje": "Nota de trabajo eliminada."}, status=200)


# ==========================================
# CU14: GESTIONAR FACTURACION
# ==========================================
def solicita_ordenes(request):
    ordenes = (
        Ordentrabajo.objects.select_related('id_cliente', 'id_motocicleta')
        .filter(estado__iexact='Finalizado')
        .order_by('-fecha_creacion')
    )
    serializer = OrdenTrabajoSerializer(ordenes, many=True)
    return Response(serializer.data, status=200)


def envia_payload_cobro(request):
    orden_id = request.data.get('orden_id') or request.data.get('id_orden_trabajo')
    metodo_pago = (request.data.get('metodo_pago') or '').strip()
    estado_pago = (request.data.get('estado_pago') or 'Pendiente').strip()
    nit_cliente = (request.data.get('nit_cliente') or '').strip()
    razon_social = (request.data.get('razon_social') or '').strip()
    impuesto_raw = request.data.get('impuesto', '0')
    observaciones = (request.data.get('observaciones') or '').strip() or None
    numero_autorizacion = (request.data.get('numero_autorizacion') or '').strip() or None

    if not orden_id:
        return None, None, Response({"exito": False, "error": "Debe seleccionar una orden de trabajo."}, status=400)

    if not nit_cliente or not razon_social:
        return None, None, Response({"exito": False, "error": "NIT y Razón Social son obligatorios."}, status=400)

    try:
        impuesto = Decimal(str(impuesto_raw or '0'))
    except (InvalidOperation, TypeError):
        return None, None, Response({"exito": False, "error": "Impuesto inválido."}, status=400)

    try:
        orden = Ordentrabajo.objects.select_related('id_cliente', 'id_motocicleta').get(codigo=orden_id)
    except Ordentrabajo.DoesNotExist:
        return None, None, Response({"exito": False, "error": "Orden de trabajo no encontrada."}, status=404)

    if (orden.estado or '').strip().lower() != 'finalizado':
        return None, None, Response({"exito": False, "error": "La orden debe estar en estado Finalizado."}, status=400)

    if Notaservicio.objects.filter(id_orden_trabajo=orden).exists():
        return None, None, Response({"exito": False, "error": "La orden ya fue facturada previamente."}, status=409)

    comprobante_pago = None
    comprobante_archivo = request.FILES.get('comprobante_pago')
    if metodo_pago in ('Transferencia', 'QR'):
        if not comprobante_archivo:
            return None, None, Response(
                {"exito": False, "error": "Debe adjuntar el comprobante de pago."},
                status=400,
            )
        nombre_archivo = f"comprobantes/orden_{orden_id}_{comprobante_archivo.name}"
        nombre_guardado = default_storage.save(nombre_archivo, comprobante_archivo)
        comprobante_pago = default_storage.url(nombre_guardado)

    datos_validados = {
        'metodo_pago': metodo_pago,
        'comprobante_pago': comprobante_pago,
        'estado_pago': estado_pago,
        'nit_cliente': nit_cliente,
        'razon_social': razon_social,
        'impuesto': impuesto,
        'observaciones': observaciones,
        'numero_autorizacion': numero_autorizacion,
        'fecha_emision': timezone.now().date(),
    }
    return datos_validados, orden, None


def solicita_generacion_registros(datos_validados, orden):
    total_repuestos = Decimal(orden.costo_repuestos or 0)
    total_mano_obra = Decimal(orden.costo_mano_obra or 0)
    total_general = total_repuestos + total_mano_obra
    fecha_emision = datos_validados['fecha_emision']
    usuario_sesion = datos_validados.get('usuario_sesion')

    with transaction.atomic():
        nota = Notaservicio.objects.create(
            id_orden_trabajo=orden,
            id_cliente=orden.id_cliente,
            fecha_emision=fecha_emision,
            total_repuestos=total_repuestos,
            total_mano_obra=total_mano_obra,
            total_general=total_general,
            observaciones=datos_validados.get('observaciones'),
            estado_pago=datos_validados.get('estado_pago') or 'Pendiente',
        )

        factura = Factura.objects.create(
            id_nota_servicio=nota,
            numero_autorizacion=datos_validados.get('numero_autorizacion'),
            fecha_emision=fecha_emision,
            monto_servicio_facturado=total_general,
            impuesto=datos_validados.get('impuesto'),
            total_facturado=total_general + datos_validados.get('impuesto'),
            nit_cliente=datos_validados.get('nit_cliente'),
            razon_social=datos_validados.get('razon_social'),
            metodo_pago=datos_validados.get('metodo_pago') or None,
            comprobante_pago=datos_validados.get('comprobante_pago'),
        )

        Ordentrabajo.objects.filter(codigo=orden.codigo).update(estado='Facturado')
        orden.estado = 'Facturado'

        if usuario_sesion is not None:
            registrar_bitacora(
                usuario_sesion,
                'FACTURACION',
                (
                    f"Procesó facturación de orden #{orden.codigo} (Método: {datos_validados.get('metodo_pago') or 'N/D'}, "
                    f"Estado pago: {datos_validados.get('estado_pago') or 'Pendiente'})."
                ),
            )

    nota._metodo_pago = datos_validados.get('metodo_pago')
    return nota, factura


def retorna_confirmacion_general_y_urls_pdfs(nota, factura):
    orden = nota.id_orden_trabajo
    detalles = Detalleordentrabajo.objects.select_related('id_producto').filter(id_orden_trabajo=orden)
    total_repuestos = Decimal(nota.total_repuestos or 0)
    total_mano_obra = Decimal(nota.total_mano_obra or 0)
    total_general = Decimal(nota.total_general or 0)
    metodo_pago = getattr(nota, '_metodo_pago', '')

    return Response(
        {
            "exito": True,
            "mensaje": "Facturación generada correctamente.",
            "orden": {
                "codigo": orden.codigo,
                "estado": orden.estado,
                "cliente": orden.id_cliente.nombre,
                "motocicleta": orden.id_motocicleta.placa if orden.id_motocicleta else None,
                "costo_mano_obra": str(total_mano_obra),
                "costo_repuestos": str(total_repuestos),
                "total": str(total_general),
            },
            "cliente": ClienteSerializer(orden.id_cliente).data,
            "motocicleta": MotocicletaSerializer(orden.id_motocicleta).data if orden.id_motocicleta else None,
            "detalles": DetalleOrdenTrabajoSerializer(detalles, many=True).data,
            "nota_servicio": NotaServicioSerializer(nota).data,
            "factura": FacturaSerializer(factura).data,
            "metodo_pago": metodo_pago,
        },
        status=201,
    )


@api_view(['GET', 'POST'])
def facturacion_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'GET':
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU14', 'Mostrar')
        if error_permiso:
            return error_permiso
        return solicita_ordenes(request)

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU14', 'Adicionar')
    if error_permiso:
        return error_permiso

    datos_validados, orden, error_response = envia_payload_cobro(request)
    if error_response is not None:
        return error_response

    datos_validados['usuario_sesion'] = usuario_sesion
    nota, factura = solicita_generacion_registros(datos_validados, orden)
    return retorna_confirmacion_general_y_urls_pdfs(nota, factura)


@api_view(['DELETE'])
def factura_detalle_api(request, factura_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU14', 'Eliminar')
    if error_permiso:
        return error_permiso

    try:
        factura = Factura.objects.select_related('id_nota_servicio__id_orden_trabajo').get(codigo=factura_id)
    except Factura.DoesNotExist:
        return Response({"exito": False, "error": "Factura no encontrada."}, status=404)

    nota = factura.id_nota_servicio
    orden = nota.id_orden_trabajo if nota else None

    with transaction.atomic():
        factura.delete()
        if nota is not None and not Factura.objects.filter(id_nota_servicio=nota).exists():
            nota.delete()
            if orden is not None and (orden.estado or '').strip().lower() in ('facturado', 'pagado'):
                orden.estado = 'Finalizado'
                orden.save(update_fields=['estado'])

    registrar_bitacora(
        usuario_sesion,
        'ELIMINACIÓN',
        f"Eliminó factura #{factura_id}" + (f" de la orden #{orden.codigo}." if orden else "."),
    )
    return Response({"exito": True, "mensaje": "Factura eliminada."}, status=200)


@api_view(['GET'])
def facturacion_historial_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU14', 'Mostrar')
    if error_permiso:
        return error_permiso

    # El historial se basa en que exista una Nota de Servicio (factura real emitida),
    # no en el estado actual de la orden, para que nunca "desaparezca" una factura
    # si la orden cambia de estado por algún motivo despues de facturada.
    notas = (
        Notaservicio.objects.select_related('id_orden_trabajo__id_cliente', 'id_orden_trabajo__id_motocicleta')
        .order_by('-fecha_emision', '-codigo')
    )

    facturas = Factura.objects.select_related('id_nota_servicio').filter(id_nota_servicio__in=notas)
    facturas_por_nota = {}
    for factura in facturas:
        facturas_por_nota.setdefault(factura.id_nota_servicio_id, factura)

    respuesta = []
    for nota in notas:
        orden = nota.id_orden_trabajo
        factura = facturas_por_nota.get(nota.codigo)
        detalles = Detalleordentrabajo.objects.select_related('id_producto').filter(id_orden_trabajo=orden)
        respuesta.append(
            {
                "orden": OrdenTrabajoSerializer(orden).data,
                "nota_servicio": NotaServicioSerializer(nota).data,
                "factura": FacturaSerializer(factura).data if factura else None,
                "detalles": DetalleOrdenTrabajoSerializer(detalles, many=True).data,
            }
        )

    return Response(respuesta, status=200)


@api_view(['GET'])
def mis_facturas_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if usuario_sesion.id_rol.nombre != 'Cliente':
        return Response({"exito": False, "error": "No autorizado para esta consulta."}, status=403)

    cliente = obtener_cliente_vinculado(usuario_sesion)
    if not cliente:
        return Response(
            {"exito": True, "facturas": [], "mensaje": "No se encontró un cliente vinculado a tu usuario."},
            status=200,
        )

    notas = (
        Notaservicio.objects.select_related('id_orden_trabajo__id_motocicleta')
        .filter(id_cliente=cliente)
        .order_by('-fecha_emision', '-codigo')
    )

    facturas = Factura.objects.select_related('id_nota_servicio').filter(id_nota_servicio__in=notas)
    facturas_por_nota = {}
    for factura in facturas:
        facturas_por_nota.setdefault(factura.id_nota_servicio_id, factura)

    respuesta = []
    for nota in notas:
        orden = nota.id_orden_trabajo
        factura = facturas_por_nota.get(nota.codigo)
        detalles = Detalleordentrabajo.objects.select_related('id_producto').filter(id_orden_trabajo=orden)
        respuesta.append(
            {
                "orden": OrdenTrabajoSerializer(orden).data,
                "nota_servicio": NotaServicioSerializer(nota).data,
                "factura": FacturaSerializer(factura).data if factura else None,
                "detalles": DetalleOrdenTrabajoSerializer(detalles, many=True).data,
            }
        )

    return Response({"exito": True, "facturas": respuesta}, status=200)


# ==========================================
# PAGO DEL CLIENTE: QR / PAYPAL (rol Cliente)
# ==========================================
def _validar_orden_propia_pendiente(usuario_sesion, orden_id):
    if usuario_sesion.id_rol.nombre != 'Cliente':
        return None, None, Response({"exito": False, "error": "No autorizado para esta operación."}, status=403)

    cliente = obtener_cliente_vinculado(usuario_sesion)
    if not cliente:
        return None, None, Response({"exito": False, "error": "No se encontró un cliente vinculado a tu usuario."}, status=404)

    if not orden_id:
        return None, None, Response({"exito": False, "error": "Debe indicar la orden a pagar."}, status=400)

    try:
        orden = Ordentrabajo.objects.select_related('id_cliente').get(codigo=orden_id)
    except Ordentrabajo.DoesNotExist:
        return None, None, Response({"exito": False, "error": "Orden de trabajo no encontrada."}, status=404)

    if orden.id_cliente_id != cliente.codigo:
        return None, None, Response({"exito": False, "error": "Esta orden no pertenece a tu cuenta."}, status=403)

    if (orden.estado or '').strip().lower() != 'finalizado':
        return None, None, Response({"exito": False, "error": "La orden debe estar en estado Finalizado."}, status=400)

    if Notaservicio.objects.filter(id_orden_trabajo=orden).exists():
        return None, None, Response({"exito": False, "error": "La orden ya fue facturada previamente."}, status=409)

    return cliente, orden, None


@api_view(['GET'])
def mis_pagos_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if usuario_sesion.id_rol.nombre != 'Cliente':
        return Response({"exito": False, "error": "No autorizado para esta consulta."}, status=403)

    cliente = obtener_cliente_vinculado(usuario_sesion)
    if not cliente:
        return Response(
            {"exito": True, "cliente": None, "ordenes": [], "mensaje": "No se encontró un cliente vinculado a tu usuario."},
            status=200,
        )

    ordenes = (
        Ordentrabajo.objects.select_related('id_cliente', 'id_motocicleta')
        .filter(id_cliente=cliente, estado__iexact='Finalizado')
        .order_by('-fecha_creacion')
    )

    respuesta = []
    for orden in ordenes:
        data = OrdenTrabajoSerializer(orden).data
        data['total_general'] = str(Decimal(orden.costo_repuestos or 0) + Decimal(orden.costo_mano_obra or 0))
        respuesta.append(data)

    return Response({"exito": True, "cliente": ClienteSerializer(cliente).data, "ordenes": respuesta}, status=200)


@api_view(['POST'])
def mis_pagos_qr_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    orden_id = request.data.get('orden_id')
    cliente, orden, error_response = _validar_orden_propia_pendiente(usuario_sesion, orden_id)
    if error_response is not None:
        return error_response

    comprobante_archivo = request.FILES.get('comprobante_pago')
    if not comprobante_archivo:
        return Response({"exito": False, "error": "Debe adjuntar el comprobante de pago."}, status=400)

    nombre_archivo = f"comprobantes/orden_{orden.codigo}_{comprobante_archivo.name}"
    nombre_guardado = default_storage.save(nombre_archivo, comprobante_archivo)
    comprobante_pago = default_storage.url(nombre_guardado)

    datos_validados = {
        'metodo_pago': 'QR',
        'comprobante_pago': comprobante_pago,
        'estado_pago': 'Pendiente',
        'nit_cliente': cliente.cedula,
        'razon_social': cliente.nombre,
        'impuesto': Decimal('0'),
        'observaciones': None,
        'numero_autorizacion': None,
        'fecha_emision': timezone.now().date(),
        'usuario_sesion': usuario_sesion,
    }

    nota, factura = solicita_generacion_registros(datos_validados, orden)
    return retorna_confirmacion_general_y_urls_pdfs(nota, factura)


@api_view(['POST'])
def mis_pagos_paypal_crear_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    orden_id = request.data.get('orden_id')
    cliente, orden, error_response = _validar_orden_propia_pendiente(usuario_sesion, orden_id)
    if error_response is not None:
        return error_response

    total_general = Decimal(orden.costo_repuestos or 0) + Decimal(orden.costo_mano_obra or 0)

    try:
        paypal_order_id = crear_orden_paypal(total_general)
    except PayPalError as exc:
        return Response({"exito": False, "error": f"No se pudo iniciar el pago con PayPal: {exc}"}, status=502)

    return Response({"exito": True, "paypal_order_id": paypal_order_id}, status=200)


@api_view(['POST'])
def mis_pagos_paypal_capturar_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    orden_id = request.data.get('orden_id')
    paypal_order_id = (request.data.get('paypal_order_id') or '').strip()
    if not paypal_order_id:
        return Response({"exito": False, "error": "Falta el identificador de la orden de PayPal."}, status=400)

    cliente, orden, error_response = _validar_orden_propia_pendiente(usuario_sesion, orden_id)
    if error_response is not None:
        return error_response

    try:
        estado_paypal, captura_id = capturar_orden_paypal(paypal_order_id)
    except PayPalError as exc:
        return Response({"exito": False, "error": f"No se pudo confirmar el pago con PayPal: {exc}"}, status=502)

    if estado_paypal != 'COMPLETED':
        return Response({"exito": False, "error": f"PayPal no completó el pago (estado: {estado_paypal})."}, status=400)

    datos_validados = {
        'metodo_pago': 'PayPal',
        'comprobante_pago': captura_id or paypal_order_id,
        'estado_pago': 'Pagado',
        'nit_cliente': cliente.cedula,
        'razon_social': cliente.nombre,
        'impuesto': Decimal('0'),
        'observaciones': None,
        'numero_autorizacion': None,
        'fecha_emision': timezone.now().date(),
        'usuario_sesion': usuario_sesion,
    }

    nota, factura = solicita_generacion_registros(datos_validados, orden)
    return retorna_confirmacion_general_y_urls_pdfs(nota, factura)


# ==========================================
# CU18: MODULO DE REPORTES ANALITICOS
# ==========================================
MESES_ES = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]


TIPOS_REPORTE_VALIDOS = (
    'ingresos_por_periodo',
    'servicios_mas_realizados',
    'repuestos_mas_vendidos',
    'clientes_frecuentes',
    'ordenes_por_estado',
    'inventario_critico',
)


def construir_resultados_reporte(tipo, fecha_inicio, fecha_fin, agrupacion_param, top):
    """Ejecuta la consulta real de CU18 para un tipo de reporte dado.

    Reutilizada tanto por reportes_api (consulta/exportación manual) como por
    reportes_asistente_voz_api (preguntas interpretadas por IA), para que la IA
    nunca invente datos: siempre corre la misma consulta que el modulo de reportes.
    Devuelve (resultados, error_mensaje).
    """
    resultados = []

    if tipo == 'ingresos_por_periodo':
        agrupacion = (agrupacion_param or 'dia').strip().lower()
        facturas = Factura.objects.select_related('id_nota_servicio').all()
        if fecha_inicio:
            facturas = facturas.filter(fecha_emision__gte=fecha_inicio)
        if fecha_fin:
            facturas = facturas.filter(fecha_emision__lte=fecha_fin)

        grupos = {}
        total_bruto = Decimal('0.00')
        total_impuesto = Decimal('0.00')
        total_ordenes = 0

        for f in facturas:
            fecha = f.fecha_emision or None
            if not fecha:
                continue

            if agrupacion == 'semana':
                year, week, _ = fecha.isocalendar()
                week_start = fecha - timedelta(days=fecha.weekday())
                week_end = week_start + timedelta(days=6)
                label = f"Semana {week} ({week_start.isoformat()}-{week_end.isoformat()})"
                key = f"{year}-W{week}"
            elif agrupacion == 'mes':
                label = f"{MESES_ES[fecha.month]} {fecha.year}"
                key = f"{fecha.year}-{fecha.month:02d}"
            else:
                label = fecha.isoformat()
                key = fecha.isoformat()

            bruto = f.total_facturado or Decimal('0.00')
            impuesto = f.impuesto or Decimal('0.00')
            neto = bruto - impuesto

            if key not in grupos:
                grupos[key] = {
                    'label': label,
                    'ordenes': 0,
                    'bruto': Decimal('0.00'),
                    'impuesto': Decimal('0.00'),
                    'neto': Decimal('0.00'),
                }

            grupos[key]['ordenes'] += 1
            grupos[key]['bruto'] += bruto
            grupos[key]['impuesto'] += impuesto
            grupos[key]['neto'] += neto

            total_bruto += bruto
            total_impuesto += impuesto
            total_ordenes += 1

        resultados = []
        for k in sorted(grupos.keys()):
            g = grupos[k]
            resultados.append({
                'periodo': g['label'],
                'ordenes': g['ordenes'],
                'ingreso_bruto': float(g['bruto']),
                'impuesto': float(g['impuesto']),
                'ingreso_neto': float(g['neto']),
            })

        resultados.append({
            'periodo': 'TOTAL',
            'ordenes': total_ordenes,
            'ingreso_bruto': float(total_bruto),
            'impuesto': float(total_impuesto),
            'ingreso_neto': float(total_bruto - total_impuesto),
        })

    elif tipo == 'servicios_mas_realizados':
        agrupacion = (agrupacion_param or '').strip().lower()
        detalles = Detalleordentrabajo.objects.filter(id_producto__isnull=True)
        if fecha_inicio:
            detalles = detalles.filter(id_orden_trabajo__fecha_creacion__gte=fecha_inicio)
        if fecha_fin:
            detalles = detalles.filter(id_orden_trabajo__fecha_creacion__lte=fecha_fin)
        detalles = detalles.values(
            'tipo',
            'descripcion',
            'cantidad',
            'subtotal',
            'id_orden_trabajo__fecha_creacion'
        )

        servicios = {}
        total_veces = 0
        total_ingresos = Decimal('0.00')
        for detalle in detalles:
            nombre = (detalle.get('descripcion') or detalle.get('tipo') or 'Servicio').strip()
            if nombre == '':
                nombre = 'Servicio'
            cantidad = detalle.get('cantidad') or 0
            subtotal = detalle.get('subtotal') or Decimal('0.00')
            fecha_creacion = detalle.get('id_orden_trabajo__fecha_creacion')

            if agrupacion in ['semana', 'mes', 'dia']:
                if not fecha_creacion:
                    continue
                if agrupacion == 'semana':
                    year, week, _ = fecha_creacion.isocalendar()
                    week_start = fecha_creacion - timedelta(days=fecha_creacion.weekday())
                    week_end = week_start + timedelta(days=6)
                    periodo_label = f"Semana {week} ({week_start.isoformat()}-{week_end.isoformat()})"
                    periodo_key = f"{year}-W{week:02d}"
                elif agrupacion == 'mes':
                    periodo_label = f"{MESES_ES[fecha_creacion.month]} {fecha_creacion.year}"
                    periodo_key = f"{fecha_creacion.year}-{fecha_creacion.month:02d}"
                else:
                    periodo_label = fecha_creacion.isoformat()
                    periodo_key = fecha_creacion.isoformat()

                key = f"{periodo_key}|{nombre}"
                if key not in servicios:
                    servicios[key] = {
                        'periodo': periodo_label,
                        'servicio': nombre,
                        'veces': 0,
                        'monto': Decimal('0.00'),
                    }
                servicios[key]['veces'] += cantidad
                servicios[key]['monto'] += subtotal
            else:
                if nombre not in servicios:
                    servicios[nombre] = {'veces': 0, 'monto': Decimal('0.00')}
                servicios[nombre]['veces'] += cantidad
                servicios[nombre]['monto'] += subtotal

            total_veces += cantidad
            total_ingresos += subtotal

        resultados = []
        if agrupacion in ['semana', 'mes', 'dia']:
            for v in servicios.values():
                pct = (float(v['veces']) / total_veces * 100.0) if total_veces else 0.0
                resultados.append({
                    'periodo': v['periodo'],
                    'servicio': v['servicio'],
                    'veces_realizado': int(v['veces']),
                    'ingreso_total': float(v['monto']),
                    'porcentaje': round(pct, 2),
                })
            resultados.sort(key=lambda x: (x['periodo'], -x['veces_realizado'], -x['ingreso_total']))
        else:
            for nombre, v in servicios.items():
                pct = (float(v['veces']) / total_veces * 100.0) if total_veces else 0.0
                resultados.append({
                    'servicio': nombre,
                    'veces_realizado': int(v['veces']),
                    'ingreso_total': float(v['monto']),
                    'porcentaje': round(pct, 2),
                })
            resultados.sort(key=lambda x: (-x['veces_realizado'], -x['ingreso_total']))

        resultados = resultados[:top]

    elif tipo == 'repuestos_mas_vendidos':
        detalles = Detalleordentrabajo.objects.select_related('id_producto').filter(id_producto__isnull=False)
        if fecha_inicio:
            detalles = detalles.filter(id_orden_trabajo__fecha_creacion__gte=fecha_inicio)
        if fecha_fin:
            detalles = detalles.filter(id_orden_trabajo__fecha_creacion__lte=fecha_fin)
        repuestos = {}
        for detalle in detalles:
            producto = detalle.id_producto
            if not producto:
                continue
            pid = producto.codigo
            if pid not in repuestos:
                repuestos[pid] = {'nombre': producto.nombre or 'Repuesto', 'cantidad': 0, 'monto': Decimal('0.00'), 'stock_actual': producto.stock_actual or 0}
            repuestos[pid]['cantidad'] += detalle.cantidad or 0
            repuestos[pid]['monto'] += detalle.subtotal or Decimal('0.00')

        resultados = []
        for pid, v in repuestos.items():
            resultados.append({
                'repuesto': v['nombre'],
                'cantidad_vendida': int(v['cantidad']),
                'ingreso_total': float(v['monto']),
                'stock_actual': int(v['stock_actual']),
            })

        resultados.sort(key=lambda x: (-x['cantidad_vendida'], -x['ingreso_total']))
        resultados = resultados[:top]

    elif tipo == 'clientes_frecuentes':
        ordenes = Ordentrabajo.objects.select_related('id_cliente').all()
        if fecha_inicio:
            ordenes = ordenes.filter(fecha_creacion__gte=fecha_inicio)
        if fecha_fin:
            ordenes = ordenes.filter(fecha_creacion__lte=fecha_fin)
        clientes = {}
        for orden in ordenes:
            cliente = orden.id_cliente
            if not cliente:
                continue
            cid = cliente.codigo
            if cid not in clientes:
                clientes[cid] = {'nombre': cliente.nombre or cliente.razon_social or 'Cliente', 'cedula': cliente.cedula, 'ordenes': 0, 'monto': Decimal('0.00')}
            clientes[cid]['ordenes'] += 1
            clientes[cid]['monto'] += orden.total or Decimal('0.00')

        resultados = []
        for cid, v in clientes.items():
            resultados.append({
                'cliente': v['nombre'],
                'cedula': v.get('cedula') or '',
                'cantidad_servicios': int(v['ordenes']),
                'total_gastado': float(v['monto']),
            })

        resultados.sort(key=lambda x: (-x['cantidad_servicios'], -x['total_gastado']))
        resultados = resultados[:top]

    elif tipo == 'ordenes_por_estado':
        ordenes = Ordentrabajo.objects.all()
        if fecha_inicio:
            ordenes = ordenes.filter(fecha_creacion__gte=fecha_inicio)
        if fecha_fin:
            ordenes = ordenes.filter(fecha_creacion__lte=fecha_fin)

        conteo = {}
        total_estados = 0
        for orden in ordenes:
            estado = (orden.estado or 'Sin estado').strip()
            conteo[estado] = conteo.get(estado, 0) + 1
            total_estados += 1

        resultados = []
        for estado, cantidad in conteo.items():
            pct = (float(cantidad) / total_estados * 100.0) if total_estados else 0.0
            resultados.append({
                'estado': estado,
                'cantidad': int(cantidad),
                'porcentaje': round(pct, 2),
            })
        resultados.sort(key=lambda x: (-x['cantidad'], x['estado']))

    elif tipo == 'inventario_critico':
        productos = Producto.objects.filter(stock_actual__lt=F('stock_minimo')).order_by('stock_actual')
        for producto in productos:
            diferencia = (producto.stock_actual or 0) - (producto.stock_minimo or 0)
            resultados.append({
                'producto': producto.nombre,
                'stock_actual': int(producto.stock_actual or 0),
                'stock_minimo': int(producto.stock_minimo or 0),
                'diferencia': int(diferencia),
                'ubicacion': producto.ubicacion_almacen or '',
            })

    else:
        return resultados, "Tipo de consulta inválido."

    return resultados, None


@api_view(['GET'])
def reportes_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    export = (request.GET.get('export') or '').strip().lower()
    accion = 'Exportar' if export else 'Buscar'
    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU18', accion)
    if error_permiso:
        return error_permiso

    tipo = (request.GET.get('tipo') or '').strip().lower()
    fecha_inicio = parse_date((request.GET.get('fecha_inicio') or '').strip())
    fecha_fin = parse_date((request.GET.get('fecha_fin') or '').strip())
    agrupacion_param = (request.GET.get('agrupacion') or '').strip().lower()
    top = request.GET.get('top')
    try:
        top = int(top) if top else 10
    except ValueError:
        top = 10
    if top < 1:
        top = 10

    email_destino = (request.GET.get('email_destino') or '').strip()

    if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
        return Response({"exito": False, "error": "La fecha inicio no puede ser mayor que fecha fin."}, status=400)

    resultados, error_reporte = construir_resultados_reporte(tipo, fecha_inicio, fecha_fin, agrupacion_param, top)
    if error_reporte:
        return Response({"exito": False, "error": error_reporte}, status=400)

    registrar_bitacora(
        usuario_sesion,
        'REPORTE',
        f"Generó reporte {tipo or '-'} ({'export' if export else 'consulta'}).",
    )

    if export:
        headers = columnas_para(tipo, resultados)
        filtros = {
            'tipo': tipo,
            'fecha_inicio': fecha_inicio.isoformat() if fecha_inicio else '',
            'fecha_fin': fecha_fin.isoformat() if fecha_fin else '',
            'agrupacion': agrupacion_param,
            'top': top,
            'generado_en': timezone.localtime().strftime('%d/%m/%Y %H:%M'),
        }

        if export == 'csv':
            response = generar_csv_reporte(headers, resultados, filtros)
            if email_destino:
                enviar_archivo_por_correo(email_destino, 'reporte.csv', response.content, 'text/csv')
            return response

        if export == 'excel':
            try:
                response, contenido = generar_excel_reporte(headers, resultados, filtros)
            except ImportError:
                return Response(
                    {"exito": False, "error": "Excel no disponible. Instale openpyxl en el backend."},
                    status=501,
                )
            if email_destino:
                enviar_archivo_por_correo(email_destino, 'reporte.xlsx', contenido, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            return response

        if export == 'pdf':
            try:
                response, contenido = generar_pdf_reporte(headers, resultados, filtros)
            except ImportError:
                return Response(
                    {"exito": False, "error": "PDF no disponible. Instale reportlab en el backend."},
                    status=501,
                )
            if email_destino:
                enviar_archivo_por_correo(email_destino, 'reporte.pdf', contenido, 'application/pdf')
            return response

        return Response({"exito": False, "error": "Formato de exportación inválido."}, status=400)

    return Response({"exito": True, "resultados": resultados}, status=200)


@api_view(['POST'])
def reportes_asistente_voz_api(request):
    """CU18: asistente de voz - interpreta una pregunta en lenguaje natural con Gemini
    y la traduce a parámetros de reporte, pero la consulta real la sigue corriendo
    construir_resultados_reporte (la IA nunca inventa datos, solo elige los filtros).
    """
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU18', 'Buscar')
    if error_permiso:
        return error_permiso

    pregunta = (request.data.get('pregunta') or '').strip()
    if not pregunta:
        return Response({"exito": False, "error": "La pregunta no puede estar vacía."}, status=400)

    if not settings.GEMINI_API_KEY:
        return Response(
            {"exito": False, "error": "El asistente de voz no está configurado (falta GEMINI_API_KEY)."},
            status=503,
        )

    hoy = timezone.localtime().date().isoformat()
    prompt_sistema = (
        "Eres un asistente que traduce preguntas en español sobre reportes de un taller de motos "
        "a parámetros JSON estructurados. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni markdown.\n"
        f"La fecha de hoy es {hoy}.\n"
        "Formato exacto del JSON:\n"
        '{"tipo": "...", "fecha_inicio": "YYYY-MM-DD o null", "fecha_fin": "YYYY-MM-DD o null", '
        '"agrupacion": "dia|semana|mes o null", "top": numero_entero}\n'
        '"tipo" debe ser uno de: ' + ", ".join(TIPOS_REPORTE_VALIDOS) + ". "
        'Si la pregunta no corresponde a ninguno, usa "tipo": null. '
        '"agrupacion" solo aplica a ingresos_por_periodo y servicios_mas_realizados. '
        'Si el usuario no menciona un fechas relativas como "este mes" o "el ultimo trimestre", calcula el rango real usando la fecha de hoy. '
        '"top" por defecto es 10 si no se menciona.'
    )

    try:
        from google import genai
        cliente = genai.Client(api_key=settings.GEMINI_API_KEY)
        respuesta = cliente.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=pregunta,
            config=genai.types.GenerateContentConfig(
                system_instruction=prompt_sistema,
                max_output_tokens=300,
                temperature=0.0,
            ),
        )
        texto_respuesta = respuesta.text.strip()
    except ImportError:
        return Response(
            {"exito": False, "error": "Asistente de voz no disponible. Instale el paquete google-genai en el backend."},
            status=501,
        )
    except Exception:
        logger.exception("Error llamando a la API de Gemini en reportes_asistente_voz_api")
        return Response({"exito": False, "error": "No se pudo interpretar la pregunta. Intente nuevamente."}, status=502)

    texto_json = texto_respuesta
    if texto_json.startswith('```'):
        texto_json = texto_json.strip('`')
        if texto_json.lower().startswith('json'):
            texto_json = texto_json[4:]

    try:
        interpretacion = json.loads(texto_json)
    except (json.JSONDecodeError, ValueError):
        return Response({"exito": False, "error": "No se pudo interpretar la pregunta. Intente reformularla."}, status=502)

    tipo = (interpretacion.get('tipo') or '').strip().lower()
    if tipo not in TIPOS_REPORTE_VALIDOS:
        return Response(
            {"exito": False, "error": "No reconocí a qué reporte te refieres. Intenta ser más específico."},
            status=400,
        )

    fecha_inicio = parse_date((interpretacion.get('fecha_inicio') or '').strip()) if interpretacion.get('fecha_inicio') else None
    fecha_fin = parse_date((interpretacion.get('fecha_fin') or '').strip()) if interpretacion.get('fecha_fin') else None
    agrupacion_param = (interpretacion.get('agrupacion') or '').strip().lower() if interpretacion.get('agrupacion') else ''
    try:
        top = int(interpretacion.get('top') or 10)
    except (TypeError, ValueError):
        top = 10
    if top < 1:
        top = 10

    if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
        return Response({"exito": False, "error": "La fecha inicio no puede ser mayor que fecha fin."}, status=400)

    resultados, error_reporte = construir_resultados_reporte(tipo, fecha_inicio, fecha_fin, agrupacion_param, top)
    if error_reporte:
        return Response({"exito": False, "error": error_reporte}, status=400)

    registrar_bitacora(
        usuario_sesion,
        'REPORTE',
        f'Generó reporte {tipo} vía asistente de voz: "{pregunta}".',
    )

    return Response({
        "exito": True,
        "tipo": tipo,
        "fecha_inicio": fecha_inicio.isoformat() if fecha_inicio else '',
        "fecha_fin": fecha_fin.isoformat() if fecha_fin else '',
        "agrupacion": agrupacion_param,
        "top": top,
        "resultados": resultados,
    }, status=200)


@api_view(['GET'])
def dashboard_api(request):
    """CU19: Dashboard Analítico - métricas en tiempo real (no persistente)"""
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU19', 'Mostrar')
    if error_permiso:
        return error_permiso

    hoy = timezone.now().date()

    # Ingresos del día
    ingresos_qs = Factura.objects.filter(fecha_emision=hoy)
    ingresos_del_dia = sum((f.total_facturado or Decimal('0.00')) for f in ingresos_qs)

    # Órdenes activas (no finalizadas/entregadas/canceladas)
    estados_no_activas = ['Finalizado', 'Entregado', 'Cancelado']
    ordenes_activas_count = Ordentrabajo.objects.exclude(estado__in=estados_no_activas).count()

    # Alertas de stock
    productos_bajos = Producto.objects.filter(stock_actual__lt=F('stock_minimo')).order_by('stock_actual')
    alertas_stock = []
    for p in productos_bajos[:20]:
        alertas_stock.append({
            'producto': p.nombre,
            'stock_actual': int(p.stock_actual or 0),
            'stock_minimo': int(p.stock_minimo or 0),
            'diferencia': int((p.stock_actual or 0) - (p.stock_minimo or 0)),
            'ubicacion': p.ubicacion_almacen or '',
        })

    # Servicios pendientes
    servicios_pendientes_count = Ordentrabajo.objects.filter(estado__in=['En Progreso', 'Esperando Repuesto']).count()

    # Serie temporal: últimos 14 días de ingresos
    series = []
    for dias in range(13, -1, -1):
        fecha = hoy - timedelta(days=dias)
        total = Factura.objects.filter(fecha_emision=fecha).aggregate(total_sum=Sum('total_facturado'))['total_sum'] or Decimal('0.00')
        series.append({'fecha': fecha.isoformat(), 'ingreso': float(total)})

    response = {
        'ingresos_del_dia': float(ingresos_del_dia),
        'ordenes_activas': int(ordenes_activas_count),
        'alertas_stock': alertas_stock,
        'servicios_pendientes': int(servicios_pendientes_count),
        'serie_ingresos_ultimos_14_dias': series,
    }

    registrar_bitacora(usuario_sesion, 'REPORTE', 'Accedió al Dashboard Analítico (CU19)')

    return Response({'exito': True, 'dashboard': response}, status=200)

def enviar_archivo_por_correo(email_destino, nombre_archivo, contenido, content_type):
    try:
        email = EmailMessage(
            subject='Reporte del Taller',
            body='Adjunto el reporte solicitado.',
            to=[email_destino],
        )
        email.attach(nombre_archivo, contenido, content_type)
        email.send(fail_silently=True)
    except Exception:
        logger.exception('Error enviando reporte por correo')
    return None


# ==========================================
# CU15: GESTIONAR HISTORIAL DE MANTENIMIENTO
# ==========================================
class HistorialMantenimientoAPI(APIView):
    def solicita_datos_vehiculo_y_historial(self, request):
        criterio = (request.GET.get('q') or request.GET.get('criterio') or '').strip()
        if not criterio:
            return Response({"exito": False, "error": "Debe ingresar placa o chasis."}, status=400)

        motocicleta = (
            Motocicleta.objects.select_related('id_cliente')
            .filter(Q(placa__icontains=criterio) | Q(numero_chasis__icontains=criterio))
            .order_by('codigo')
            .first()
        )
        if motocicleta is None:
            return Response(
                {
                    "exito": True,
                    "motocicleta": None,
                    "ordenes": [],
                    "mensaje": "No se encontraron registros para el criterio.",
                },
                status=200,
            )

        ordenes = (
            Ordentrabajo.objects.select_related('id_cliente', 'id_motocicleta', 'id_mecanico')
            .filter(id_motocicleta=motocicleta)
            .order_by('-fecha_creacion', '-codigo')
        )

        registrar_bitacora(
            request.usuario_sesion,
            'EXPORTACION',
            f"Exportó historial de mantenimiento de la motocicleta {motocicleta.placa}.",
        )

        return Response(
            {
                "exito": True,
                "motocicleta": MotocicletaSerializer(motocicleta).data,
                "ordenes": HistorialOrdenSerializer(ordenes, many=True).data,
                "mensaje": "Reporte generado.",
            },
            status=200,
        )

    def solicita_detalles_orden_especifica(self, request, orden_id):
        try:
            orden = Ordentrabajo.objects.select_related(
                'id_cliente', 'id_motocicleta', 'id_mecanico'
            ).get(codigo=orden_id)
        except Ordentrabajo.DoesNotExist:
            return Response({"exito": False, "error": "Orden no encontrada."}, status=404)

        detalles = Detalleordentrabajo.objects.filter(id_orden_trabajo=orden).order_by('codigo')

        return Response(
            {
                "exito": True,
                "orden": OrdenTrabajoSerializer(orden).data,
                "detalles": DetalleOrdenTrabajoSerializer(detalles, many=True).data,
            },
            status=200,
        )

    def retorna_datos_y_url_reporte(self, data):
        response_data = dict(data or {})
        response_data.setdefault("reporte_url", None)
        return Response(response_data, status=200)

    def get(self, request, orden_id=None):
        usuario_sesion, error_auth = obtener_usuario_autenticado(request)
        if error_auth:
            return error_auth

        request.usuario_sesion = usuario_sesion
        accion = 'Buscar' if (request.GET.get('q') or request.GET.get('criterio')) else 'Mostrar'
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU15', accion)
        if error_permiso:
            return error_permiso

        if orden_id is not None:
            return self.solicita_detalles_orden_especifica(request, orden_id)

        return self.solicita_datos_vehiculo_y_historial(request)

    def post(self, request):
        usuario_sesion, error_auth = obtener_usuario_autenticado(request)
        if error_auth:
            return error_auth

        request.usuario_sesion = usuario_sesion
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU15', 'Exportar')
        if error_permiso:
            return error_permiso

        data, error_response = self.solicita_generacion_pdf_y_registro(request)
        if error_response is not None:
            return error_response

        return self.retorna_datos_y_url_reporte(data)


# ==========================================
# CU16: GESTIONAR SEGUIMIENTO PARA CLIENTES
# ==========================================
class SeguimientoClientesAPI(APIView):
    def solicita_lista_segmentada_clientes(self, request):
        hoy = timezone.now().date()
        clientes = Cliente.objects.filter(estado='Activo').order_by('codigo')
        ordenes = (
            Ordentrabajo.objects.select_related('id_cliente')
            .order_by('-fecha_fin', '-fecha_creacion', '-codigo')
        )

        ultimas_ordenes = {}
        for orden in ordenes:
            cliente_id = orden.id_cliente_id
            if cliente_id not in ultimas_ordenes:
                ultimas_ordenes[cliente_id] = orden

        data = []
        for cliente in clientes:
            ultima_orden = ultimas_ordenes.get(cliente.codigo)
            ultima_fecha = None
            segmento = 'Preventivo'

            if ultima_orden is not None:
                ultima_fecha = ultima_orden.fecha_fin or ultima_orden.fecha_creacion
                dias = (hoy - ultima_fecha).days if ultima_fecha else None
                if (ultima_orden.estado or '').strip() == 'Finalizado':
                    segmento = 'Retiro'
                elif dias is not None and dias <= 2:
                    segmento = 'Encuesta'
                elif dias is not None and dias >= 90:
                    segmento = 'Preventivo'

            data.append(
                {
                    "cliente": ClienteSerializer(cliente).data,
                    "segmento": segmento,
                    "ultima_visita": ultima_fecha.isoformat() if ultima_fecha else None,
                }
            )

        return Response({"exito": True, "clientes": data}, status=200)

    def envia_payload_notificacion(self, request, email, texto):
        try:
            asunto = (request.data.get('asunto') or 'Seguimiento de servicio - Taller La Roca').strip()
            tipo_gestion = (request.data.get('tipo_gestion') or 'Seguimiento').strip()
            observaciones = (request.data.get('observaciones') or '').strip() or None
            cliente_id = request.data.get('id_cliente')

            if not cliente_id:
                return None, Response({"exito": False, "error": "Cliente requerido."}, status=400)

            try:
                cliente = Cliente.objects.get(codigo=cliente_id)
            except Cliente.DoesNotExist:
                return None, Response({"exito": False, "error": "Cliente no encontrado."}, status=404)

            cuerpo_correo = f"Tipo de gestión: {tipo_gestion}\n\n{texto}"
            if observaciones:
                cuerpo_correo += f"\n\nObservaciones: {observaciones}"

            send_mail(
                subject=asunto,
                message=cuerpo_correo,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )

            seguimiento = Seguimiento.objects.create(
                id_cliente=cliente,
                id_usuario=request.usuario_sesion,
                fecha_hora=timezone.now(),
                tipo_gestion=tipo_gestion,
                canal='Email',
                mensaje=texto,
                observaciones=observaciones,
            )

            registrar_bitacora(
                request.usuario_sesion,
                'SEGUIMIENTO',
                f"Envio seguimiento a {cliente.nombre} ({cliente.email}).",
            )

            return {
                "exito": True,
                "mensaje": "Seguimiento enviado y registrado.",
                "seguimiento": SeguimientoSerializer(seguimiento).data,
            }, None
        except Exception as e:
            trace = traceback.format_exc()
            return None, Response({"error_critico": str(e), "trace": trace}, status=500)

    def retorna_confirmacion_despacho_exitoso(self, datos):
        return Response(datos, status=200)

    def get(self, request):
        usuario_sesion, error_auth = obtener_usuario_autenticado(request)
        if error_auth:
            return error_auth

        request.usuario_sesion = usuario_sesion
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU16', ['Mostrar', 'Buscar'])
        if error_permiso:
            return error_permiso

        return self.solicita_lista_segmentada_clientes(request)

    def post(self, request):
        usuario_sesion, error_auth = obtener_usuario_autenticado(request)
        if error_auth:
            return error_auth

        request.usuario_sesion = usuario_sesion
        error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU16', 'Adicionar')
        if error_permiso:
            return error_permiso

        email = (request.data.get('email') or '').strip()
        texto = (request.data.get('texto') or '').strip()
        if not email or not texto:
            return Response({"exito": False, "error": "Email y texto son obligatorios."}, status=400)

        datos, error_response = self.envia_payload_notificacion(request, email, texto)
        if error_response is not None:
            return error_response

        return self.retorna_confirmacion_despacho_exitoso(datos)


# ==========================================
# CU17: GESTIONAR PERFIL DE USUARIO
# ==========================================

@api_view(['GET', 'PUT', 'PATCH'])
def perfil_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'GET':
        serializer = PerfilSerializer(usuario_sesion)
        return Response(serializer.data, status=200)

    if request.method == 'PUT':
        data = {
            'nombre': request.data.get('nombre', usuario_sesion.nombre),
            'telefono': request.data.get('telefono', usuario_sesion.telefono),
        }
        serializer = PerfilSerializer(usuario_sesion, data=data, partial=True)
        if not serializer.is_valid():
            return Response({"exito": False, "errores": serializer.errors}, status=400)

        serializer.save()
        registrar_bitacora(usuario_sesion, 'MODIFICACIÓN', 'Actualizó su información de perfil.')
        return Response({"exito": True, "mensaje": "Perfil actualizado."}, status=200)

    password_actual = request.data.get('password_actual', '')
    password_nueva = request.data.get('password_nueva', '')
    password_confirmacion = request.data.get('password_confirmacion', '')

    if not check_password(password_actual, usuario_sesion.contrasena):
        return Response({"exito": False, "error": "La contraseña actual es incorrecta."}, status=400)

    error_password = validar_password_segura(password_nueva)
    if error_password:
        return Response({"exito": False, "error": error_password}, status=400)

    if password_nueva != password_confirmacion:
        return Response({"exito": False, "error": "La confirmación de contraseña no coincide."}, status=400)

    usuario_sesion.contrasena = make_password(password_nueva)
    usuario_sesion.save(update_fields=['contrasena'])
    registrar_bitacora(usuario_sesion, 'MODIFICACIÓN', 'Actualizó su contraseña de acceso.')
    return Response({"exito": True, "mensaje": "Contraseña actualizada."}, status=200)


@api_view(['POST'])
def force_change_password_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    password_nueva = request.data.get('password_nueva', '')
    password_confirmacion = request.data.get('password_confirmacion', '')

    error_password = validar_password_segura(password_nueva)
    if error_password:
        return Response({"exito": False, "error": error_password}, status=400)

    if password_nueva != password_confirmacion:
        return Response({"exito": False, "error": "La confirmación de contraseña no coincide."}, status=400)

    if password_nueva == settings.CLIENT_TEMP_PASSWORD:
        return Response({"exito": False, "error": "Debe elegir una contraseña diferente a la temporal."}, status=400)

    usuario_sesion.contrasena = make_password(password_nueva)
    usuario_sesion.save(update_fields=['contrasena'])
    registrar_bitacora(usuario_sesion, 'MODIFICACIÓN', 'Cambió su contraseña temporal obligatoria.')
    return Response({"exito": True, "mensaje": "Contraseña actualizada correctamente."}, status=200)


@api_view(['POST'])
def forgot_password_request_api(request):
    email = (request.data.get('email') or '').strip().lower()
    ip = (request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR') or 'unknown').split(',')[0].strip()

    if not email:
        return Response({"exito": False, "error": "Debe ingresar un correo electrónico."}, status=400)

    key_email = f"pwdreset:email:{email}"
    if excede_limite(key_email, settings.PASSWORD_RESET_LIMIT_PER_EMAIL, settings.PASSWORD_RESET_WINDOW_SECONDS):
        return Response({"exito": False, "error": "Demasiadas solicitudes. Intente nuevamente más tarde."}, status=429)

    key_ip = f"pwdreset:ip:{ip}"
    if excede_limite(key_ip, settings.PASSWORD_RESET_LIMIT_PER_IP, settings.PASSWORD_RESET_WINDOW_SECONDS):
        return Response({"exito": False, "error": "Demasiadas solicitudes. Intente nuevamente más tarde."}, status=429)

    usuario = Usuario.objects.filter(email__iexact=email).first()
    if not usuario or (usuario.estado or 'Activo') != 'Activo':
        return Response({"exito": False, "error": "No existe una cuenta registrada con ese correo electrónico."}, status=404)

    codigo = f"{secrets.randbelow(1000000):06d}"
    cache.set(f"pwdreset:code:{usuario.codigo}", codigo, timeout=settings.PASSWORD_RESET_CODE_MAX_AGE_SECONDS)
    cache.delete(f"pwdreset:code_attempts:{usuario.codigo}")

    destinatario_envio = _resolver_destinatario_reset_online(usuario)

    if settings.PASSWORD_RESET_LOG_TO_CONSOLE:
        print(
            f"[PASSWORD_RESET] mode={settings.MAIL_MODE} from={settings.DEFAULT_FROM_EMAIL} "
            f"to={destinatario_envio} original={usuario.email} codigo={codigo}"
        )

    enviados = 0
    ultimo_error = None

    for intento in range(1, settings.EMAIL_SEND_RETRIES + 1):
        try:
            enviados = send_mail(
                subject='Código de verificación - Taller La Roca',
                message=(
                    'Recibimos una solicitud para restablecer tu contraseña.\n\n'
                    f'Tu código de confirmación es: {codigo}\n'
                    f'Este código es válido por {settings.PASSWORD_RESET_CODE_MAX_AGE_SECONDS // 60} minutos.\n\n'
                    'Si no solicitaste este cambio, ignora este mensaje.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[destinatario_envio],
                fail_silently=False,
            )
            if settings.PASSWORD_RESET_LOG_TO_CONSOLE:
                print(f"[PASSWORD_RESET] intento={intento} resultado_envio={enviados}")
            ultimo_error = None
            break
        except Exception as exc:
            ultimo_error = exc
            if settings.PASSWORD_RESET_LOG_TO_CONSOLE:
                print(f"[PASSWORD_RESET] intento={intento} error_envio={exc}")

            es_dns_temporal = isinstance(exc, OSError) and getattr(exc, 'errno', None) == -3
            if not es_dns_temporal:
                break

    if ultimo_error and settings.PASSWORD_RESET_LOG_TO_CONSOLE:
        print(f"[PASSWORD_RESET] envio_no_confirmado tras {settings.EMAIL_SEND_RETRIES} intento(s)")

    registrar_bitacora(usuario, 'SOLICITUD_RESET', 'Solicitó un código de verificación para restablecer su contraseña.')

    return Response({"exito": True, "mensaje": "Te hemos enviado un código de verificación a tu correo electrónico."}, status=200)


@api_view(['POST'])
def reset_password_confirm_api(request):
    token = (request.data.get('token') or '').strip()
    password_nueva = request.data.get('password_nueva', '')
    password_confirmacion = request.data.get('password_confirmacion', '')

    if not token:
        return Response({"exito": False, "error": "Token requerido."}, status=400)

    error_password = validar_password_segura(password_nueva)
    if error_password:
        return Response({"exito": False, "error": error_password}, status=400)

    if password_nueva != password_confirmacion:
        return Response({"exito": False, "error": "La confirmación de contraseña no coincide."}, status=400)

    try:
        payload = signing.loads(token, salt='password-reset', max_age=settings.PASSWORD_RESET_TOKEN_MAX_AGE_SECONDS)
        if payload.get('purpose') != 'password_reset':
            return Response({"exito": False, "error": "Token inválido."}, status=400)

        jti = payload.get('jti')
        uid = payload.get('uid')
        if not jti or not uid:
            return Response({"exito": False, "error": "Token inválido."}, status=400)

        key_jti = f"pwdreset:used:{jti}"
        if cache.get(key_jti):
            return Response({"exito": False, "error": "Token ya utilizado."}, status=400)

        usuario = Usuario.objects.get(codigo=uid)
        usuario.contrasena = make_password(password_nueva)
        usuario.save(update_fields=['contrasena'])

        cache.set(key_jti, True, timeout=settings.PASSWORD_RESET_TOKEN_MAX_AGE_SECONDS)
        registrar_bitacora(usuario, 'RESET_PASSWORD', 'Restableció su contraseña mediante enlace de recuperación.')

        return Response({"exito": True, "mensaje": "Contraseña restablecida exitosamente."}, status=200)

    except SignatureExpired:
        return Response({"exito": False, "error": "Token expirado."}, status=400)
    except (BadSignature, Usuario.DoesNotExist, TypeError, ValueError):
        return Response({"exito": False, "error": "Token inválido."}, status=400)


@api_view(['POST'])
def verify_reset_code_api(request):
    email = (request.data.get('email') or '').strip().lower()
    codigo = (request.data.get('codigo') or '').strip()

    if not email or not codigo:
        return Response({"exito": False, "error": "Debe ingresar el código de confirmación."}, status=400)

    usuario = Usuario.objects.filter(email__iexact=email).first()
    if not usuario:
        return Response({"exito": False, "error": "Código incorrecto o expirado."}, status=400)

    key_attempts = f"pwdreset:code_attempts:{usuario.codigo}"
    if excede_limite(key_attempts, settings.PASSWORD_RESET_CODE_MAX_ATTEMPTS, settings.PASSWORD_RESET_CODE_MAX_AGE_SECONDS):
        return Response({"exito": False, "error": "Demasiados intentos. Solicite un nuevo código."}, status=429)

    codigo_guardado = cache.get(f"pwdreset:code:{usuario.codigo}")
    if not codigo_guardado or codigo_guardado != codigo:
        return Response({"exito": False, "error": "Código incorrecto o expirado."}, status=400)

    cache.delete(f"pwdreset:code:{usuario.codigo}")
    cache.delete(key_attempts)

    payload = {
        'purpose': 'password_reset',
        'uid': usuario.codigo,
        'jti': str(uuid.uuid4()),
    }
    token = signing.dumps(payload, salt='password-reset')

    registrar_bitacora(usuario, 'VERIFICACION_CODIGO', 'Verificó el código de recuperación de contraseña.')

    return Response({"exito": True, "token": token}, status=200)


# ==========================================
# CU: REGISTRO DE NUEVOS CLIENTES
# ==========================================
@api_view(['POST'])
def registro_api(request):
    nombre = (request.data.get('full_name') or '').strip()
    email = (request.data.get('email') or '').strip().lower()
    cedula = (request.data.get('cedula') or '').strip()
    country_code = (request.data.get('country_code') or '').strip()
    phone = (request.data.get('phone') or '').strip()
    password = request.data.get('password', '')
    password_confirmacion = request.data.get('confirm_password', '')

    if not nombre or not email or not cedula or not phone or not password:
        return Response({"exito": False, "error": "Todos los campos son obligatorios."}, status=400)

    if password_confirmacion and password != password_confirmacion:
        return Response({"exito": False, "error": "Las contraseñas no coinciden."}, status=400)

    error_password = validar_password_segura(password)
    if error_password:
        return Response({"exito": False, "error": error_password}, status=400)

    if Usuario.objects.filter(email__iexact=email).exists():
        return Response({"exito": False, "error": "Ya existe una cuenta registrada con ese correo electrónico."}, status=400)

    if Cliente.objects.filter(cedula=cedula).exists():
        return Response({"exito": False, "error": "Ya existe un cliente registrado con esa cédula/NIT."}, status=400)

    rol_cliente, _ = Rol.objects.get_or_create(nombre='Cliente', defaults={'descripcion': 'Rol de cliente final'})

    telefono = f"{country_code} {phone}".strip()
    hoy = timezone.now().date()

    with transaction.atomic():
        usuario = Usuario.objects.create(
            id_rol=rol_cliente,
            nombre=nombre,
            email=email,
            contrasena=make_password(password),
            telefono=telefono,
            estado='Pendiente',
            fecha_registro=hoy,
        )

        Cliente.objects.create(
            cedula=cedula,
            nombre=nombre,
            telefono=telefono,
            email=email,
            fecha_registro=hoy,
            estado='Activo',
        )

    _enviar_codigo_verificacion(
        usuario,
        'register',
        'Verifica tu cuenta - Taller La Roca',
        'Gracias por registrarte en Taller La Roca. Para activar tu cuenta, ingresa el siguiente código:',
    )

    registrar_bitacora(usuario, 'REGISTRO', f"Se registró como nuevo cliente: {usuario.nombre} (cédula/NIT {cedula}).")

    return Response(
        {"exito": True, "mensaje": "Cuenta creada. Te hemos enviado un código de verificación a tu correo electrónico."},
        status=201,
    )


@api_view(['POST'])
def verify_register_code_api(request):
    email = (request.data.get('email') or '').strip().lower()
    codigo = (request.data.get('codigo') or '').strip()

    if not email or not codigo:
        return Response({"exito": False, "error": "Debe ingresar el código de confirmación."}, status=400)

    usuario = Usuario.objects.filter(email__iexact=email, estado='Pendiente').first()
    if not usuario:
        return Response({"exito": False, "error": "Código incorrecto o expirado."}, status=400)

    key_attempts = f"register:code_attempts:{usuario.codigo}"
    if excede_limite(key_attempts, settings.PASSWORD_RESET_CODE_MAX_ATTEMPTS, settings.PASSWORD_RESET_CODE_MAX_AGE_SECONDS):
        return Response({"exito": False, "error": "Demasiados intentos. Solicite un nuevo código."}, status=429)

    codigo_guardado = cache.get(f"register:code:{usuario.codigo}")
    if not codigo_guardado or codigo_guardado != codigo:
        return Response({"exito": False, "error": "Código incorrecto o expirado."}, status=400)

    cache.delete(f"register:code:{usuario.codigo}")
    cache.delete(key_attempts)

    usuario.estado = 'Activo'
    usuario.save(update_fields=['estado'])

    registrar_bitacora(usuario, 'VERIFICACION_CUENTA', 'Verificó su cuenta de cliente mediante el código enviado por correo.')

    return Response({"exito": True, "mensaje": "Cuenta verificada exitosamente. Ahora puede iniciar sesión."}, status=200)


@api_view(['POST'])
def resend_register_code_api(request):
    email = (request.data.get('email') or '').strip().lower()
    ip = (request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR') or 'unknown').split(',')[0].strip()

    if not email:
        return Response({"exito": False, "error": "Debe ingresar un correo electrónico."}, status=400)

    key_email = f"register:resend:email:{email}"
    if excede_limite(key_email, settings.PASSWORD_RESET_LIMIT_PER_EMAIL, settings.PASSWORD_RESET_WINDOW_SECONDS):
        return Response({"exito": False, "error": "Demasiadas solicitudes. Intente nuevamente más tarde."}, status=429)

    key_ip = f"register:resend:ip:{ip}"
    if excede_limite(key_ip, settings.PASSWORD_RESET_LIMIT_PER_IP, settings.PASSWORD_RESET_WINDOW_SECONDS):
        return Response({"exito": False, "error": "Demasiadas solicitudes. Intente nuevamente más tarde."}, status=429)

    usuario = Usuario.objects.filter(email__iexact=email, estado='Pendiente').first()
    if not usuario:
        return Response({"exito": False, "error": "No existe una solicitud de registro pendiente con ese correo."}, status=404)

    _enviar_codigo_verificacion(
        usuario,
        'register',
        'Verifica tu cuenta - Taller La Roca',
        'Has solicitado un nuevo código de verificación para activar tu cuenta en Taller La Roca:',
    )

    registrar_bitacora(usuario, 'REENVIO_CODIGO', 'Solicitó un nuevo código de verificación de registro.')

    return Response({"exito": True, "mensaje": "Te hemos reenviado el código de verificación a tu correo electrónico."}, status=200)


@api_view(['POST'])
def aceptar_cotizacion_api(request, cotizacion_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU07', 'Editar')
    if error_permiso:
        return error_permiso

    try:
        cotizacion = Cotizacion.objects.select_related('id_cliente').get(codigo=cotizacion_id)
    except Cotizacion.DoesNotExist:
        return Response({"exito": False, "error": "Cotización no encontrada."}, status=404)

    ya_estaba_aprobada = (cotizacion.estado or '').strip().lower() == 'aprobada'

    if not ya_estaba_aprobada:
        items_con_producto = list(
            Detallecotizacion.objects.filter(id_cotizacion=cotizacion, id_producto__isnull=False)
            .select_related('id_producto')
        )

        errores_stock = []
        for item in items_con_producto:
            stock_disponible = item.id_producto.stock_actual or 0
            if stock_disponible < item.cantidad:
                errores_stock.append(
                    f"{item.id_producto.nombre}: stock disponible {stock_disponible}, se requieren {item.cantidad}."
                )

        if errores_stock:
            return Response(
                {
                    "exito": False,
                    "error": "No hay stock suficiente para aprobar esta cotización: " + " | ".join(errores_stock),
                },
                status=400,
            )

        with transaction.atomic():
            for item in items_con_producto:
                producto = item.id_producto
                producto.stock_actual = (producto.stock_actual or 0) - item.cantidad
                producto.save(update_fields=['stock_actual'])

            cotizacion.estado = 'Aprobada'
            cotizacion.save(update_fields=['estado'])

    cliente = cotizacion.id_cliente

    usuario_cliente, creado = obtener_o_crear_usuario_cliente(cliente)

    if creado:
        registrar_bitacora(
            usuario_sesion,
            'CREACIÓN',
            f"Generó usuario cliente '{usuario_cliente.email}' al aceptar cotización {cotizacion.codigo}."
        )

    registrar_bitacora(
        usuario_sesion,
        'MODIFICACIÓN',
        f"Aprobó cotización {cotizacion.codigo} del cliente {cliente.nombre}."
    )

    return Response(
        {
            "exito": True,
            "mensaje": "Cotización aprobada correctamente.",
            "usuario_cliente": usuario_cliente.email,
            "password_temporal": settings.CLIENT_TEMP_PASSWORD,
            "usuario_creado": creado,
        },
        status=200,
    )

# ==========================================
# GESTIONAR PERMISOS POR M�DULO Y ROL
# ==========================================
@api_view(['GET', 'POST'])
def permisos_api(request):
    """
    GET: Obtener todos los permisos por rol
    POST: Guardar/actualizar los permisos
    """
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    if request.method == 'GET':
        try:
            ensure_permiso_modulo_table()
        except OperationalError as exc:
            return Response({'exito': False, 'error': str(exc)}, status=500)
        permisos = PermisoModulo.objects.all()
        if usuario_sesion.id_rol.nombre != 'Administrador':
            permisos = permisos.filter(id_rol=usuario_sesion.id_rol)
        serializer = PermisoModuloSerializer(permisos, many=True)
        return Response(serializer.data)

    error_admin = exigir_admin(usuario_sesion)
    if error_admin:
        return error_admin

    elif request.method == 'POST':
        data = request.data
        try:
            ensure_permiso_modulo_table()
        except OperationalError as exc:
            return Response({'exito': False, 'error': str(exc)}, status=500)
        
        try:
            # Limpiar permisos anteriores
            PermisoModulo.objects.all().delete()
            
            # Iterar sobre cada rol
            for rol_nombre, modulos in data.items():
                rol = resolver_rol_por_nombre(rol_nombre)
                if not rol:
                    continue
                
                # Iterar sobre cada m�dulo/CU
                for cu_nombre, item in modulos.items():
                    if not isinstance(item, dict):
                        continue
                    
                    # Extraer info del m�dulo
                    parts = cu_nombre.split('_', 1)
                    codigo_cu = parts[0] if len(parts) > 0 else cu_nombre
                    nombre_modulo = parts[1] if len(parts) > 1 else cu_nombre
                    
                    # Iterar sobre cada acci�n
                    # Obtener el diccionario de acciones
                    acciones_dict = item.get('acciones', {})
                    if not isinstance(acciones_dict, dict):
                        continue
                    
                    for accion, permitido in acciones_dict.items():
                        if accion == 'modulo':
                            continue
                        
                        PermisoModulo.objects.create(
                            id_rol=rol,
                            codigo_cu=codigo_cu,
                            nombre_modulo=nombre_modulo,
                            accion=accion,
                            permitido=bool(permitido),
                        )
            
            registrar_bitacora(usuario_sesion, 'MODIFICACI�N', 'Actualiz� los permisos de m�dulos por rol.')
            return Response({'exito': True, 'mensaje': 'Permisos guardados exitosamente.'}, status=200)
        
        except Exception as e:
            return Response({'exito': False, 'error': str(e)}, status=400)
