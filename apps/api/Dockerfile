# ---- Build stage (monorepo pnpm) ----
FROM node:20-slim AS build
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

# Manifiestos primero (mejor cache de capas)
COPY pnpm-workspace.yaml package.json ./
COPY packages/contracts/package.json packages/contracts/
COPY prisma/package.json prisma/
COPY apps/api/package.json apps/api/
RUN pnpm install --no-frozen-lockfile

# Código y build
COPY . .
RUN pnpm --filter @nexus/contracts build \
 && pnpm --filter @nexus/prisma exec prisma generate \
 && pnpm --filter @nexus/api build

# ---- Runtime stage ----
FROM node:20-slim AS runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo ./
EXPOSE 3001
# El entrypoint aplica migraciones + RLS y luego arranca la API.
RUN chmod +x apps/api/docker-entrypoint.sh
ENTRYPOINT ["apps/api/docker-entrypoint.sh"]
