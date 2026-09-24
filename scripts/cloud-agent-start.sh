#!/usr/bin/env bash
# Cloud Agent per-boot startup (idempotent). Brings up the local Postgres
# cluster, ensures the dev role/database exist, syncs the Prisma schema, and
# seeds demo data. Returns once the database is ready.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Start the PostgreSQL cluster if it is not already accepting connections.
if ! pg_isready -h 127.0.0.1 -q 2>/dev/null; then
  sudo pg_ctlcluster 16 main start || true
fi

# Wait for readiness (up to ~30s).
for _ in $(seq 1 30); do
  pg_isready -h 127.0.0.1 -q 2>/dev/null && break
  sleep 1
done

# Ensure the dev role and database exist (idempotent).
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='sourcetool'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE ROLE sourcetool LOGIN PASSWORD 'sourcetool';"
fi
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='sourcetool'" | grep -q 1; then
  sudo -u postgres createdb -O sourcetool sourcetool
fi

# Load local dev env (DATABASE_URL etc.) for the Prisma CLI.
set -a
# shellcheck disable=SC1091
[ -f .env ] && . ./.env
set +a

# Sync schema + seed demo data (both idempotent).
pnpm --filter @sourcetool/db run db:push
pnpm --filter @sourcetool/db run db:seed || true

echo "cloud-agent-start: database ready"
