from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE taller_cliente ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'Activo';"
                "UPDATE taller_cliente SET estado = 'Activo' WHERE estado IS NULL;"
                "ALTER TABLE taller_motocicleta ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'Activo';"
                "UPDATE taller_motocicleta SET estado = 'Activo' WHERE estado IS NULL;"
            ),
            reverse_sql=(
                "ALTER TABLE taller_cliente DROP COLUMN IF EXISTS estado;"
                "ALTER TABLE taller_motocicleta DROP COLUMN IF EXISTS estado;"
            ),
        )
    ]
