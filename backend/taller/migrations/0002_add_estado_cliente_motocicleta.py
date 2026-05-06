from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE cliente ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'Activo';"
                "UPDATE cliente SET estado = 'Activo' WHERE estado IS NULL;"
                "ALTER TABLE motocicleta ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'Activo';"
                "UPDATE motocicleta SET estado = 'Activo' WHERE estado IS NULL;"
            ),
            reverse_sql=(
                "ALTER TABLE cliente DROP COLUMN IF EXISTS estado;"
                "ALTER TABLE motocicleta DROP COLUMN IF EXISTS estado;"
            ),
        )
    ]
