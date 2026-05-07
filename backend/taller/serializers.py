from rest_framework import serializers
from datetime import timezone as dt_timezone
from zoneinfo import ZoneInfo
from .models import (
    Usuario,
    Rol,
    Privilegio,
    Bitacora,
    RolPrivilegio,
    Cliente,
    Motocicleta,
    Proveedor,
    Producto,
    Compra,
    Detallecompra,
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
        fields = '__all__'


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


class DetalleCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detallecompra
        fields = ['codigo', 'id_producto', 'cantidad', 'precio_compra', 'subtotal']
        read_only_fields = ['codigo']


class CompraSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraSerializer(source='detallecompra_set', many=True)

    class Meta:
        model = Compra
        fields = [
            'codigo',
            'id_proveedor',
            'numero_factura',
            'fecha',
            'subtotal',
            'impuesto',
            'total',
            'metodo_pago',
            'estado',
            'detalles',
        ]

    def create(self, validated_data):
        detalles_data = validated_data.pop('detallecompra_set', [])
        compra = Compra.objects.create(**validated_data)

        for detalle in detalles_data:
            Detallecompra.objects.create(id_compra=compra, **detalle)

        return compra


class PerfilSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.ReadOnlyField(source='id_rol.nombre')

    class Meta:
        model = Usuario
        fields = ['codigo', 'nombre', 'email', 'telefono', 'estado', 'rol_nombre']