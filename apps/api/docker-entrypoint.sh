#!/bin/sh
set -e

echo "▶ Aplicando migraciones (prisma migrate deploy)..."
pnpm --filter @nexus/prisma exec prisma migrate deploy

echo "▶ Aplicando políticas RLS..."
node prisma/scripts/apply-rls.mjs

if [ "${SEED_ON_START}" = "true" ]; then
  echo "▶ Ejecutando seed..."
  pnpm --filter @nexus/prisma exec tsx prisma/seed.ts || true
fi

echo "🚀 Iniciando API..."
exec node apps/api/dist/main.js
