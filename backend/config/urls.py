from django.contrib import admin
from django.urls import path
from taller.views import (
    login_api,
    bitacora_api,
    usuarios_api,
    usuario_detalle_api,
    roles_api,
    rol_detalle_api,
    privilegios_api,
    privilegio_detalle_api,
    roles_privilegios_api,
    clientes_api,
    cliente_detalle_api,
    motocicletas_api,
    motocicleta_detalle_api,
    mis_motocicletas_api,
    perfil_api,
    force_change_password_api,
    forgot_password_request_api,
    reset_password_confirm_api,
    aceptar_cotizacion_api,
    logout_api,
    ProveedorViewSet,
    ProductoViewSet,
    CompraViewSet,
)

proveedores_api = ProveedorViewSet.as_view({
    'get': 'list',
    'post': 'create',
})
proveedor_detalle_api = ProveedorViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

productos_api = ProductoViewSet.as_view({
    'get': 'list',
    'post': 'create',
})
producto_detalle_api = ProductoViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

compras_api = CompraViewSet.as_view({
    'get': 'list',
    'post': 'create',
})

compra_detalle_api = CompraViewSet.as_view({
    'get': 'retrieve',
    'delete': 'destroy',
})

urlpatterns = [
    path('admin/', admin.site.urls),
    # Ruta para el CU01
    path('api/login/', login_api, name='api_login'),
    path('api/password/forgot/', forgot_password_request_api, name='api_password_forgot'),
    path('api/password/reset/', reset_password_confirm_api, name='api_password_reset'),
    path('api/password/force-change/', force_change_password_api, name='api_password_force_change'),
    path('api/logout/', logout_api, name='api_logout'),
    # Ruta para el CU20
    path('api/bitacora/', bitacora_api, name='api_bitacora'),
    # NUEVAS RUTAS FASE B:
    path('api/usuarios/', usuarios_api, name='api_usuarios'),
    path('api/usuarios/<int:usuario_id>/', usuario_detalle_api, name='api_usuario_detalle'),
    path('api/roles/', roles_api, name='api_roles'),
    path('api/roles/<int:rol_id>/', rol_detalle_api, name='api_rol_detalle'),
    path('api/privilegios/', privilegios_api, name='api_privilegios'),
    path('api/privilegios/<int:privilegio_id>/', privilegio_detalle_api, name='api_privilegio_detalle'),
    path('api/roles-privilegios/', roles_privilegios_api, name='api_roles_privilegios'),
    path('api/clientes/', clientes_api, name='api_clientes'),
    path('api/clientes/<int:cliente_id>/', cliente_detalle_api, name='api_cliente_detalle'),
    path('api/motocicletas/', motocicletas_api, name='api_motocicletas'),
    path('api/motocicletas/<int:motocicleta_id>/', motocicleta_detalle_api, name='api_motocicleta_detalle'),
    path('api/mis-motocicletas/', mis_motocicletas_api, name='api_mis_motocicletas'),
    path('api/proveedores/', proveedores_api, name='api_proveedores'),
    path('api/proveedores/<int:pk>/', proveedor_detalle_api, name='api_proveedor_detalle'),
    path('api/productos/', productos_api, name='api_productos'),
    path('api/productos/<int:pk>/', producto_detalle_api, name='api_producto_detalle'),
    path('api/compras/', compras_api, name='api_compras'),
    path('api/compras/<int:pk>/', compra_detalle_api, name='api_compra_detalle'),
    path('api/perfil/', perfil_api, name='api_perfil'),
    path('api/cotizaciones/<int:cotizacion_id>/aceptar/', aceptar_cotizacion_api, name='api_cotizacion_aceptar'),
]