#!/usr/bin/env bash
# Cloud Agent environment bootstrap (idempotent). Prepares system packages,
# Node dependencies, workspace library builds, and a local dev .env so the
# Next.js app + Prisma CLI can run against a local Postgres.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# 1. System dependency: PostgreSQL (local dev database). Install only if missing.
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
fi

# 2. Node toolchain + workspace dependencies.
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

# 3. Build workspace library packages so the dev server can resolve their
#    dist/ entry points, and generate the Prisma client.
pnpm --filter @sourcetool/shared --filter @sourcetool/ai \
     --filter @sourcetool/db --filter @sourcetool/ui run build

# 4. Local dev environment file (gitignored). Local Postgres uses the native
#    Prisma client (non-Neon host), so DATABASE_URL and DIRECT_DATABASE_URL match.
if [ ! -f .env ]; then
  JWT_SECRET_VALUE="$(openssl rand -hex 32 2>/dev/null || echo local-dev-jwt-secret)"
  JWT_REFRESH_VALUE="$(openssl rand -hex 32 2>/dev/null || echo local-dev-refresh-secret)"
  cat > .env <<EOF
# Local development env for Cloud Agent (local Postgres -> native Prisma client).
DATABASE_URL="postgresql://sourcetool:sourcetool@127.0.0.1:5432/sourcetool?schema=public"
DIRECT_DATABASE_URL="postgresql://sourcetool:sourcetool@127.0.0.1:5432/sourcetool?schema=public"

JWT_SECRET="${JWT_SECRET_VALUE}"
JWT_REFRESH_SECRET="${JWT_REFRESH_VALUE}"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

NEXT_PUBLIC_API_URL="/api"
WEB_URL="http://localhost:3000"
NODE_ENV="development"
EOF
fi

# Next.js loads env from the app directory; keep a copy in sync.
cp -f .env apps/web/.env

echo "cloud-agent-install: done"
