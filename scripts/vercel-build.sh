#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pnpm --filter @sourcetool/db run db:generate

if [ "${PRISMA_MIGRATE_ON_BUILD:-}" = "1" ]; then
  echo "PRISMA_MIGRATE_ON_BUILD=1 — running prisma migrate deploy"
  pnpm --filter @sourcetool/db run db:migrate:deploy
fi

pnpm --filter @sourcetool/shared run build
pnpm --filter @sourcetool/ai run build
pnpm --filter @sourcetool/ui run build
pnpm --filter @sourcetool/web run build
