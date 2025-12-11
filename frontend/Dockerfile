FROM node:18-alpine AS base

# 1. Instalar dependencias de sistema (Vital para Alpine)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 2. Dependencias
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Inyectar URL en tiempo de build (si se pasa como ARG)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Desactivar telemetría
ENV NEXT_TELEMETRY_DISABLED=1

# Construir la app
RUN npm run build

# 4. Runner (Producción)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copiar la versión compilada (Standalone)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# COMANDO CORRECTO: Ejecutar el servidor de Node, NO npm run dev
CMD ["node", "server.js"]