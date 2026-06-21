from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0015_producto_codigo_barras'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "CREATE TABLE IF NOT EXISTS ajusteinventario ("
                "codigo SERIAL PRIMARY KEY, "
                "id_producto INTEGER NOT NULL REFERENCES producto(codigo), "
                "id_usuario INTEGER NOT NULL REFERENCES usuario(codigo), "
                "cantidad INTEGER NOT NULL, "
                "motivo VARCHAR(255), "
                "fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                "stock_resultante INTEGER NOT NULL"
                ");"
            ),
            reverse_sql="DROP TABLE IF EXISTS ajusteinventario;",
        )
    ]
