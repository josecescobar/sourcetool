# FRONTEND_WEB.md — SourceTool Web App

Next.js 14 App Router, TypeScript, Tailwind + shadcn/ui, TanStack Query v5, Zustand (UI-local state only), uPlot for time-series. Deployed alongside API. Dark mode default (sellers live in this tool all day; Keepa's dark mode is beloved).

## Route map (App Router)
```
app/
├── (marketing)/            # public, SSG: landing, pricing, blog
├── (auth)/login, register, reset
├── (app)/                  # authed shell: topbar (search omnibox, quota meter, profile switcher), left nav
│   ├── dashboard/          # recent lookups, active trackers firing, watchlist movers, quota usage
│   ├── p/[mkt]/[asin]/     # ★ product analysis page (the product)
│   ├── search/             # results grid w/ quick-view cards
│   ├── finder/             # Product Finder (Phase 2) + AI prompt bar
│   ├── deals/              # deals browser (Phase 2)
│   ├── viewer/             # bulk ASIN viewer (Phase 2)
│   ├── sellers/[mkt]/[id]/ # seller profile + storefront (Phase 3)
│   ├── categories/         # tree browser (Phase 3)
│   ├── trackers/           # tracker management + notification feed
│   ├── lists/[id]/         # sourcing lists, export
│   ├── history/            # analysis history w/ tag/note filters
│   └── settings/           # profiles, seller link, devices, billing, panel layout editor
└── share/p/[mkt]/[asin]    # public read-only product page (SEO growth channel, gated stats)
                            # rendered server-side (RSC) via internal service-token fetch to the API —
                            # no public API endpoint; only cached metadata + teaser chart, no fresh lookups
```

## The product analysis page (`/p/[mkt]/[asin]`)
Mirrors SellerAmp's panel-stack model — **a vertical stack of self-contained panels, user-reorderable and hideable** (layout persisted in SettingsProfile.panelLayout). Single data source: `GET /analysis` composite + separate `/history` fetch for charts.

Panel registry (each = lazy-loaded React component with a stable `panelId`):
`quick-info` (verdict header: eligibility badge, profit, ROI, max cost, BSR w/ stoplight colors; inline cost/sale inputs recomputing via local calc engine — no server round-trip), `chart` (main uPlot chart), `calculator`, `offers`, `buybox`, `alerts` (risk flags), `ranks-prices` (stat table w/ Current/30/90/180/365 toggle), `variations`, `roi-table`, `product-info`, `notes-tags`, `lookup-history`, `discounts`, `ebay` (P3), `export`.

Drag-reorder via dnd-kit; layout editor also lives in settings. Every panel renders skeleton → data independently so slow enrichments (eligibility) never block the chart.

## Charting approach (core competency — get this right)
- **uPlot** with custom step-after paths, dual y-axes (price left, rank right inverted — Keepa convention users already read), series toggles as legend checkboxes, drag-zoom, wheel-zoom, hover crosshair w/ synced tooltip showing exact values + timestamp.
- Series colors follow Keepa's canonical palette (users' eyes are trained): Amazon = orange filled area (gaps = OOS), New 3P = blue, Buy Box = magenta diamonds, FBA = orange triangles, FBM = teal, Used = black, Rank = green (right axis), Monthly-sold = gold. Defined once in `packages/shared/chartTheme.ts` — extension and mobile reuse.
- Range buttons: 1d/1w/1m/3m/6m/1y/all, mapped to the API's canonical range enum (1d/7d/30d/90d/180d/365d/all). "Close-up view" toggle rescales y to visible window (Keepa parity).
- Data contract: `/history?agg=raw` for ≤90d ranges, `agg=daily` beyond (server default; downsampled from continuous aggregate). Step interpolation client-side; `-1` values terminate a path segment (render gap).
- Wrap uPlot in one `<PriceHistoryChart>` component with imperative handle; never let React re-render the canvas (data updates via `chart.setData`).

## State management
- **Server state = TanStack Query exclusively.** Query keys: `['analysis', mkt, asin, profileId]`, `['history', mkt, asin, seriesCsv, range]`, `['trackers']`… staleTime 60s for analysis, 5min for history. Mutations invalidate narrowly.
- **Client state = Zustand slices**: `useUiStore` (panel drag state, chart series toggles, omnibox open), `useCalcStore` (live calculator inputs per ASIN, hydrated from analysis defaults; recompute runs `packages/calc` synchronously on keystroke).
- **No global Redux.** Profile/auth in Query cache + httpOnly-adjacent memory (access token in memory, refresh in secure cookie).

## Key components (packages: colocate in `apps/web/components`, promote to `packages/ui-web` only when extension actually reuses)
- `Omnibox` — accepts ASIN / UPC / URL / free text; calls `/search`; keyboard-first (⌘K).
- `VerdictBadge`, `StoplightStat` — color logic from shared `verdictColors(criteria, value)`.
- `QuickViewCard` — used in search grid + finder results + lists (image, title, sparkline, rank, BB price, verdict chips).
- `OffersTable` — sortable, seller links, stock column, profit-if-matched column.
- `BuyBoxTimeline` — horizontal ownership bar chart (Recharts) + seller table.
- `FinderFilterPanel` (P2) — grouped accordion of range inputs; compiles to FinderFilters; URL-serialized (shareable queries, Keepa parity).
- `TrackerDialog` — create tracker prefilled from current chart series/value.

## Data-density & UX principles
- SellerAmp-grade speed: optimistic navigation, prefetch analysis on QuickViewCard hover, skeleton panels.
- Keepa-grade density without Keepa's chaos: progressive disclosure (stat tables collapsed to 30/90d by default), consistent stoplight semantics everywhere, every number clickable → source (chart range or fee breakdown).
- All tables virtualized (TanStack Virtual) — finder/storefront results hit 10k rows.
- Quota meter always visible in topbar (STARTER tier anxiety-reducer; upsell surface).

## Error/empty states
- `ASIN_NOT_FOUND` → offer Keepa-side term search.
- `eligibility.status === "NO_SELLER_LINK"` (a status in the analysis payload, not an API error code) → eligibility panel renders CTA card to connect Amazon account (deep-links settings).
- `QUOTA_EXCEEDED` → paywall modal w/ resetAt countdown + upgrade.
- Partial analysis (enrichment timeout) → panel-level "retry" chips, never full-page failure.

## Testing
- Vitest + Testing Library for components with logic (calc panel, verdict colors, finder filter compiler).
- Playwright smoke: login → search → analyze known seed ASIN → panels render → calculator recompute → add to list → export. Runs against seeded local stack (no Keepa calls; fixtures).
