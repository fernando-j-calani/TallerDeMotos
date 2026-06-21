from rest_framework import serializers
from datetime import timezone as dt_timezone
from zoneinfo import ZoneInfo
from .models import (
    Usuario,
    Rol,
    Privilegio,
    Bitacora,
    RolPrivilegio,
    PermisoModulo,
    Cliente,
    Motocicleta,
    Proveedor,
    Producto,
    Cotizacion,
    Detallecotizacion,
    Ordentrabajo,
    Notatrabajo,
    Detalleordentrabajo,
    Compra,
    Detallecompra,
    Notaservicio,
    Factura,
    Seguimiento,
)

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class PrivilegioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Privilegio
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    # Esto es para que al ver un usuario, veamos el nombre del rol y no solo el ID
    rol_nombre = serializers.ReadOnlyField(source='id_rol.nombre')

    class Meta:
        model = Usuario
        fields = ['codigo', 'nombre', 'email', 'telefono', 'estado', 'id_rol', 'rol_nombre']

class BitacoraSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='id_usuario.nombre')
    usuario_rol = serializers.ReadOnlyField(source='id_usuario.id_rol.nombre')
    fecha_hora = serializers.SerializerMethodField()

    @staticmethod
    def _to_la_paz(dt_value):
        if not dt_value:
            return None

        # La BD histórica guarda este campo sin zona (UTC implícito).
        # Aunque Django lo entregue con tz, normalizamos primero a naive y
        # luego lo interpretamos como UTC para evitar el desfase de +4 horas.
        dt_value = dt_value.replace(tzinfo=None).replace(tzinfo=dt_timezone.utc)

        return dt_value.astimezone(ZoneInfo('America/La_Paz'))

    def get_fecha_hora(self, obj):
        dt_local = self._to_la_paz(obj.fecha_hora)
        return dt_local.isoformat() if dt_local else None

    class Meta:
        model = Bitacora
        fields = '__all__'


class RolPrivilegioSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.ReadOnlyField(source='id_rol.nombre')
    privilegio_nombre = serializers.ReadOnlyField(source='id_privilegio.nombre')

    class Meta:
        model = RolPrivilegio
        fields = ['id_rol', 'id_privilegio', 'rol_nombre', 'privilegio_nombre']


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['codigo', 'cedula', 'nombre', 'telefono', 'telefono_alternativo', 'direccion', 'email', 'fecha_registro', 'estado']


class MotocicletaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.ReadOnlyField(source='id_cliente.nombre')

    class Meta:
        model = Motocicleta
        fields = '__all__'


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'


class DetalleCotizacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detallecotizacion
        fields = '__all__'


class CotizacionSerializer(serializers.ModelSerializer):
    id_cliente_nombre = serializers.ReadOnlyField(source='id_cliente.nombre')
    id_motocicleta_placa = serializers.ReadOnlyField(source='id_motocicleta.placa')
    detalles = serializers.SerializerMethodField()

    def get_detalles(self, obj):
        items = Detallecotizacion.objects.filter(id_cotizacion=obj).order_by('codigo')
        return DetalleCotizacionSerializer(items, many=True).data

    class Meta:
        model = Cotizacion
        fields = '__all__'


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.ReadOnlyField(source='id_cliente.nombre')
    cliente_cedula = serializers.ReadOnlyField(source='id_cliente.cedula')
    cliente_email = serializers.ReadOnlyField(source='id_cliente.email')
    cliente_telefono = serializers.ReadOnlyField(source='id_cliente.telefono')
    motocicleta_placa = serializers.ReadOnlyField(source='id_motocicleta.placa')
    motocicleta_marca = serializers.ReadOnlyField(source='id_motocicleta.marca')
    motocicleta_modelo = serializers.ReadOnlyField(source='id_motocicleta.modelo')
    motocicleta_chasis = serializers.ReadOnlyField(source='id_motocicleta.numero_chasis')
    mecanico_nombre = serializers.ReadOnlyField(source='id_mecanico.nombre')

    class Meta:
        model = Ordentrabajo
        fields = '__all__'
        extra_kwargs = {
            'hora_ingreso': {'required': False, 'allow_null': True, 'allow_blank': True},
            'proforma_nro': {'required': False, 'allow_null': True, 'allow_blank': True},
            'origen': {'required': False, 'allow_null': True, 'allow_blank': True},
            'entregado_por_nombre': {'required': False, 'allow_null': True, 'allow_blank': True},
            'entregado_por_ci': {'required': False, 'allow_null': True, 'allow_blank': True},
            'combustible_nivel': {'required': False, 'allow_null': True, 'allow_blank': True},
            'kilometraje_recorrido': {'required': False, 'allow_null': True, 'allow_blank': True},
            'fecha_estimada_entrega': {'required': False, 'allow_null': True},
            'cotizado_por': {'required': False, 'allow_null': True, 'allow_blank': True},
            'req_cliente': {'required': False, 'allow_null': True, 'allow_blank': True},
            'soluciones_tecnicas': {'required': False, 'allow_null': True, 'allow_blank': True},
            'sugerencias_obs': {'required': False, 'allow_null': True, 'allow_blank': True},
        }


class HistorialOrdenSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.ReadOnlyField(source='id_cliente.nombre')
    cliente_cedula = serializers.ReadOnlyField(source='id_cliente.cedula')
    cliente_email = serializers.ReadOnlyField(source='id_cliente.email')
    cliente_telefono = serializers.ReadOnlyField(source='id_cliente.telefono')
    motocicleta_placa = serializers.ReadOnlyField(source='id_motocicleta.placa')
    motocicleta_marca = serializers.ReadOnlyField(source='id_motocicleta.marca')
    motocicleta_modelo = serializers.ReadOnlyField(source='id_motocicleta.modelo')
    motocicleta_chasis = serializers.ReadOnlyField(source='id_motocicleta.numero_chasis')
    mecanico_nombre = serializers.ReadOnlyField(source='id_mecanico.nombre')

    class Meta:
        model = Ordentrabajo
        fields = '__all__'
        extra_kwargs = {
            'hora_ingreso': {'required': False, 'allow_null': True, 'allow_blank': True},
            'proforma_nro': {'required': False, 'allow_null': True, 'allow_blank': True},
            'origen': {'required': False, 'allow_null': True, 'allow_blank': True},
            'entregado_por_nombre': {'required': False, 'allow_null': True, 'allow_blank': True},
            'entregado_por_ci': {'required': False, 'allow_null': True, 'allow_blank': True},
            'combustible_nivel': {'required': False, 'allow_null': True, 'allow_blank': True},
            'kilometraje_recorrido': {'required': False, 'allow_null': True, 'allow_blank': True},
            'fecha_estimada_entrega': {'required': False, 'allow_null': True},
            'cotizado_por': {'required': False, 'allow_null': True, 'allow_blank': True},
            'req_cliente': {'required': False, 'allow_null': True, 'allow_blank': True},
            'soluciones_tecnicas': {'required': False, 'allow_null': True, 'allow_blank': True},
            'sugerencias_obs': {'required': False, 'allow_null': True, 'allow_blank': True},
        }


class NotaTrabajoSerializer(serializers.ModelSerializer):
    orden_numero = serializers.ReadOnlyField(source='id_orden_trabajo.codigo')
    mecanico_nombre = serializers.ReadOnlyField(source='id_mecanico.nombre')

    class Meta:
        model = Notatrabajo
        fields = '__all__'


class CompraSerializer(serializers.ModelSerializer):
    proveedor_empresa = serializers.ReadOnlyField(source='id_proveedor.empresa')

    class Meta:
        model = Compra
        fields = '__all__'


class DetalleCompraSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='id_producto.nombre')

    class Meta:
        model = Detallecompra
        fields = '__all__'


class DetalleOrdenTrabajoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='id_producto.nombre')
    producto_codigo = serializers.ReadOnlyField(source='id_producto.codigo')
    producto_codigo_barras = serializers.ReadOnlyField(source='id_producto.codigo_barras')
    producto_ubicacion_almacen = serializers.ReadOnlyField(source='id_producto.ubicacion_almacen')

    class Meta:
        model = Detalleordentrabajo
        fields = '__all__'


class PerfilSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.ReadOnlyField(source='id_rol.nombre')

    class Meta:
        model = Usuario
        fields = ['codigo', 'nombre', 'email', 'telefono', 'estado', 'rol_nombre']


class PermisoModuloSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.ReadOnlyField(source='id_rol.nombre')

    class Meta:
        model = PermisoModulo
        fields = ['id', 'id_rol', 'rol_nombre', 'codigo_cu', 'nombre_modulo', 'accion', 'permitido']


class NotaServicioSerializer(serializers.ModelSerializer):
    orden_codigo = serializers.ReadOnlyField(source='id_orden_trabajo.codigo')
    cliente_nombre = serializers.ReadOnlyField(source='id_cliente.nombre')

    class Meta:
        model = Notaservicio
        fields = '__all__'


class FacturaSerializer(serializers.ModelSerializer):
    nota_codigo = serializers.ReadOnlyField(source='id_nota_servicio.codigo')

    class Meta:
        model = Factura
        fields = '__all__'


class SeguimientoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.ReadOnlyField(source='id_cliente.nombre')
    usuario_nombre = serializers.ReadOnlyField(source='id_usuario.nombre')

    class Meta:
        model = Seguimiento
        fields = '__all__'