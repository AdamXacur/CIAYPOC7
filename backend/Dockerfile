# Backend Dockerfile (Fixed for Windows)
FROM python:3.10-slim-bookworm AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Builder Stage
FROM base AS builder
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Final Stage
FROM base
WORKDIR /app

# Copiar librerías instaladas
COPY --from=builder /usr/local/lib/python3.10/site-packages/ /usr/local/lib/python3.10/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Copiar código fuente
COPY . .

# Crear usuario no-root
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN chown -R appuser:appgroup /app

# --- FIX CRÍTICO PARA WINDOWS ---
# Elimina los caracteres de retorno de carro (\r) que Windows agrega
RUN sed -i 's/\r$//' /app/entrypoint.sh
# Hacerlo ejecutable
RUN chmod +x /app/entrypoint.sh
# --------------------------------

USER appuser

EXPOSE 8000
CMD ["/app/entrypoint.sh"]