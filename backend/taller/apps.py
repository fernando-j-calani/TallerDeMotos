from django.apps import AppConfig


class TallerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'taller'
    
    def ready(self):
        # Inicializar permisos cuando Django inicia
        try:
            from .views import ensure_permiso_modulo_table
            print("[STARTUP] Inicializando tabla de permisos...")
            ensure_permiso_modulo_table()
            print("[STARTUP] ✓ Tabla de permisos lista")
        except Exception as e:
            print(f"[STARTUP] ⚠ Error inicializando permisos: {e}")
