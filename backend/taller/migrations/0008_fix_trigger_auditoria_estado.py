from django.db import migrations

SQL_NUEVO = """
CREATE OR REPLACE FUNCTION tf_auditoria_estado_orden() RETURNS trigger AS $$
BEGIN
    IF NEW.estado != OLD.estado THEN
        INSERT INTO NotaTrabajo (id_orden_trabajo, id_mecanico, contenido, tipo_nota, fecha_hora)
        VALUES (
            NEW.codigo,
            COALESCE(NEW.id_mecanico, current_setting('app.usuario_accion', true)::integer, 1),
            'Cambio de estado automático de ' || OLD.estado || ' a ' || NEW.estado,
            'Sistema',
            (now() - interval '4 hours')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""

SQL_VIEJO = """
CREATE OR REPLACE FUNCTION tf_auditoria_estado_orden() RETURNS trigger AS $$
BEGIN
    IF NEW.estado != OLD.estado THEN
        INSERT INTO NotaTrabajo (id_orden_trabajo, id_mecanico, contenido, tipo_nota)
        VALUES (NEW.codigo, COALESCE(NEW.id_mecanico, 1), 'Cambio de estado autom??tico de ' || OLD.estado || ' a ' || NEW.estado, 'Sistema');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0007_drop_trigger_bitacora_orden'),
    ]

    operations = [
        migrations.RunSQL(sql=SQL_NUEVO, reverse_sql=SQL_VIEJO),
    ]
