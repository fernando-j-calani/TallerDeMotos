from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from django.core import signing # Para generar el Token de sesión
from django.core.signing import BadSignature, SignatureExpired
from django.conf import settings
from django.utils import timezone
from django.http import HttpResponse
from django.core.mail import send_mail
from django.core.cache import cache
from django.db import connection, OperationalError, transaction
from django.db.models import Q, F
from django.utils.dateparse import parse_date
import math
import uuid
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
    Producto,
    Proveedor,
    Compra,
    Detallecompra,
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
)
from django.contrib.auth.hashers import make_password


MAX_LOGIN_INTENTOS = 3
LOGIN_BLOQUEO_SEGUNDOS = 60


def registrar_bitacora(usuario, accion, descripcion):
    Bitacora.objects.create(
        id_usuario=usuario,
        fecha_hora=timezone.now(),
        accion=accion,
        descripcion=descripcion,
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

        requiere_cambio = (
            usuario.id_rol.nombre == 'Cliente'
            and check_password(settings.CLIENT_TEMP_PASSWORD, usuario.contrasena)
        )
        rutas_permitidas = {'/api/password/force-change/', '/api/logout/'}
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
    except OperationalError:
        return False
    return PermisoModulo.objects.filter(
        id_rol=usuario.id_rol,
        codigo_cu=codigo_cu,
        accion__iexact=accion,
        permitido=True,
    ).exists()


def exigir_permiso_modulo(usuario, codigo_cu, acciones):
    if usuario.id_rol.nombre == 'Administrador':
        return None

    if isinstance(acciones, (list, tuple, set)):
        acciones_validas = acciones
    else:
        acciones_validas = [acciones]

    if any(tiene_permiso_modulo(usuario, codigo_cu, accion) for accion in acciones_validas):
        return None

    return Response({"exito": False, "error": "No autorizado para esta operación."}, status=403)


def ensure_permiso_modulo_table():
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
        if not cursor.fetchone()[0]:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS public.permiso_modulo (
                    id serial PRIMARY KEY,
                    id_rol integer NOT NULL REFERENCES rol(codigo),
                    codigo_cu varchar(20) NOT NULL,
                    nombre_modulo varchar(255) NOT NULL,
                    accion varchar(50) NOT NULL,
                    permitido boolean NOT NULL DEFAULT false
                )
                """
            )
            cursor.execute(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS permiso_modulo_unique_idx
                ON public.permiso_modulo (id_rol, codigo_cu, nombre_modulo, accion)
                """
            )


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

    if id_producto not in (None, ''):
        try:
            producto = Producto.objects.get(codigo=id_producto)
        except Producto.DoesNotExist:
            return None, f"Producto con id {id_producto} no encontrado."

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
    if estado not in ('Abierta', 'En progreso'):
        return "La orden de trabajo debe estar Abierta o En progreso para registrar una nota."

    return None


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
            
            # Generamos un TOKEN firmado criptográficamente para que React lo guarde
            token_data = {
                'id_usuario': usuario.codigo,
                'rol': usuario.id_rol.nombre,
                'pwd_sig': usuario.contrasena[-16:],
            }
            token_seguro = signing.dumps(token_data)

            # --- NUEVO: REGISTRAR LOGIN EN BITÁCORA ---
            Bitacora.objects.create(
                id_usuario=usuario,
                fecha_hora=timezone.now(),
                accion='LOGIN',
                descripcion=f"El usuario {usuario.nombre} inició sesión en el sistema."
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
# CERRAR SESIÓN (Para la Bitácora)
# ==========================================
@api_view(['POST'])
def logout_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

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

    registros = Bitacora.objects.select_related('id_usuario').all()

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
        writer.writerow(['codigo', 'fecha_hora', 'usuario', 'accion', 'descripcion'])

        for reg in registros:
            writer.writerow([
                reg.codigo,
                reg.fecha_hora.isoformat() if reg.fecha_hora else '',
                reg.id_usuario.nombre if reg.id_usuario else '',
                reg.accion,
                reg.descripcion,
            ])
        return response

    serializer = BitacoraSerializer(registros, many=True)
    return Response(serializer.data, status=200)

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
        return Response(serializer.data, status=200)

    elif request.method == 'POST':
        # Lógica para CREAR un nuevo usuario
        datos = request.data
        try:
            rol_asignado = Rol.objects.get(codigo=datos['id_rol'])
            
            nuevo_usuario = Usuario.objects.create(
                nombre=datos['nombre'],
                email=datos['email'],
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


            return Response({"exito": True, "mensaje": "Usuario creado exitosamente"}, status=201)
        except Rol.DoesNotExist:
            return Response({"exito": False, "error": "El rol seleccionado no existe."}, status=400)
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
    email = request.data.get('email', usuario_obj.email)
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

    usuario_obj.nombre = nombre
    usuario_obj.email = email
    usuario_obj.telefono = telefono
    usuario_obj.estado = estado
    usuario_obj.id_rol = rol
    usuario_obj.save(update_fields=['nombre', 'email', 'telefono', 'estado', 'id_rol'])

    registrar_bitacora(
        usuario_sesion,
        'MODIFICACIÓN',
        f"Actualizó usuario {usuario_obj.nombre} (estado: {usuario_obj.estado}, rol: {rol.nombre})."
    )

    return Response({"exito": True, "mensaje": "Usuario actualizado."}, status=200)

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

    error_rol = exigir_roles(usuario_sesion, ['Administrador', 'Recepcionista'])
    if error_rol:
        return error_rol

    if request.method == 'GET':
        busqueda = request.GET.get('q', '').strip()
        incluir_inactivos = request.GET.get('incluir_inactivos', '').strip().lower() == 'true'
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


@api_view(['PUT', 'DELETE'])
def cliente_detalle_api(request, cliente_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_rol = exigir_roles(usuario_sesion, ['Administrador', 'Recepcionista'])
    if error_rol:
        return error_rol

    try:
        cliente = Cliente.objects.get(codigo=cliente_id)
    except Cliente.DoesNotExist:
        return Response({"exito": False, "error": "Cliente no encontrado."}, status=404)

    if request.method == 'PUT':
        serializer = ClienteSerializer(cliente, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({"exito": False, "errores": serializer.errors}, status=400)

        cliente_actualizado = serializer.save()
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

    error_rol = exigir_roles(usuario_sesion, ['Administrador', 'Recepcionista'])
    if error_rol:
        return error_rol

    if request.method == 'GET':
        busqueda = request.GET.get('q', '').strip()
        incluir_inactivos = request.GET.get('incluir_inactivos', '').strip().lower() == 'true'
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

    error_rol = exigir_roles(usuario_sesion, ['Administrador', 'Recepcionista'])
    if error_rol:
        return error_rol

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

    proveedor.delete()
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


class OrdenTrabajo:
    @staticmethod
    def EnviaDatos(data):
        return data

    @staticmethod
    def ValidaCotizacionOrigen(cotizacion_id):
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
        datos['id_orden_trabajo'] = orden.codigo
        datos['id_mecanico'] = mecanico.codigo
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
    def SolicitarValidacion(proveedor_id, detalles):
        try:
            proveedor = Proveedor.objects.get(codigo=proveedor_id)
        except Proveedor.DoesNotExist:
            return False
        return proveedor is not None and isinstance(detalles, list)

    @staticmethod
    def EnviarPayloadComprasYDetalle(data):
        return data

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

    detalles = request.data.get('detalles', [])
    datos_compra = Compras.EnviarPayloadComprasYDetalle(request.data)
    serializer = CompraSerializer(data=datos_compra)
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    if not Compras.SolicitarValidacion(serializer.validated_data.get('id_proveedor'), detalles):
        return Response({"exito": False, "error": "Proveedor o detalles no válidos."}, status=400)

    compra = Compras.RegistraCompra(serializer.validated_data)
    for detalle in detalles:
        try:
            producto = Producto.objects.get(codigo=detalle.get('id_producto'))
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


@api_view(['PUT'])
def cotizacion_detalle_api(request, cotizacion_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU07', 'Editar')
    if error_permiso:
        return error_permiso

    cotizacion = Cotizaciones.BuscaCotizacion(cotizacion_id)
    if cotizacion is None:
        return Response({"exito": False, "error": "Cotización no encontrada."}, status=404)

    serializer = CotizacionSerializer(cotizacion, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    try:
        cotizacion_actualizada = serializer.save()
    except Exception as exc:
        return Response({"exito": False, "error": str(exc)}, status=400)

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
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    origen_cotizacion = OrdenTrabajo.ValidaCotizacionOrigen(serializer.validated_data.get('id_cotizacion'))
    if origen_cotizacion is None:
        return Response({"exito": False, "error": "Cotización de origen no válida."}, status=400)

    orden = Ordentrabajo.objects.create(**serializer.validated_data)
    OrdenTrabajo.SolicitaRegistroBitacora(usuario_sesion, 'CREACIÓN', f"Registró orden de trabajo #{orden.codigo} para cliente ID {orden.id_cliente.codigo}.")
    confirmacion = OrdenTrabajo.RetornaConfirmacionGeneral(True)
    return Response({"exito": True, "mensaje": "Orden de trabajo creada.", **confirmacion}, status=201)


@api_view(['PUT'])
def orden_trabajo_detalle_api(request, orden_id):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU08', 'Editar')
    if error_permiso:
        return error_permiso

    try:
        orden = Ordentrabajo.objects.get(codigo=orden_id)
    except Ordentrabajo.DoesNotExist:
        return Response({"exito": False, "error": "Orden de trabajo no encontrada."}, status=404)

    serializer = OrdenTrabajoSerializer(orden, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({"exito": False, "errores": serializer.errors}, status=400)

    orden_actualizada = serializer.save()
    OrdenTrabajo.ModificaEstado(orden_actualizada, request.data.get('estado'))
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
    data['fecha_hora'] = timezone.now()
    data['id_mecanico'] = usuario_sesion.codigo

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


# ==========================================
# CU14: GESTIONAR FACTURACION
# ==========================================
@api_view(['POST'])
def facturacion_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU14', 'Adicionar')
    if error_permiso:
        return error_permiso

    orden_id = request.data.get('orden_id') or request.data.get('id_orden_trabajo')
    metodo_pago = (request.data.get('metodo_pago') or '').strip()
    estado_pago = (request.data.get('estado_pago') or 'Pendiente').strip()
    nit_cliente = (request.data.get('nit_cliente') or '').strip()
    razon_social = (request.data.get('razon_social') or '').strip()
    impuesto_raw = request.data.get('impuesto', '0')

    if not orden_id:
        return Response({"exito": False, "error": "Debe seleccionar una orden de trabajo."}, status=400)

    if not nit_cliente or not razon_social:
        return Response({"exito": False, "error": "NIT y Razón Social son obligatorios."}, status=400)

    try:
        impuesto = Decimal(str(impuesto_raw or '0'))
    except (InvalidOperation, TypeError):
        return Response({"exito": False, "error": "Impuesto inválido."}, status=400)

    try:
        orden = Ordentrabajo.objects.select_related('id_cliente', 'id_motocicleta').get(codigo=orden_id)
    except Ordentrabajo.DoesNotExist:
        return Response({"exito": False, "error": "Orden de trabajo no encontrada."}, status=404)

    if (orden.estado or '').strip().lower() != 'finalizado':
        return Response({"exito": False, "error": "La orden debe estar en estado Finalizado."}, status=400)

    if Notaservicio.objects.filter(id_orden_trabajo=orden).exists():
        return Response({"exito": False, "error": "La orden ya fue facturada previamente."}, status=409)

    total_repuestos = Decimal(orden.costo_repuestos or 0)
    total_mano_obra = Decimal(orden.costo_mano_obra or 0)
    total_general = total_repuestos + total_mano_obra
    fecha_emision = timezone.now().date()

    with transaction.atomic():
        nota = Notaservicio.objects.create(
            id_orden_trabajo=orden,
            id_cliente=orden.id_cliente,
            fecha_emision=fecha_emision,
            total_repuestos=total_repuestos,
            total_mano_obra=total_mano_obra,
            total_general=total_general,
            observaciones=(request.data.get('observaciones') or '').strip() or None,
            estado_pago=estado_pago or 'Pendiente',
        )

        factura = Factura.objects.create(
            id_nota_servicio=nota,
            numero_autorizacion=(request.data.get('numero_autorizacion') or '').strip() or None,
            fecha_emision=fecha_emision,
            monto_servicio_facturado=total_mano_obra,
            impuesto=impuesto,
            total_facturado=total_mano_obra + impuesto,
            nit_cliente=nit_cliente,
            razon_social=razon_social,
        )

        nuevo_estado = 'Pagado' if estado_pago.lower() == 'pagado' else 'Facturado'
        Ordentrabajo.objects.filter(codigo=orden.codigo).update(estado=nuevo_estado)
        orden.estado = nuevo_estado

        registrar_bitacora(
            usuario_sesion,
            'FACTURACION',
            (
                f"Procesó facturación de orden #{orden.codigo} (Método: {metodo_pago or 'N/D'}, "
                f"Estado pago: {estado_pago or 'Pendiente'})."
            ),
        )

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
            "nota_servicio": NotaServicioSerializer(nota).data,
            "factura": FacturaSerializer(factura).data,
            "metodo_pago": metodo_pago,
        },
        status=201,
    )


@api_view(['GET'])
def facturacion_historial_api(request):
    usuario_sesion, error_auth = obtener_usuario_autenticado(request)
    if error_auth:
        return error_auth

    error_permiso = exigir_permiso_modulo(usuario_sesion, 'CU14', 'Mostrar')
    if error_permiso:
        return error_permiso

    ordenes = (
        Ordentrabajo.objects.select_related('id_cliente', 'id_motocicleta')
        .filter(estado__in=['Facturado', 'Pagado'])
        .order_by('-fecha_fin', '-codigo')
    )

    notas = Notaservicio.objects.select_related('id_orden_trabajo').filter(id_orden_trabajo__in=ordenes)
    notas_por_orden = {nota.id_orden_trabajo_id: nota for nota in notas}

    facturas = Factura.objects.select_related('id_nota_servicio').filter(id_nota_servicio__in=notas)
    facturas_por_nota = {factura.id_nota_servicio_id: factura for factura in facturas}

    respuesta = []
    for orden in ordenes:
        nota = notas_por_orden.get(orden.codigo)
        factura = facturas_por_nota.get(nota.codigo) if nota else None
        respuesta.append(
            {
                "orden": OrdenTrabajoSerializer(orden).data,
                "nota_servicio": NotaServicioSerializer(nota).data if nota else None,
                "factura": FacturaSerializer(factura).data if factura else None,
            }
        )

    return Response(respuesta, status=200)


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

    if email:
        key_email = f"pwdreset:email:{email}"
        if excede_limite(key_email, settings.PASSWORD_RESET_LIMIT_PER_EMAIL, settings.PASSWORD_RESET_WINDOW_SECONDS):
            return Response({"exito": True, "mensaje": "Si la cuenta existe, se enviará un enlace de recuperación."}, status=200)

    key_ip = f"pwdreset:ip:{ip}"
    if excede_limite(key_ip, settings.PASSWORD_RESET_LIMIT_PER_IP, settings.PASSWORD_RESET_WINDOW_SECONDS):
        return Response({"exito": True, "mensaje": "Si la cuenta existe, se enviará un enlace de recuperación."}, status=200)

    usuario = Usuario.objects.filter(email__iexact=email).first()
    if usuario and (usuario.estado or 'Activo') == 'Activo':
        destinatario_envio = _resolver_destinatario_reset_online(usuario)
        payload = {
            'purpose': 'password_reset',
            'uid': usuario.codigo,
            'jti': str(uuid.uuid4()),
        }
        token = signing.dumps(payload, salt='password-reset')
        enlace = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"

        if settings.PASSWORD_RESET_LOG_TO_CONSOLE:
            print(
                f"[PASSWORD_RESET] mode={settings.MAIL_MODE} from={settings.DEFAULT_FROM_EMAIL} "
                f"to={destinatario_envio} original={usuario.email} link={enlace}"
            )

        enviados = 0
        ultimo_error = None

        for intento in range(1, settings.EMAIL_SEND_RETRIES + 1):
            try:
                enviados = send_mail(
                    subject='Recuperación de contraseña - Taller La Roca',
                    message=(
                        'Solicitaste restablecer tu contraseña.\n\n'
                        f'Usa este enlace (válido por {settings.PASSWORD_RESET_TOKEN_MAX_AGE_SECONDS // 60} minutos):\n{enlace}\n\n'
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

        registrar_bitacora(usuario, 'SOLICITUD_RESET', 'Solicitó recuperación de contraseña por correo.')

    return Response({"exito": True, "mensaje": "Si la cuenta existe, se enviará un enlace de recuperación."}, status=200)


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

    cotizacion.estado = 'Aprobada'
    cotizacion.save(update_fields=['estado'])

    cliente = cotizacion.id_cliente

    try:
        rol_cliente = Rol.objects.get(nombre='Cliente')
    except Rol.DoesNotExist:
        rol_cliente = Rol.objects.create(nombre='Cliente', descripcion='Rol de cliente final')

    usuario_cliente = Usuario.objects.filter(nombre=cliente.nombre, id_rol=rol_cliente).first()
    creado = False

    if not usuario_cliente:
        nombre_usuario = generar_usuario_unico_para_cliente(cliente.nombre)
        usuario_cliente = Usuario.objects.create(
            id_rol=rol_cliente,
            nombre=cliente.nombre,
            email=nombre_usuario,
            contrasena=make_password(settings.CLIENT_TEMP_PASSWORD),
            telefono=cliente.telefono,
            estado='Activo',
        )
        creado = True
        registrar_bitacora(
            usuario_sesion,
            'CREACIÓN',
            f"Generó usuario cliente '{nombre_usuario}' al aceptar cotización {cotizacion.codigo}."
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
