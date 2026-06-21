# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from decimal import Decimal

from django.db import models
from django.utils import timezone


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.BooleanField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class Bitacora(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    fecha_hora = models.DateTimeField(blank=True, null=True)
    accion = models.CharField(max_length=50)
    descripcion = models.TextField()

    class Meta:
        managed = False
        db_table = 'bitacora'


class Seguimiento(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey('Cliente', models.DO_NOTHING, db_column='id_cliente')
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    fecha_hora = models.DateTimeField()
    tipo_gestion = models.CharField(max_length=50)
    canal = models.CharField(max_length=50)
    mensaje = models.TextField()
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'seguimiento'


class Cliente(models.Model):
    codigo = models.AutoField(primary_key=True)
    cedula = models.CharField(unique=True, max_length=20)
    nombre = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    telefono_alternativo = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    fecha_registro = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'cliente'


class Compra(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_proveedor = models.ForeignKey('Proveedor', models.DO_NOTHING, db_column='id_proveedor')
    numero_factura = models.CharField(max_length=50, blank=True, null=True)
    fecha = models.DateField(blank=True, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    impuesto = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=50, blank=True, null=True)
    estado = models.CharField(max_length=20, blank=True, null=True)
    comprobante_pago = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'compra'


class Cotizacion(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey(Cliente, models.DO_NOTHING, db_column='id_cliente')
    id_motocicleta = models.ForeignKey('Motocicleta', models.DO_NOTHING, db_column='id_motocicleta')
    fecha_emision = models.DateField(blank=True, null=True)
    fecha_validez = models.DateField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    impuesto = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, blank=True, null=True)

    def calcular_subtotal(self, detalles=None):
        total = Decimal('0')
        if detalles is None:
            detalles = self.detallecotizacion_set.all()

        for detalle in detalles:
            if isinstance(detalle, dict):
                subtotal = detalle.get('subtotal')
                if subtotal is None:
                    cantidad = detalle.get('cantidad', 0)
                    precio_unitario = detalle.get('precio_unitario', Decimal('0'))
                    subtotal = Decimal(cantidad) * Decimal(precio_unitario)
            else:
                subtotal = getattr(detalle, 'subtotal', None)
                if subtotal is None:
                    cantidad = getattr(detalle, 'cantidad', 0)
                    precio_unitario = getattr(detalle, 'precio_unitario', Decimal('0'))
                    subtotal = Decimal(cantidad) * Decimal(precio_unitario)

            total += Decimal(subtotal or 0)

        return total

    def calcular_total(self, detalles=None):
        subtotal = self.subtotal if self.subtotal is not None else self.calcular_subtotal(detalles)
        impuesto = self.impuesto or Decimal('0')
        return subtotal + impuesto

    def validar_fechas(self):
        if self.fecha_emision is None:
            return 'La fecha de emisión es obligatoria.'
        if self.fecha_validez is None:
            return 'La fecha de validez es obligatoria.'
        if self.fecha_validez < self.fecha_emision:
            return 'La fecha de validez no puede ser anterior a la fecha de emisión.'
        return None

    def preparar_para_guardar(self, detalles=None):
        if self.fecha_emision is None:
            self.fecha_emision = timezone.now().date()
        if detalles is not None:
            self.subtotal = self.calcular_subtotal(detalles)
        if self.impuesto is None:
            self.impuesto = Decimal('0')
        self.total = self.calcular_total(detalles)
        if not self.estado:
            self.estado = 'Pendiente'
        return self

    def iniciar_cotizacion(self, detalles=None):
        self.preparar_para_guardar(detalles)
        self.save()
        return self

    def crear_items(self, detalles):
        items = []
        for detalle in detalles:
            item = Detallecotizacion.objects.create(id_cotizacion=self, **detalle)
            items.append(item)
        return items

    def actualizar_estado(self, nuevo_estado):
        if nuevo_estado and (self.estado or '') != nuevo_estado:
            self.estado = nuevo_estado
            self.save(update_fields=['estado'])
        return self

    def save(self, *args, **kwargs):
        if self.fecha_emision is None:
            self.fecha_emision = timezone.now().date()
        if self.impuesto is None:
            self.impuesto = Decimal('0')
        if self.subtotal is None:
            self.subtotal = Decimal('0')
        self.total = self.calcular_total()
        if self.fecha_validez and self.fecha_emision and self.fecha_validez < self.fecha_emision:
            raise ValueError('La fecha de validez no puede ser anterior a la fecha de emisión.')
        if not self.estado:
            self.estado = 'Pendiente'
        super().save(*args, **kwargs)

    class Meta:
        managed = False
        db_table = 'cotizacion'


class Detallecompra(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_compra = models.ForeignKey(Compra, models.DO_NOTHING, db_column='id_compra')
    id_producto = models.ForeignKey('Producto', models.DO_NOTHING, db_column='id_producto')
    cantidad = models.IntegerField()
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'detallecompra'


class Detallecotizacion(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_cotizacion = models.ForeignKey(Cotizacion, models.DO_NOTHING, db_column='id_cotizacion')
    id_producto = models.ForeignKey('Producto', models.DO_NOTHING, db_column='id_producto', blank=True, null=True)
    tipo = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'detallecotizacion'


class Detalleordentrabajo(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_orden_trabajo = models.ForeignKey('Ordentrabajo', models.DO_NOTHING, db_column='id_orden_trabajo')
    id_producto = models.ForeignKey('Producto', models.DO_NOTHING, db_column='id_producto', blank=True, null=True)
    tipo = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    cantidad = models.IntegerField()
    provisto_por_cliente = models.BooleanField(blank=True, null=True)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'detalleordentrabajo'


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.SmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class Factura(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_nota_servicio = models.ForeignKey('Notaservicio', models.DO_NOTHING, db_column='id_nota_servicio')
    numero_autorizacion = models.CharField(max_length=100, blank=True, null=True)
    fecha_emision = models.DateField(blank=True, null=True)
    monto_servicio_facturado = models.DecimalField(max_digits=10, decimal_places=2)
    impuesto = models.DecimalField(max_digits=10, decimal_places=2)
    total_facturado = models.DecimalField(max_digits=10, decimal_places=2)
    nit_cliente = models.CharField(max_length=30)
    razon_social = models.CharField(max_length=150)
    metodo_pago = models.CharField(max_length=50, blank=True, null=True)
    comprobante_pago = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'factura'


class Motocicleta(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey(Cliente, models.DO_NOTHING, db_column='id_cliente')
    placa = models.CharField(unique=True, max_length=15)
    marca = models.CharField(max_length=50, blank=True, null=True)
    modelo = models.CharField(max_length=50, blank=True, null=True)
    anio = models.IntegerField(blank=True, null=True)
    cilindraje = models.CharField(max_length=20, blank=True, null=True)
    color = models.CharField(max_length=30, blank=True, null=True)
    numero_motor = models.CharField(max_length=100, blank=True, null=True)
    numero_chasis = models.CharField(max_length=100, blank=True, null=True)
    kilometraje_actual = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    estado = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'motocicleta'


class Notaservicio(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_orden_trabajo = models.ForeignKey('Ordentrabajo', models.DO_NOTHING, db_column='id_orden_trabajo')
    id_cliente = models.ForeignKey(Cliente, models.DO_NOTHING, db_column='id_cliente')
    fecha_emision = models.DateField(blank=True, null=True)
    total_repuestos = models.DecimalField(max_digits=10, decimal_places=2)
    total_mano_obra = models.DecimalField(max_digits=10, decimal_places=2)
    total_general = models.DecimalField(max_digits=10, decimal_places=2)
    observaciones = models.TextField(blank=True, null=True)
    estado_pago = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'notaservicio'


class Notatrabajo(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_orden_trabajo = models.ForeignKey('Ordentrabajo', models.DO_NOTHING, db_column='id_orden_trabajo')
    id_mecanico = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_mecanico')
    fecha_hora = models.DateTimeField(blank=True, null=True)
    contenido = models.TextField()
    tipo_nota = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'notatrabajo'


class Ordentrabajo(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_cotizacion = models.ForeignKey(Cotizacion, models.DO_NOTHING, db_column='id_cotizacion', blank=True, null=True)
    id_cliente = models.ForeignKey(Cliente, models.DO_NOTHING, db_column='id_cliente')
    id_motocicleta = models.ForeignKey(Motocicleta, models.DO_NOTHING, db_column='id_motocicleta')
    id_mecanico = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_mecanico', blank=True, null=True)
    fecha_creacion = models.DateField(blank=True, null=True)
    fecha_inicio = models.DateField(blank=True, null=True)
    fecha_fin = models.DateField(blank=True, null=True)
    kilometraje_ingreso = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    estado = models.CharField(max_length=30, blank=True, null=True)
    prioridad = models.CharField(max_length=20, blank=True, null=True)
    costo_mano_obra = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    costo_repuestos = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'ordentrabajo'


class Privilegio(models.Model):
    codigo = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'privilegio'


class Producto(models.Model):
    codigo = models.AutoField(primary_key=True)
    codigo_barras = models.CharField(max_length=50, blank=True, null=True)
    nombre = models.CharField(max_length=150)
    categoria = models.CharField(max_length=50, blank=True, null=True)
    marca = models.CharField(max_length=50, blank=True, null=True)
    modelo_compatible = models.TextField(blank=True, null=True)
    stock_actual = models.IntegerField(blank=True, null=True)
    stock_minimo = models.IntegerField(blank=True, null=True)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    ubicacion_almacen = models.CharField(max_length=50, blank=True, null=True)
    estado = models.CharField(max_length=20, blank=True, null=True)
    id_proveedor = models.ForeignKey('Proveedor', models.DO_NOTHING, db_column='id_proveedor', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'producto'


class Proveedor(models.Model):
    codigo = models.AutoField(primary_key=True)
    empresa = models.CharField(max_length=150)
    nit = models.CharField(max_length=30)
    contacto = models.CharField(max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'proveedor'


class Rol(models.Model):
    codigo = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'rol'


class RolPrivilegio(models.Model):
    id_rol = models.ForeignKey(Rol, models.DO_NOTHING, db_column='id_rol')
    id_privilegio = models.ForeignKey(Privilegio, models.DO_NOTHING, db_column='id_privilegio')

    class Meta:
        managed = False
        db_table = 'rol_privilegio'
        unique_together = (('id_rol', 'id_privilegio'),)


class Usuario(models.Model):
    codigo = models.AutoField(primary_key=True)
    id_rol = models.ForeignKey(Rol, models.DO_NOTHING, db_column='id_rol')
    nombre = models.CharField(max_length=150)
    email = models.CharField(unique=True, max_length=100)
    contrasena = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    estado = models.CharField(max_length=20, blank=True, null=True)
    fecha_registro = models.DateField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'usuario'


class PermisoModulo(models.Model):
    """Almacena los permisos (acciones) asignados a cada rol para módulos específicos"""
    id = models.AutoField(primary_key=True)
    id_rol = models.ForeignKey(Rol, models.DO_NOTHING, db_column='id_rol')
    codigo_cu = models.CharField(max_length=20)  # Ej: CU01, CU02, etc.
    nombre_modulo = models.CharField(max_length=255)  # Nombre del módulo
    accion = models.CharField(max_length=50)  # Mostrar, Buscar, Eliminar, Adicionar, etc.
    permitido = models.BooleanField(default=False)  # True si está permitido

    class Meta:
        managed = False
        db_table = 'permiso_modulo'
        unique_together = (('id_rol', 'codigo_cu', 'nombre_modulo', 'accion'),)
