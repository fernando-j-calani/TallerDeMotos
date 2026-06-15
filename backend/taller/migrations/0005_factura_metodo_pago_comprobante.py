from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0004_alter_cliente_options_alter_ordentrabajo_options'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE factura ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50);"
                "ALTER TABLE factura ADD COLUMN IF NOT EXISTS comprobante_pago VARCHAR(255);"
            ),
            reverse_sql=(
                "ALTER TABLE factura DROP COLUMN IF EXISTS metodo_pago;"
                "ALTER TABLE factura DROP COLUMN IF EXISTS comprobante_pago;"
            ),
        )
    ]
