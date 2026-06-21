from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0010_renombrar_estado_pendiente_orden'),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP TRIGGER IF EXISTS trg_generar_factura_legal ON notaservicio;",
            reverse_sql=migrations.RunSQL.noop,
        )
    ]
