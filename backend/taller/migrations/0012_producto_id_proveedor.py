from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0011_drop_trigger_factura_legal'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE producto ADD COLUMN IF NOT EXISTS id_proveedor INTEGER "
                "REFERENCES proveedor(codigo);"
            ),
            reverse_sql=(
                "ALTER TABLE producto DROP COLUMN IF EXISTS id_proveedor;"
            ),
        )
    ]
