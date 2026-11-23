# syntax=docker/dockerfile:1
# Frontend de Acciones UD: compila la app con Vite y la sirve con Nginx.
# Nginx también reenvía /api/v1 y el WebSocket de cotizaciones al gateway, así el navegador usa un solo origen.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
# Variables de compilación opcionales (ver README). Por defecto la app llama a /api/v1 en el mismo dominio.
ARG VITE_API_BASE_URL=
ARG VITE_QUOTES_WS_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_QUOTES_WS_URL=$VITE_QUOTES_WS_URL
RUN npm run build

# Imagen oficial de Nginx sin root (usuario nginx, puerto 8080).
FROM nginxinc/nginx-unprivileged:1.27-alpine
# Dirección del gateway dentro de la red de Docker. Se reemplaza en el arranque (envsubst de la imagen oficial).
ENV GATEWAY_URL=http://gateway:8080
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
