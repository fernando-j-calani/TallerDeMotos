from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0009_notatrabajo_fecha_hora_con_tz'),
    ]

    operations = [
        migrations.RunSQL(
            sql="UPDATE ordentrabajo SET estado = 'En Progreso' WHERE estado = 'Pendiente';",
            reverse_sql="UPDATE ordentrabajo SET estado = 'Pendiente' WHERE estado = 'En Progreso';",
        )
    ]
