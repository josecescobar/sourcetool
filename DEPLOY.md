# SourceTool — Vercel Deployment Guide

The dashboard and API both live in `apps/web` (Next.js App Router). There is no
separate NestJS/Railway/Docker service.

| Piece | Where it runs |
|-------|----------------|
| Web + API | Vercel (`apps/web`, routes under `/api/*`) |
| Postgres | Neon (preferred with Prisma) or Supabase pooler |
| Watch checker | Vercel Cron → `GET /api/cron/check-watches` every 6 hours |

## 1. Database

Use a managed serverless Postgres. Neon is the best fit for this Prisma schema;
Supabase Postgres also works via its connection pooler.

1. Create a project (Neon dashboard, or reuse an existing Supabase Postgres).
2. Copy the **pooled** connection string into `DATABASE_URL`.
   - Neon: the URL whose host contains `-pooler`.
   - Supabase: the transaction pooler URL (port 6543).
   - Append `?pgbouncer=true&connection_limit=1` if those flags are not already present.
3. Copy the **direct / unpooled** connection string into `DIRECT_DATABASE_URL`
   (used only by `prisma migrate deploy`).
4. Apply schema:

```bash
pnpm --filter @sourcetool/db run db:generate
DATABASE_URL="$DIRECT_DATABASE_URL" pnpm --filter @sourcetool/db exec prisma migrate deploy
```

When `DATABASE_URL` points at Neon, the Prisma client uses `@prisma/adapter-neon`
automatically. Other hosts use the standard Prisma driver against the pooled URL.

## 2. Vercel project

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `apps/web` (include files outside the root directory).
   Framework: Next.js. Install: `pnpm install` from the repo root is handled by
   the root `vercel.json` if you deploy from `/` instead.
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

4. Run `prisma migrate deploy` once against `DIRECT_DATABASE_URL` (local CLI or a
   Vercel build command extra step). After that, deploys only need `prisma generate`
   (already part of `@sourcetool/db` `build`).

## 3. Cron

`apps/web/vercel.json` registers:

```
0 */6 * * *  →  GET /api/cron/check-watches
```

Vercel sends `Authorization: Bearer $CRON_SECRET`. The route rejects any other caller.

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
# Set DATABASE_URL + DIRECT_DATABASE_URL to your Neon/Supabase branch
# (or a local Postgres URL — both vars can be the same locally)
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
