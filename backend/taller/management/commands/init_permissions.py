from django.core.management.base import BaseCommand
from django.db import transaction, connection
from taller.models import PermisoModulo, Rol
import unicodedata


class Command(BaseCommand):
    help = 'Inicializa los permisos de la tabla permiso_modulo'

    def normalizar_rol(self, nombre):
        """Normaliza nombre de rol para comparación case-insensitive"""
        if not nombre:
            return ""
        return nombre.lower().strip()

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Iniciando proceso de inicialización de permisos...'))
        
        # Obtener roles existentes en BD
        roles_bd = {self.normalizar_rol(r.nombre): r for r in Rol.objects.all()}
        self.stdout.write(f'\n📋 Roles encontrados en BD: {list(roles_bd.keys())}')
        
        # Crear tabla si no existe
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
                
                if not table_exists:
                    self.stdout.write(self.style.WARNING('Creando tabla permiso_modulo...'))
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
                    cursor.execute(
                        """
                        CREATE UNIQUE INDEX IF NOT EXISTS permiso_modulo_unique_idx
                        ON public.permiso_modulo (id_rol, codigo_cu, nombre_modulo, accion)
                        """
                    )
                    self.stdout.write(self.style.SUCCESS('✓ Tabla creada exitosamente'))
                else:
                    self.stdout.write(self.style.SUCCESS('✓ Tabla ya existe'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error creando tabla: {e}'))
            return
        
        # Inicializar permisos
        acciones_completas = ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar', 'Exportar']
        permisos_por_rol = {
            'Administrador': {
                'CU01': ['Mostrar'],
                'CU02': acciones_completas,
                'CU03': acciones_completas,
                'CU04': acciones_completas,
                'CU05': acciones_completas,
                'CU06': acciones_completas,
                'CU07': acciones_completas,
                'CU08': acciones_completas,
                'CU09': acciones_completas,
                'CU10': acciones_completas,
                'CU11': acciones_completas,
                'CU12': acciones_completas,
                'CU13': acciones_completas,
                'CU14': acciones_completas,
                'CU15': acciones_completas,
                'CU16': acciones_completas,
                'CU17': ['Mostrar', 'Editar'],
                'CU18': acciones_completas,
                'CU19': ['Mostrar', 'Buscar', 'Exportar'],
                'CU20': ['Mostrar', 'Buscar', 'Exportar'],
            },
            'Recepcionista': {
                'CU05': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
                'CU06': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
                'CU07': ['Mostrar', 'Buscar', 'Adicionar', 'Editar'],
                'CU08': ['Mostrar', 'Buscar', 'Adicionar', 'Editar'],
                'CU09': ['Mostrar', 'Buscar', 'Adicionar'],
                'CU10': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
                'CU11': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
                'CU12': ['Mostrar', 'Buscar', 'Adicionar'],
                'CU13': ['Mostrar', 'Buscar', 'Adicionar', 'Editar', 'Eliminar'],
                'CU14': ['Mostrar', 'Buscar', 'Adicionar'],
                'CU15': ['Mostrar', 'Buscar', 'Exportar'],
                'CU16': ['Mostrar', 'Buscar', 'Adicionar'],
                'CU18': ['Mostrar', 'Buscar'],
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
        
        # IMPORTANTE: deben coincidir EXACTAMENTE con PERMISOS_DATA en
        # frontend/src/AsignarPrivilegios.js, para no crear filas duplicadas
        # con un nombre distinto al que usa la UI de asignar privilegios.
        nombres_modulos = {
            'CU01': 'Gestionar Inicio y Cierre de Sesión',
            'CU02': 'Gestionar Usuarios y Asignar Roles',
            'CU03': 'Gestionar Roles y Asignar Permisos',
            'CU04': 'Gestionar Permisos',
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
            'CU17': 'Configuración de Perfil Personal',
            'CU18': 'Generar Reportes',
            'CU19': 'Visualizar Dashboard Analítico',
            'CU20': 'Auditoría de Operaciones – Bitácora',
        }
        
        try:
            with transaction.atomic():
                contador_creados = 0
                contador_actualizados = 0
                
                for nombre_rol, permisos_cu in permisos_por_rol.items():
                    # Buscar rol de forma case-insensitive
                    rol_normalizado = self.normalizar_rol(nombre_rol)
                    
                    if rol_normalizado not in roles_bd:
                        self.stdout.write(self.style.WARNING(f'⚠ Rol "{nombre_rol}" no encontrado. Intentando búsqueda flexible...'))
                        # Intentar buscar por similitud
                        rol = None
                        for bd_rol_norm, bd_rol_obj in roles_bd.items():
                            if nombre_rol.lower() in bd_rol_norm or bd_rol_norm in nombre_rol.lower():
                                rol = bd_rol_obj
                                self.stdout.write(self.style.WARNING(f'  → Encontrado rol similar: "{bd_rol_obj.nombre}"'))
                                break
                        
                        if not rol:
                            self.stdout.write(self.style.WARNING(f'  → Saltando rol "{nombre_rol}"'))
                            continue
                    else:
                        rol = roles_bd[rol_normalizado]
                    
                    for codigo_cu, acciones in permisos_cu.items():
                        nombre_modulo = nombres_modulos.get(codigo_cu, codigo_cu)
                        
                        for accion in acciones:
                            perm, creado = PermisoModulo.objects.get_or_create(
                                id_rol=rol,
                                codigo_cu=codigo_cu,
                                nombre_modulo=nombre_modulo,
                                accion=accion,
                                defaults={'permitido': True}
                            )
                            
                            if creado:
                                contador_creados += 1
                                self.stdout.write(f'  ✓ {rol.nombre} → {codigo_cu} ({accion})')
                            else:
                                # Actualizar a permitido=True si estaba en False
                                if not perm.permitido:
                                    perm.permitido = True
                                    perm.save()
                                    contador_actualizados += 1
                
                self.stdout.write(self.style.SUCCESS(f'\n✓ Permisos creados: {contador_creados}'))
                self.stdout.write(self.style.SUCCESS(f'✓ Permisos actualizados: {contador_actualizados}'))
                self.stdout.write(self.style.SUCCESS('✓ ¡Inicialización completada exitosamente!'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error durante inicialización: {e}'))
            import traceback
            traceback.print_exc()
