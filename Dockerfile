# syntax=docker/dockerfile:1
#
# Imagen de la web Nuxt (deploys, plan 06, D12).
#
#   docker build -t ktsu-web .
#
# Tres etapas: dependencias → compilación → ejecución. La imagen final solo
# lleva `.output/`, que Nitro deja completo (servidor, assets y sus módulos).
#
# La URL de la API y el proyecto de Descope NO se fijan aquí: se pasan al
# arrancar con `NUXT_PUBLIC_*`. Así la misma imagen sirve para cada entorno.

# Base fijada por versión y digest (deploys, fuentes 07, F5). Es el Node de
# `devEngines` en el package.json.
ARG NODE_IMAGE=node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df


# --- Base común: Node y el pnpm que fija `packageManager` -------------------
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
# Sin esto, corepack pregunta antes de descargar pnpm y el build se queda parado.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app


# --- Dependencias ------------------------------------------------------------
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# `postinstall` ejecuta `nuxt prepare`, que lee la configuración de Nuxt.
COPY nuxt.config.ts tsconfig.json eslint.config.mjs ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile


# --- Compilación: Nitro con el preset de servidor Node -----------------------
FROM dependencies AS build
COPY app ./app
COPY public ./public
RUN pnpm build


# --- Ejecución ---------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
# Nitro lee `HOST` y `PORT`. En el contenedor, todas las interfaces.
ENV HOST=0.0.0.0
ENV PORT=3000
WORKDIR /app
COPY --from=build /app/.output ./.output
USER node
EXPOSE 3000
# Forma exec: Node es el proceso 1 y recibe el SIGTERM del orquestador.
CMD ["node", ".output/server/index.mjs"]
