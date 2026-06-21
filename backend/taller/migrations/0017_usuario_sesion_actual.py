from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0016_ajuste_inventario'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE usuario ADD COLUMN IF NOT EXISTS sesion_actual VARCHAR(64);",
            reverse_sql="ALTER TABLE usuario DROP COLUMN IF EXISTS sesion_actual;",
        )
    ]
