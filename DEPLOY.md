# SourceTool — Railway Deployment Guide

## Services Overview

| Service    | Type       | Source                  |
|------------|------------|-------------------------|
| PostgreSQL | Managed DB | Railway add-on          |
| Redis      | Managed    | Railway add-on          |
| API        | Docker     | `apps/api/Dockerfile`   |
| Web        | Docker     | `apps/web/Dockerfile`   |

## Step 1: Create Railway Project

1. Create a new project in [Railway](https://railway.app)
2. Add a **PostgreSQL** service (Railway managed)
3. Add a **Redis** service (Railway managed)
4. Add a **New Service** → connect your GitHub repo → name it **API**
   - Set root directory: `/` (repo root, Dockerfile path relative to root)
   - Set Dockerfile path: `apps/api/Dockerfile`
5. Add another **New Service** → same GitHub repo → name it **Web**
   - Set root directory: `/`
   - Set Dockerfile path: `apps/web/Dockerfile`

## Step 2: Environment Variables

### API Service

```
DATABASE_URL=            # Railway provides via PostgreSQL service reference
REDIS_URL=               # Railway provides via Redis service reference
JWT_SECRET=              # Generate: openssl rand -base64 32
JWT_REFRESH_SECRET=      # Generate: openssl rand -base64 32
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
RAINFOREST_API_KEY=      # From existing .env
KEEPA_API_KEY=           # From existing .env
STRIPE_SECRET_KEY=       # Stripe live key
STRIPE_WEBHOOK_SECRET=   # From Stripe dashboard (set up in Step 5)
RESEND_API_KEY=          # For email verification
EMAIL_FROM=SourceTool <noreply@sourcetool.io>
WEB_URL=https://app.sourcetool.io
NODE_ENV=production
```

> `PORT` is set automatically by Railway — do not set it manually.

### Web Service

```
NEXT_PUBLIC_API_URL=https://api.sourcetool.io/api
NODE_ENV=production
```

> `NEXT_PUBLIC_API_URL` must be set before the build since Next.js inlines `NEXT_PUBLIC_*` vars at build time. Set it in Railway's build variables or as a Docker build arg.

## Step 3: Configure Health Check

In Railway's API service settings:
- Health check path: `/api/health`
- Health check timeout: 30s

## Step 4: First Deploy

1. Push to GitHub — Railway auto-deploys
2. The API Dockerfile runs `prisma migrate deploy` on startup, applying all migrations
3. Verify the API is running: `curl https://api.sourcetool.io/api/health`
4. Verify the web app loads at `https://app.sourcetool.io`

## Step 5: Set Up Stripe Production Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://api.sourcetool.io/api/billing/webhook`
3. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the webhook signing secret → set as `STRIPE_WEBHOOK_SECRET` in Railway API service

## Step 6: Custom Domains (Optional)

1. In Railway, go to each service's **Settings → Networking → Custom Domain**
2. Add your domains:
   - API: `api.sourcetool.io`
   - Web: `app.sourcetool.io`
3. Add the CNAME records in your DNS provider as Railway instructs
4. Update `WEB_URL` and `NEXT_PUBLIC_API_URL` env vars to match

## Step 7: Post-Deploy Testing

- [ ] Sign up with email + password
- [ ] Verify email (check email delivery via Resend)
- [ ] Log in
- [ ] Product lookup (ASIN search)
- [ ] Bulk scan upload
- [ ] Profit calculator
- [ ] Add to buy list
- [ ] Stripe checkout → subscription activation
- [ ] Webhook fires on subscription events
- [ ] Chrome extension connects to production API

## Troubleshooting

**API won't start**: Check `DATABASE_URL` is correct. Railway provides it via service reference — use `${{Postgres.DATABASE_URL}}` syntax.

**Prisma migration fails**: Ensure the `packages/db/prisma/migrations` directory is committed and not in `.dockerignore`.

**CORS errors**: Verify `WEB_URL` matches the exact origin of your web app (including `https://`).

**Stripe webhooks fail**: Ensure `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint's signing secret, and that raw body parsing is enabled (it is — `rawBody: true` in `main.ts`).

**Next.js API calls fail**: `NEXT_PUBLIC_API_URL` must be set at build time. If changed, trigger a rebuild in Railway.
