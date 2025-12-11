#!/bin/sh
# entrypoint.sh

# Salir inmediatamente si un comando falla
set -e

echo "Iniciando CRAC Backend..."

# 1. Ejecutar migraciones de Alembic (Crear tablas)
echo "Ejecutando migraciones de base de datos..."
# python -m alembic upgrade head  <-- Descomentar cuando tengamos la primera migración lista

# 2. Iniciar servidor FastAPI
echo "Iniciando servidor FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload