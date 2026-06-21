from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0005_factura_metodo_pago_comprobante'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE detallecotizacion ADD COLUMN IF NOT EXISTS id_producto INTEGER NULL "
                "REFERENCES producto(codigo);"
            ),
            reverse_sql=(
                "ALTER TABLE detallecotizacion DROP COLUMN IF EXISTS id_producto;"
            ),
        )
    ]
