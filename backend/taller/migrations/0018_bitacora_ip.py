from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0017_usuario_sesion_actual'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS ip VARCHAR(45);",
            reverse_sql="ALTER TABLE bitacora DROP COLUMN IF EXISTS ip;",
        )
    ]
