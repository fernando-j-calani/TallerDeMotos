#!/bin/bash
# Activar virtualenv de Oryx si existe
if [ -f "/antenv/bin/activate" ]; then
    source /antenv/bin/activate
fi

cd /home/site/wwwroot/backend

# Aplicar migraciones (|| true para que un fallo no impida arrancar gunicorn)
python manage.py migrate --noinput || echo "[startup] Advertencia: no se pudieron aplicar migraciones"

# Arrancar gunicorn
exec gunicorn config.wsgi:application --bind=0.0.0.0:8000 --timeout=600 --workers=2
