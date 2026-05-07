from rest_framework.decorators import api_view
from rest_framework import viewsets
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from django.core import signing # Para generar el Token de sesión
from django.core.signing import BadSignature, SignatureExpired
from django.conf import settings
from django.utils import timezone
from django.http import HttpResponse
from django.core.mail import send_mail
from django.core.cache import cache
from django.db import connection, transaction
from django.db.models import Q
from django.utils.dateparse import parse_date
import math
import uuid
import csv
import re
import unicodedata
from .models import (
    Usuario,
    Bitacora,
    Rol,
    Privilegio,
    Cliente,
    Motocicleta,
    Cotizacion,
    Proveedor,
    Producto,
    Compra,
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
    CompraSerializer,
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


def normalizar_usuario_desde_nombre(nombre_completo):
    texto = unicodedata.normalize('NFKD', nombre_completo or '')
    texto = ''.join(ch for ch in texto if not unicodedata.combining(ch))
    texto = texto.lower()
    partes = re.findall(r'[a-z0-9]+', texto)
    base = ''.join(partes)
    return base or 'cliente'


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

    error_admin = exigir_admin(usuario_sesion)
    if error_admin:
        return error_admin

    registros = Bitacora.objects.select_related('id_usuario').all()

    usuario_id = request.GET.get('usuario')
    accion = request.GET.get('accion', '').strip()
    fecha_desde = request.GET.get('fecha_desde', '').strip()
    fecha_hasta = request.GET.get('fecha_hasta', '').strip()
    exportar = request.GET.get('export', '').strip().lower()

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
# CU13: GESTIONAR PROVEEDORES (API REST)
# ==========================================
class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all().order_by('codigo')
    serializer_class = ProveedorSerializer

    def _autorizar_admin(self, request):
        usuario_sesion, error_auth = obtener_usuario_autenticado(request)
        if error_auth:
            return None, error_auth

        error_admin = exigir_admin(usuario_sesion)
        if error_admin:
            return None, error_admin

        self._usuario_sesion = usuario_sesion
        return usuario_sesion, None

    def list(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        proveedor = serializer.save()
        registrar_bitacora(
            self._usuario_sesion,
            'CREACIÓN',
            f"Registró proveedor: {proveedor.empresa}.",
        )

    def perform_update(self, serializer):
        proveedor = serializer.save()
        registrar_bitacora(
            self._usuario_sesion,
            'MODIFICACIÓN',
            f"Actualizó proveedor: {proveedor.empresa}.",
        )

    def perform_destroy(self, instance):
        nombre_proveedor = instance.empresa
        instance.delete()
        registrar_bitacora(
            self._usuario_sesion,
            'ELIMINACIÓN',
            f"Eliminó proveedor: {nombre_proveedor}.",
        )


# ==========================================
# CU10: GESTIONAR PRODUCTOS (API REST)
# ==========================================
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('codigo')
    serializer_class = ProductoSerializer

    def _autorizar_admin(self, request):
        usuario_sesion, error_auth = obtener_usuario_autenticado(request)
        if error_auth:
            return None, error_auth

        error_admin = exigir_admin(usuario_sesion)
        if error_admin:
            return None, error_admin

        self._usuario_sesion = usuario_sesion
        return usuario_sesion, None

    def list(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        producto = serializer.save()
        registrar_bitacora(
            self._usuario_sesion,
            'CREACIÓN',
            f"Registró producto: {producto.nombre}.",
        )

    def perform_update(self, serializer):
        producto = serializer.save()
        registrar_bitacora(
            self._usuario_sesion,
            'MODIFICACIÓN',
            f"Actualizó producto: {producto.nombre}.",
        )

    def perform_destroy(self, instance):
        nombre_producto = instance.nombre
        instance.delete()
        registrar_bitacora(
            self._usuario_sesion,
            'ELIMINACIÓN',
            f"Eliminó producto: {nombre_producto}.",
        )


# ==========================================
# CU12: GESTIONAR COMPRAS A PROVEEDORES (API REST)
# ==========================================
class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compra.objects.all().order_by('codigo')
    serializer_class = CompraSerializer

    def _autorizar_admin(self, request):
        usuario_sesion, error_auth = obtener_usuario_autenticado(request)
        if error_auth:
            return None, error_auth

        error_admin = exigir_admin(usuario_sesion)
        if error_admin:
            return None, error_admin

        self._usuario_sesion = usuario_sesion
        return usuario_sesion, None

    def list(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        _, error = self._autorizar_admin(request)
        if error:
            return error
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        with transaction.atomic():
            compra = serializer.save()

            numero_factura = compra.numero_factura or 'SIN_FACTURA'
            registrar_bitacora(
                self._usuario_sesion,
                'CREACIÓN',
                f"Registró compra al proveedor {compra.id_proveedor.empresa} con factura {numero_factura}.",
            )


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

    error_rol = exigir_roles(usuario_sesion, ['Administrador', 'Recepcionista'])
    if error_rol:
        return error_rol

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