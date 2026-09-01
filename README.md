# SourceTool

An AI-native Amazon FBA arbitrage platform for product sourcing, profit analysis, and deal evaluation. Built to replace SellerAmp SAS with a modern stack, multi-source data, and AI-powered decision-making.

**Status:** 9 core features built + Chrome extension shipped

---

## What It Does

SourceTool helps Amazon FBA sellers find profitable products to resell. Look up any product by ASIN, UPC, or EAN, and get instant profit calculations with FBA fee estimates, BSR tracking, and competitive analysis — powered by a three-provider data chain that cross-references Rainforest API, Keepa, and Amazon SP-API.

**Core workflow:** Find product → Analyze profitability → Add to buy list → Track from purchase through sale → Measure actual ROI.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS 11, Prisma ORM, PostgreSQL, Redis, @nestjs/schedule |
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui, Recharts |
| **Extension** | Chrome Manifest V3, React 19, Webpack 5, Tailwind CSS |
| **AI** | Anthropic Claude, OpenAI |
| **Product Data** | Rainforest API, Keepa API, Amazon SP-API |
| **Auth** | JWT + Google OAuth, Resend (transactional email) |
| **Payments** | Stripe |
| **Monorepo** | Turborepo, pnpm workspaces |
| **Infra** | Docker Compose (Postgres + Redis), Railway, Vercel |

---

## Monorepo Structure

```
sourcetool/
├── apps/
│   ├── api/          # NestJS backend — 15 modules
│   ├── web/          # Next.js dashboard
│   └── extension/    # Chrome extension MV3 with side panel
├── packages/
│   ├── db/           # Prisma schema (22 models), client singleton
│   ├── shared/       # Shared TypeScript types, validators, constants
│   ├── ui/           # shadcn/ui component library (13 components)
│   └── ai/           # Claude + OpenAI providers, deal scoring
├── tooling/
│   ├── eslint-config/
│   └── tsconfig/
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Features

### Built

1. **Product Lookup** — Search by ASIN, UPC, EAN, or URL. Three-provider data chain (Rainforest → Keepa → SP-API) with automatic fallback.

2. **Profit Calculator** — FBA fee estimation with referral, fulfillment, storage, prep, and inbound shipping fees. ROI, margin, and breakeven calculations.

3. **Bulk Scan** — CSV upload with progress tracking, retry logic with exponential backoff, and a "Retry Failed" button for rows that hit API limits.

4. **Buy Lists** — Two-panel UI for managing products you plan to purchase. Add from lookup, bulk scan, or Chrome extension. Batch add support.

5. **Sourced Products** — Full lifecycle tracking: Purchased → Listed → Sold. Compare predicted vs. actual profit and ROI.

6. **Performance Dashboard** — Analytics with Recharts visualizations. Summary stats, profit over time, marketplace breakdown, top products, and recent analyses with date range filtering.

7. **Price/BSR Watch Alerts** — Set price and BSR thresholds on any product. Dual monitoring: checked on each lookup and via scheduled background scans every 6 hours. In-app notifications with unread badge.

8. **Saved Searches** — Quick-access clickable chips for frequently searched products.

9. **AI Deal Score** — Claude/OpenAI-powered verdict (Strong Buy → Strong Pass) with score out of 100, factor breakdown, and reasoning.

10. **Chrome Extension** — MV3 side panel that auto-detects ASINs on Amazon product pages. Includes login, profit calculator, price/BSR history, alerts/watches, buy list integration, and AI verdict. Popup for quick lookups, options page for configuration.

11. **Core Infrastructure** — Auth (JWT + Google OAuth, email verification, password reset), teams with roles (Owner, Admin, VA, Viewer), settings, CSV export, billing scaffold.

### Planned

- Team invites with role-based permissions UI
- Product comparison (side-by-side)
- Enhanced export/report generation
- Notification preferences (email digest frequency)
- Dashboard customization (widget layout)

---

## Data Architecture

### Three-Provider Chain

```
Rainforest API (primary)
    ↓ falls through on empty/partial results
Keepa API (fallback)
    ↓ supplemental enrichment
Amazon SP-API (supplemental)
```

Orchestrated by `product-data-chain.service.ts` with retry logic and exponential backoff on all providers. Each provider has a dedicated service and mapper in `apps/api/src/modules/integrations/`.

### Database

22 Prisma models covering:

- **Core:** User, Team, TeamMember, Subscription, UsageRecord
- **Products:** Product, MarketplaceListing, ProductAnalysis, PriceHistory, BsrHistory, OfferHistory
- **Operations:** BulkScan, BulkScanRow, BuyList, BuyListItem, SourcedProduct, SavedSearch
- **Intelligence:** Alert, ProductWatch, WatchAlert
- **Infrastructure:** ApiKey, VerificationToken

---

## API Modules

The NestJS API uses feature-based organization (`apps/api/src/modules/`):

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `auth` | `/api/auth/*` | Login, register, refresh, Google OAuth, email verify, password reset |
| `products` | `/api/products/*` | Product lookup, cross-match, listings |
| `analysis` | `/api/analysis/*` | Profit calculation, breakeven, scenarios |
| `bulk-scan` | `/api/bulk-scans/*` | CSV upload, row processing, retry |
| `buy-lists` | `/api/buy-lists/*` | List CRUD, item add/remove, batch add |
| `sourced-products` | `/api/sourced-products/*` | Lifecycle tracking CRUD |
| `product-watches` | `/api/product-watches/*` | Watch CRUD, alerts, scheduled checks |
| `analytics` | `/api/analytics/*` | Summary, trends, breakdown, top products |
| `history` | `/api/history/*` | Price, BSR, and offer history |
| `ai` | `/api/ai/*` | Deal score, sell-through estimation |
| `saved-searches` | `/api/saved-searches/*` | Saved search CRUD |
| `alerts` | `/api/alerts/*` | Alert checking by identifier |
| `teams` | `/api/teams/*` | Team management |
| `billing` | `/api/billing/*` | Stripe subscriptions |
| `export` | `/api/export/*` | CSV/PDF generation |

---

## Chrome Extension

- **Background** — Service worker with message routing (22 message types), JWT auth with refresh, two-tier cache (memory + chrome.storage), current product state persistence via chrome.storage.session
- **Content Scripts** — Amazon, Walmart, and eBay scrapers that detect product identifiers from URL and DOM. Re-scrapes on tab switch and page navigation.
- **Side Panel** — Login gate, product header (image, title, price, BSR, rating), tabbed UI (Calculator / History / Alerts), buy list integration, AI deal score verdict
- **Popup** — Quick ASIN/UPC/EAN lookup
- **Options** — API URL configuration, account management with logout

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL
- Redis

### Setup

```bash
# Clone and install
git clone https://github.com/josecescobar/sourcetool.git
cd sourcetool
pnpm install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, and any API keys you have

# Database
pnpm db:push

# Run
pnpm dev
```

This starts:
- **API**: http://localhost:3001
- **Web**: http://localhost:3000
- **Extension**: `pnpm --filter extension dev` then load `apps/extension/dist/chrome/` as unpacked extension in `chrome://extensions`

### Docker (Postgres + Redis only)

```bash
docker compose up -d
```

---

## Scripts

```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps
pnpm typecheck    # TypeScript check across all packages
pnpm lint         # ESLint across all packages
pnpm db:push      # Push Prisma schema to database
pnpm db:generate  # Regenerate Prisma client
pnpm db:seed      # Seed sample data
pnpm clean        # Remove all build artifacts and node_modules
```

---

## Environment Variables

See `.env.example` for the full list. Key ones:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens |
| `RAINFOREST_API_KEY` | For lookups | Primary product data source |
| `KEEPA_API_KEY` | Fallback | Used if Rainforest fails |
| `ANTHROPIC_API_KEY` | For AI | Claude API key for deal scoring |
| `STRIPE_SECRET_KEY` | For billing | Stripe secret key |
| `RESEND_API_KEY` | For email | Transactional email via Resend |
| `GOOGLE_CLIENT_ID` | For OAuth | Google OAuth client ID |

---

## Design Principles

1. **Speed over features** — Extension panel must load analysis in <2 seconds
2. **AI-native, not AI-added** — Every feature asks "how would AI make this better?"
3. **Unlimited by default** — Never gate basic lookups behind scan limits
4. **Cross-browser from day 1** — WebExtension APIs for Chrome/Firefox/Edge/Brave
5. **Transparent billing** — Easy cancellation, prorated refunds, no dark patterns
6. **Data independence** — Collect proprietary historical data from day one
7. **Close the feedback loop** — Track sourced products from purchase → sale → realized ROI

---

## License

Private. All rights reserved — Juggernaut Resellers LLC.
