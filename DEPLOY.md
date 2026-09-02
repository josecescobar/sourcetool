# SourceTool — Vercel Deployment Guide

The dashboard and API both live in `apps/web` (Next.js App Router). There is no
separate NestJS/Railway/Docker service.

| Piece | Where it runs |
|-------|----------------|
| Web + API | Vercel (`apps/web`, routes under `/api/*`) |
| Postgres | Neon (Prisma + `@prisma/adapter-neon`) |
| Watch checker | Vercel Cron → `GET /api/cron/check-watches` every 6 hours |

## 1. Database (Neon)

SourceTool uses **Neon** Postgres. There is no existing Neon project in this
GitHub account (simplywise is on Supabase; real-elite is on Turso). Create one.

Production project (Jose org, created 2026-09-02):

- Name: `sourcetool`
- ID: `dry-leaf-39634333`
- Region: `aws-us-east-1`
- Postgres 16, database `sourcetool`
- Console: https://console.neon.tech/app/projects/dry-leaf-39634333

Connection strings are in `.env.neon` on the machine that provisioned it (gitignored).
Paste `DATABASE_URL` (pooled / `-pooler`) and `DIRECT_DATABASE_URL` into Vercel.

### Option A — Neon Console (2 minutes)

1. Open [console.neon.tech](https://console.neon.tech) and create a project:
   - Name: `sourcetool`
   - Postgres 16
   - Region close to your Vercel project (e.g. `aws-us-east-1`)
   - Database: `sourcetool`
2. In **Connect**, copy the **pooled** string (host contains `-pooler`) into
   Vercel `DATABASE_URL`. Append `?sslmode=require` if it is not there.
   The Prisma flag `--prisma` / `pgbouncer=true` is optional; Neon’s pooler
   already multiplexes.
3. Copy the **direct** string into `DIRECT_DATABASE_URL`.
4. Apply schema: `pnpm --filter @sourcetool/db run db:migrate:deploy`

### Option B — API key (this repo’s script)

Create a personal key at
[console.neon.tech/app/settings/api-keys](https://console.neon.tech/app/settings/api-keys)
then:

```bash
NEON_API_KEY=napi_... pnpm db:neon:provision
```

That reuses a project named `sourcetool` if it exists, otherwise creates one,
writes `.env.neon` (gitignored), and runs `prisma migrate deploy`.

### Neon ↔ Vercel integration

If you add Neon from the Vercel Storage tab, it injects `DATABASE_URL` and
`DATABASE_URL_UNPOOLED`. You do **not** have to rename them — `packages/db`
maps those onto Prisma’s `DIRECT_DATABASE_URL` before generate/migrate.

When `DATABASE_URL` is a `*.neon.tech` host, the Prisma client uses
`@prisma/adapter-neon` (WebSocket via `ws`) so each serverless invocation does
not open a standing TCP pool.

## 2. Vercel project

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `apps/web` and leave **Include source files outside
   the Root Directory** enabled (the pnpm workspace lives at the repo root).
   Framework: Next.js. The repo-root `vercel.json` sets `rootDirectory` so a CLI
   deploy of the whole repo is treated as Next.js (not a static `public/` site).
   `apps/web/vercel.json` runs `pnpm install` / Prisma generate / `next build`
   from the workspace root and registers the 6-hour cron.
3. Environment variables (Production + Preview):

```
DATABASE_URL=
DIRECT_DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CRON_SECRET=
WEB_URL=https://app.sourcetool.io
NEXT_PUBLIC_API_URL=/api
RESEND_API_KEY=
EMAIL_FROM=SourceTool <noreply@sourcetool.io>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RAINFOREST_API_KEY=
KEEPA_API_KEY=
ANTHROPIC_API_KEY=
AI_GATEWAY_API_KEY=
```

`CRON_SECRET` is injected by Vercel for Cron Jobs; you can also set it yourself.
Do **not** set `NEXT_PUBLIC_API_URL` to a separate API host — routes are same-origin.

4. Apply schema once with `pnpm --filter @sourcetool/db run db:migrate:deploy`,
   or set `PRISMA_MIGRATE_ON_BUILD=1` on Vercel so `scripts/vercel-build.sh`
   runs migrate deploy on every production build. After the first migrate,
   later deploys only need `prisma generate` (already in the build).

## 3. Cron

`apps/web/vercel.json` registers:

```
0 */6 * * *  →  GET /api/cron/check-watches
```

Vercel sends `Authorization: Bearer $CRON_SECRET`. The route rejects any other caller.

Large watch lists and bulk scans run in **40-lookup batches**. Each batch hops to a
new invocation (`/api/cron/check-watches?offset=` or `POST /api/cron/process-bulk-scan`)
so work is not killed at the 300s `maxDuration`. That hop needs `CRON_SECRET` and
`WEB_URL` (or `VERCEL_URL`) set on the project.

Hobby plans only allow daily crons; the 6-hour schedule needs Pro.

## 4. Stripe webhook

Endpoint: `https://<your-domain>/api/billing/webhook`

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## 5. Chrome extension

Point the extension API URL at the Vercel deployment:

```
https://app.sourcetool.io/api
```

Auth is still Bearer JWT in `Authorization` (service workers cannot use cookie sessions).

## 6. Local development

```bash
cp .env.example .env
# Set DATABASE_URL + DIRECT_DATABASE_URL to your Neon branch
# (or a local Postgres URL — both vars can be the same locally).
# After `pnpm db:neon:provision`, you can `set -a && source .env.neon && set +a`.
pnpm install
pnpm db:generate
pnpm db:push
pnpm --filter @sourcetool/web dev
```

App: http://localhost:3000  
API: http://localhost:3000/api  
Health: http://localhost:3000/api/health

The Chrome extension default API URL is `http://localhost:3000/api`.

## Troubleshooting

**Too many database connections:** `DATABASE_URL` must be the pooled URL with
`connection_limit=1`. On Neon, confirm the host includes `-pooler`.

**Prisma migrate fails:** migrate needs `DIRECT_DATABASE_URL` (unpooled). Pooled
URLs cannot run some DDL.

**CORS errors from the extension:** `WEB_URL` must match the dashboard origin;
chrome-extension:// origins are allowed by middleware.

**Cron 401:** `CRON_SECRET` is missing, or the request lacked `Authorization: Bearer …`.

**Stripe webhook 400:** raw body is required; the route reads `arrayBuffer()` before
JSON parsing. Confirm `STRIPE_WEBHOOK_SECRET` matches this endpoint.
