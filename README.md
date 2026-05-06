# Taller de Motos (SI1)

Proyecto con **Django + React + PostgreSQL** levantado con **Docker Compose**.

## Requisitos

- Git
- Docker (Engine) y Docker Compose v2

## Clonar y configurar

```bash
git clone https://github.com/AleDevCV/TallerDeMotos_SI1.git
cd TallerDeMotos_SI1
```

1. Crea tu archivo de entorno local:

```bash
cp .env.example .env
```

2. Edita `.env` y ajusta los valores necesarios:

- `DJANGO_SECRET_KEY`
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` (deben coincidir con `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`)
- `DB_HOST` debe ser `db` (nombre del servicio en `docker-compose.yml`)
- Opcional: variables de correo (`MAIL_*`) según tu entorno

## Levantar el proyecto con Docker

```bash
docker compose up --build
```

> Si quieres liberar la terminal, usa `-d` y luego `docker compose logs -f` para ver los logs.

## Migraciones (primera vez)

```bash
docker compose exec backend python manage.py migrate
```

Opcional (crear usuario admin):

```bash
docker compose exec backend python manage.py createsuperuser
```

## Datos de ejemplo (opcional)

Hay scripts en `BaseDeDatos/`. Para cargarlos en PostgreSQL:

```bash
docker compose exec -T db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < BaseDeDatos/ScriptBaseSi1_motos.pgsql
```

> Si no tienes estas variables exportadas, reemplaza `${POSTGRES_USER}` y `${POSTGRES_DB}` por los valores de tu `.env`.

Ejemplo (valores por defecto de `.env.example`):

```bash
docker compose exec -T db psql -U usuario_taller -d db_taller_motos < BaseDeDatos/ScriptBaseSi1_motos.pgsql
```

## URLs útiles

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Mailpit: http://localhost:8025

## Actualizar una instalación existente

```bash
git pull
docker compose up --build
```

Si necesitas reiniciar la base de datos:

```bash
docker compose down -v
```

## Apagar servicios

```bash
docker compose down
```
