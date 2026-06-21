from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0012_producto_id_proveedor'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE compra ADD COLUMN IF NOT EXISTS comprobante_pago VARCHAR(255);"
            ),
            reverse_sql=(
                "ALTER TABLE compra DROP COLUMN IF EXISTS comprobante_pago;"
            ),
        )
    ]
