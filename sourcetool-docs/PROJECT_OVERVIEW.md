# PROJECT_OVERVIEW.md — SourceTool

## Vision
SourceTool is an AI-native Amazon arbitrage platform that merges the two tools every OA/RA seller pays for today — **SellerAmp SAS** (single-ASIN buy-decision analysis) and **Keepa** (deep price/rank history + catalog-wide data) — into one product with one subscription, one backend, and modern UX. SellerAmp answers "should I buy this one product?"; Keepa answers "what happened to this product over time, and what products exist matching X?". Neither does both. SourceTool does both, plus AI-assisted deal scoring and natural-language product finding neither offers.

**One-line pitch:** Every data point Keepa has, every decision SellerAmp makes, one screen, one price.

## Target users
1. **Retail arbitrage (RA) sellers** — scan barcodes in stores; need <2s verdicts on phone (mobile app, Speed Mode).
2. **Online arbitrage (OA) sellers** — browse retail sites + Amazon; need extension overlays and one-click analysis.
3. **Wholesale/flip analysts** — bulk ASIN lists, Product Finder queries, storefront stalking, buy-box forensics.
4. (Later) **Tool builders** — our own public API once the data moat exists.

Marketplaces at launch: **amazon.com, amazon.ca, amazon.co.uk** (US-first). Schema supports all Keepa domain IDs from day one.

## Competitive posture
- SellerAmp weaknesses we exploit: one-ASIN-at-a-time (no bulk/finder), Chrome-only extension, weak IP-alert DB, no post-purchase tracking, dated tier gating.
- Keepa weaknesses we exploit: dense 2011-era UI, no profit calculator, no eligibility checks, no opinions ("pure data"), EUR-only billing, forum-only docs.
- Our wedge: **one tool replaces a $30 + €19 stack (~$50/mo) at a single price point**, with AI layers (natural-language finder, deal scoring, image search) as the headline differentiator.

## Combined feature list (merged, deduped)
Source attribution: [SA] = from SellerAmp, [K] = from Keepa, [ST] = SourceTool-original. Full specs in `FEATURES.md`.

### Analysis (per-ASIN)
- F-01 Product analysis panel — modular, reorderable panel stack; stoplight color coding vs user criteria [SA]
- F-02 Profit calculator — full Amazon fee breakdown, Max Cost, breakeven, ROI/margin, discounts, VAT/sales-tax [SA]
- F-03 Sales estimator — BSR-model + rank-drop counts + Amazon "monthly sold" history [SA+K]
- F-04 Eligibility check — "Can I sell this?" via user's connected seller account (SP-API) [SA]
- F-05 Risk alerts — IP-complaint DB, hazmat, meltable, oversized, private-label heuristic, Amazon-on-listing [SA]
- F-06 Offers & competition — live offer list w/ per-seller stock levels, profit-if-matched [SA+K]
- F-07 Buy Box forensics — per-seller win %, avg price, rotation, suppression reasons, std-dev, winner count [K, richer than SA]
- F-08 Variations viewer — per-variant price/rank/margin, shared-rank flag [SA+K]
- F-09 eBay cross-check — eBay New/Used price series alongside Amazon [K]

### History & charts
- F-10 Price/rank history charts — all series (Amazon, 3P New/FBA/FBM, Buy Box, Used, List, Warehouse, rank, offer counts, rating, reviews, monthly-sold), zoom/toggle/close-up, ranges 1d→all [K]
- F-11 History statistics — min/max/avg per window, drop counts, OOS % [K]

### Discovery (catalog-wide)
- F-12 Product Finder — full filter DB over catalog (rank, prices, drops, BB seller type, OOS %, category, attributes…) [K]
- F-13 AI Finder — natural-language → Finder query compilation ("replens under $20 with Amazon off the listing 90 days") [ST]
- F-14 Deals browser — recent price-drop feed with filters [K]
- F-15 Bulk Product Viewer — paste ≤10k ASINs → stat table, export [K]
- F-16 Best sellers by category [K]
- F-17 Seller lookup — rating history, storefront ASIN dump, BB stats per seller [K]
- F-18 Storefront analysis — analyze every ASIN in a competitor's store [SA+K]
- F-19 Category tree browser [K]

### Tracking & alerts
- F-20 Price/rank trackers — desired price per series, back-in-stock, threshold alerts; email/push/webhook [K]
- F-21 Watchlists w/ re-analysis — saved products re-scored daily against user criteria; "deal went live" alerts [ST]

### Workflow
- F-22 Sourcing lists — buy lists, notes, tags, custom fields, CSV/Google Sheets export [SA]
- F-23 Analysis history — every lookup archived w/ inputs used [SA]
- F-24 Settings profiles — buying criteria, cost assumptions, panel layout; multiple profiles, team sharing [SA]

### Capture surfaces
- F-25 Chrome extension (MV3) — Amazon product-page panel injection, search-results quick view, any-retail-site smart search, right-click analyze [SA+K]
- F-26 Mobile barcode scanning — continuous Speed Mode, UPC/EAN, share-sheet intake, offline queue [SA]
- F-27 AI image search — photo → ASIN match (mobile + extension right-click) [SA]

### Platform
- F-28 Auth, plans, billing, usage metering (lookup quotas per tier)
- F-29 Amazon seller account connection (SP-API OAuth) — powers F-04, fees, inventory links
- F-30 Data pipeline — Keepa API ingestion + own SP-API collector (hybrid; see ARCHITECTURE.md §Data strategy)

## What each incumbent does better (honest notes for spec authors)
- Keepa's history depth (to ~2011) is unpurchasable except via their API — hence hybrid strategy.
- Keepa's crowdsourced extension traffic refreshes long-tail ASINs; we won't match freshness at launch — mitigate with on-demand Keepa `update` calls.
- SellerAmp's eligibility check piggybacks the user's Seller Central browser session (zero setup, TOS-gray). We use official SP-API Listings Restrictions instead: cleaner, but requires SP-API developer registration and user OAuth — accept the onboarding friction.
- SellerAmp's 2–3s lookup speed is the bar; our analysis endpoint budget is **p95 < 1.5s warm, < 3s cold** (cold = Keepa fetch required).

## MVP vs later phases
**MVP (Phases 1–6 in BUILD_PLAN.md):** F-01…F-06, F-08, F-10, F-11, F-22, F-23, F-24, F-25 (product page + retail-site modes), F-26 (scan + analyze), F-28, F-29, F-30 (Keepa-fed + collector skeleton). Web + extension + mobile all ship in MVP; extension is the highest-frequency surface for OA users.

**Phase 2:** F-07 buy-box forensics UI, F-12 Finder, F-14 Deals, F-15 Bulk Viewer, F-20 trackers/alerts, F-16 best sellers.
**Phase 3:** F-13 AI Finder, F-17/F-18 sellers & storefronts, F-19 category tree, F-21 watchlist re-scoring, F-27 image search, F-09 eBay.
**Later:** public API, additional marketplaces (DE/FR/IT/ES/JP/MX/AU), team seats, repricer integrations.

## Business constraints baked into architecture
- Keepa API is a COGS line (€49–€249/mo tier at launch; scales with usage). Token budget enforcement is a first-class backend concern — see ARCHITECTURE.md.
- Keepa licensing prohibits redistribution/resale of raw bulk data. We serve users derived analysis and charts within our app (same posture SellerAmp takes); our OWN collected data carries no such restriction — the collector pipeline is the long-term moat.
- Lookup quotas per plan tier are the primary monetization lever (mirrors SellerAmp: entry tier metered, upper tiers unlimited).

## Success criteria for v1
- Analyze any of top ~5M US ASINs in <3s with chart, fees, eligibility, verdict.
- Barcode scan → verdict in <2s on mid-range Android.
- Extension overlay parity with SellerAmp's QVS ("Quick View" search-results overlay) on Amazon search pages.
- Own collector skeleton persisting (with provenance) every data point we ever fetch; scheduled independent refresh lands in Phase 7 (see BUILD_PLAN).
