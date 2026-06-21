from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0006_detallecotizacion_id_producto'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "DROP TRIGGER IF EXISTS trg_auditoria_bitacora_orden ON ordentrabajo;"
            ),
            reverse_sql=migrations.RunSQL.noop,
        )
    ]
