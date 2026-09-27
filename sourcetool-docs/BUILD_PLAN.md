# BUILD_PLAN.md — SourceTool Implementation Roadmap

Ordered by dependency. Each **session** is sized for one focused Codex working session (~one PR, reviewable in one sitting). Sessions within a phase are sequential unless marked ∥ (parallelizable). Every session ends with: tests passing, `pnpm build` green across workspace, migration applied cleanly to a fresh DB.

Prerequisites you (human) must complete before Phase 2/5: Keepa API subscription + key; Amazon SP-API developer registration + app (LWA credentials) — start SP-API registration NOW, approval takes weeks; Stripe account; Expo/EAS account; Chrome Web Store dev account.

## Phase 0 — Foundation
- **0.1** Monorepo scaffold: pnpm workspaces + Turborepo; `packages/config` (tsconfig/eslint/prettier); empty `apps/api` (NestJS init), `apps/web` (Next init), `packages/shared`, `packages/calc`, `packages/api-client`; CI (GitHub Actions: lint, typecheck, test, build); docker-compose (timescale/timescaledb-ha:pg16, redis, mailhog).
- **0.2** `packages/shared` core: Marketplace + PriceSeries enums, Zod schema conventions, error codes, chartTheme, verdictColors; unit tests.

## Phase 1 — Platform spine
- **1.1** Prisma init + OLTP migration 1 (User, Session, SettingsProfile, plans enums); AuthModule: register/login/refresh-rotation/logout, argon2id, device sessions; e2e auth tests.
- **1.2** BillingModule: Stripe checkout/portal/webhook state machine, plan gates decorator (`@RequiresPlan`), quota service (Redis INCR + hourly reconcile); tests w/ stripe-mock.
- **1.3** ∥ Profiles CRUD + Zod criteria/costs schemas; `/me` composite; rate-limit guard (sliding window).
- **1.4** ∥ NotifyModule skeleton: Resend email (verify, reset), template system; push-token registry (`PUT /me/push-tokens`); worker entrypoint + BullMQ wiring + healthchecks.

## Phase 2 — Data core (the moat starts here)
- **2.1** Time-series migration: price_points, buybox_events, offer_snapshots hypertables + compression/retention/continuous aggregate (raw SQL migration); products, Seller, Category, KeepaTokenLedger Prisma models; seed script w/ synthetic fixtures (50 ASINs, 2y history).
- **2.2** IngestModule: KeepaClient (typed, gzip, retries), TokenBudgetService (Redis bucket + ledger), mappers: csv→price_points AND buyBoxSellerIdHistory→buybox_events AND offers→offer_snapshots (fixture-tested against real Keepa blobs — commit sanitized fixtures), keepa-time conversion utils; persist-keepa-history job.
- **2.3** ProductModule + HistoryModule: product upsert from Keepa payload, `/products/.../history` endpoint (raw + daily agg paths), `/products/{mkt}/{asin}` metadata, stats service (windows/min/max/avg/drops/OOS from aggregate); perf test: chart query <100ms on seeded 5M-row table.
- **2.4** Search/resolve: `/search` (ASIN regex → EAN GIN → Keepa term search), `/resolve/url` parser; freshness policy service (hot/warm/cold, lastKeepaSync gate).
- **2.5** Collector skeleton (MVP scope of F-30): provenance-aware persistence of everything fetched (source column discipline), freshnessTier assignment, CollectorRun bookkeeping, kill-switch flags. Scheduled SP-API refreshers deferred to Phase 7.

## Phase 3 — Analysis engine
- **3.1** `packages/calc` v1: fee tables (US referral categories, FBA size tiers, storage), CalcInput/Result, Max Cost solver, discounts, sales-tax; 25+ golden fixtures, property tests. NO UI yet — pure package.
- **3.2** CalcModule (`POST /calc` + fee lookup via cached product fees), SalesEstimator (rank-drop + curve + monthlySold blend, confidence), category_sales_curves table + seed curves.
- **3.3** RiskModule: BrandRisk model + import job + heuristics (PL detection, oversized calc, AMZ-on-listing %); `/risk/brand`.
- **3.4** AnalysisModule: the composite orchestrator (parallel enrichments, per-branch timeouts, Redis cache, quota charge, Lookup archive write); OffersModule endpoints `GET .../offers` + `GET .../variations`; `GET /analysis` e2e against seeded data; latency budget test.

## Phase 4 — Web app core
- **4.1** ∥ Web shell: auth pages + token handling, app layout (topbar/omnibox/nav/quota meter), TanStack Query setup, api-client codegen pipeline from OpenAPI.
- **4.2** Product page: panel framework (registry, dnd-kit reorder, per-surface layout persistence) + quick-info, ranks-prices, product-info panels.
- **4.3** `<PriceHistoryChart>` uPlot wrapper (step-after, dual axis, gaps, toggles, ranges, close-up, crosshair) + chart panel + stats panel; visual QA vs Keepa on seed ASINs.
- **4.4** Calculator panel (local calc engine, live recompute, discounts UI, ROI table panel) + verdict wiring; offers panel + variations panel.
- **4.5** Search results page + QuickViewCard; history page; settings pages (profiles editor, devices); dashboard v1.
- **4.6** Lists MVP: lists/items/notes/tags CRUD + UI + CSV export job.

## Phase 5 — Seller link + eligibility
- **5.1** SellerLinkModule: LWA OAuth flow, token encryption, health check, settings UI card.
- **5.2** SP-API client core (signing, rate buckets, backoff) + getMyFeesEstimate integration → calc fee source; EligibilityModule + cache + `/eligibility`; alerts panel (risk + eligibility) on web.

## Phase 6 — Extension + Mobile (MVP completion) ∥ tracks
**6E Extension:**
- **6E.1** MV3 scaffold (CRXJS), auth bridge (iframe + storage.session), panel iframe on Amazon product pages, selector registry + remote config.
- **6E.2** Search-page overlay + `/quick-view` batch endpoint (backend part of this session); marketplace domain detection.
- **6E.3** Retail-site mode: extraction heuristics (structured data/og/title), context menus, match-confidence picker; top-20 retail fixture tests; store submission pass.
**6M Mobile:**
- **6M.1** Expo scaffold (dev client, EAS, Hermes, new arch), auth screens + SecureStore, tab shell, api-client RN adapter.
- **6M.2** ScanScreen: camera + barcode (ScannerProvider interface), Speed Mode card loop, cost quick-pad w/ local calc, haptics; `/search?q=ean` resolve path perf.
- **6M.3** AnalysisScreen panel cards + RN chart renderer (shared /history contract).
- **6M.4** Offline: SQLite cache, scan outbox, sync worker, list mirror; Lists + Profile screens; push token registration; Maestro e2e; store builds.

**→ MVP SHIP GATE:** seed-to-prod checklist — real Keepa key burn test, SP-API prod approval, Stripe live, extension store approval, TestFlight/Play internal. Closed beta.

## Phase 7 — Collector (dependency: MVP traffic to know what to collect)
- **7.1** CollectorModule: freshnessTier scheduler, SP-API Catalog/Pricing refreshers writing price_points(source=collector) + offer_snapshots + buybox_events; CollectorRun bookkeeping; lag dashboard (Grafana).
- **7.2** Keepa-dependency shrink logic: serve-from-own-data gate when collector coverage sufficient per ASIN; provenance-aware freshness; token burn alerting.
- **7.3** category_sales_curves fitter job from observed monthlySold×rank pairs.

## Phase 8 — Trackers & alerts
- **8.1** TrackerModule CRUD + bulk import + plan caps; hot-promotion of tracked ASINs.
- **8.2** Evaluator job (insert-triggered + 5min sweep), debounce, Notification records; email + Expo push delivery; web/mobile tracker screens + create-from-chart dialog.
- **8.3** Webhooks (HMAC) + notification center UI.

## Phase 9 — Discovery suite
- **9.1** product_stats materialized table + incremental refresh worker + indexes; perf harness (5M rows).
- **9.2** FinderModule `/finder/query` + web FinderFilterPanel + URL serialization + saved searches + CSV export.
- **9.3** Deals proxy (`/deals` + cache) + web deals page.
- **9.4** Bulk Viewer (job pipeline, progress, table UI, track-all).
- **9.5** Best sellers + category tree sync + browse UI.
- **9.6** Buy Box forensics (F-07): `GET .../buybox` windowed stats endpoint + BuyBoxTimeline UI panel (data already ingested since 2.2).

## Phase 10 — AI layer + sellers
- **10.1** AI Finder: LLM function-calling compiler → FinderFilters, confirm UI, eval set in CI.
- **10.2** Watchlist re-scoring digests.
- **10.3** SellerModule: lookup + rating history + storefront ingestion; web seller pages; storefront→viewer bridge.
- **10.4** Image search: pgvector + embedding job for corpus images, `/resolve/image`, mobile photo mode + extension context menu.
- **10.5** Sheets export OAuth push; eBay panel.

## Cross-cutting (every phase)
Observability from 1.1 (pino+Sentry; OTel spans on analysis path by 3.4). Security review gates at 5.2 (token handling) and 6E.3 (extension permissions). Load test before ship gate: 200 rps analysis warm, 20 rps cold.

## Sizing summary
30 Codex sessions to MVP gate (Phases 0–6), 17 more through Phase 10 — some will split when reality intrudes; treat as lower bounds. Suggested cadence: backend sessions before their consuming frontend sessions; never start a phase with red CI.
