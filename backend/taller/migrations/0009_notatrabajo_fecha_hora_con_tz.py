from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0008_fix_trigger_auditoria_estado'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE notatrabajo ALTER COLUMN fecha_hora TYPE timestamptz "
                "USING fecha_hora AT TIME ZONE 'UTC';"
            ),
            reverse_sql=(
                "ALTER TABLE notatrabajo ALTER COLUMN fecha_hora TYPE timestamp "
                "USING fecha_hora AT TIME ZONE 'UTC';"
            ),
        )
    ]
