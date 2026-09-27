# FEATURES.md — SourceTool Feature Specs

Format per feature: What / Inputs → Outputs / Edge cases / Acceptance criteria (AC). IDs match PROJECT_OVERVIEW.md. Endpoints reference API_SPEC.md; tables reference DATA_MODEL.md. Phase tags: [MVP] [P2] [P3].

---

## F-01 Product analysis panel [MVP]
**What:** Composite per-ASIN screen answering Can I sell it / Does it sell / Is it profitable, as a reorderable panel stack (web/ext/mobile share panel registry + per-surface layout in SettingsProfile).
**In:** mkt+asin (+profileId, optional cost/sale overrides). **Out:** AnalysisResponse (API_SPEC).
**Edge:** unknown ASIN (Keepa miss → 404 w/ search fallback); variation child w/ shared rank (flag `sharedRank`, exclamation on est. sales); suppressed buy box (show lowest offer + "no buy box" reason); Amazon OOS (orange gap semantics); partial enrichment timeout (panel-level UNKNOWN + retry, never block).
**AC:** warm p95 <1.5s; every panel independently loadable; layout drag persists per surface; stoplight colors everywhere derive from one shared `verdictColors()`.

## F-02 Profit calculator [MVP]
**What:** Full Amazon economics: referral fee, FBA fulfilment fee, monthly storage (× duration slider), variable closing fee, prep/inbound/labor/return-rate/sales-tax/VAT, discount adjustments (% off, coupon, multi-buy per-unit derivation). Outputs profit, ROI, margin, breakeven, payout, **Max Cost** — the largest cost price satisfying BOTH minProfit and minROI targets (i.e. min of the two implied max costs).
**In:** CalcInput (API_SPEC) with profile defaults prefilled. **Out:** CalcResult.
**Edge:** missing fee data (weight/dims absent → estimate from category median, `warnings:["fee_estimated"]`); FBM (user ship cost replaces FBA fee); VAT schemes (standard/flat — UK/EU only, hidden for US profile); zero/negative sale price (validation); multi-buy (bulkQty>1 derives unit cost); fee changes (fee tables versioned by effective date in `packages/calc/feeTables`, updated via config not code).
**Edge (persistence):** per-ASIN calculator inputs persist (Lookup row) and restore on re-analysis — SellerAmp parity.
**AC:** pure function, zero IO, identical output web/mobile/ext/server (fixture parity test); Max Cost inverse verified property-based (at maxCost both constraints hold and at least one is tight); 25+ golden fixtures vs hand-computed fee cases incl. oversize tiers.

## F-03 Sales estimator [MVP]
**What:** Estimated monthly sales + time-to-sell. Blend: (1) Amazon `monthlySold` when present (highest confidence), (2) rank-drop count 30/90d × category drop→sale ratio, (3) BSR→sales category curve (category_sales_curves).
**In:** asin stats. **Out:** {monthly, method, confidence, timeToSellDays, sharedRank}. timeToSell v1 heuristic: perSellerMonthly = monthly ÷ (fbaCount+1); timeToSellDays = 30 ÷ perSellerMonthly (capped 1–365).
**Edge:** variation shared rank → estimate at parent, flag; rank missing (new/suppressed) → confidence "low", null monthly; category w/o curve → fall back to global curve; monthlySold "50+" floor semantics (store as int floor, display "50+").
**AC:** estimator versioned (`method` in response); backtest harness comparing estimate vs later-observed monthlySold on corpus, MAPE tracked; never renders without confidence label.

## F-04 Eligibility check [MVP]
**What:** "Can I sell this?" via user's linked seller account → SP-API getListingsRestrictions; status ELIGIBLE / APPROVAL_REQUIRED (+apply link) / NOT_ELIGIBLE / NO_SELLER_LINK.
**In:** asin, sellerAccountId. **Out:** status+reasons; cached 7d (EligibilityCache), bust on demand.
**Edge:** no link (CTA state, not error); token revoked (mark SellerAccount ERROR, notify, degrade to UNKNOWN); marketplace mismatch link vs lookup (use matching account or UNKNOWN — SellerAmp's known footgun, we surface it explicitly); SP-API 429 (queue + serve cache with age).
**AC:** result matches Seller Central "Add a Product" check on 20-ASIN validation set; cache TTL honored; revocation flow tested.

## F-05 Risk alerts [MVP]
**What:** Account-independent flags: IP-complaint brand DB (BrandRisk, imported + moderated community reports), private-label heuristic (single lifetime FBA seller + brand=seller name pattern), hazmat/meltable/adult (product attrs), oversized (dim tier calc), Amazon-on-listing now/history (% of 90d Amazon offered), generic-brand flag.
**Out:** riskFlags[] w/ severity 1–3.
**Edge:** brand aliasing (normalize case/punctuation); false-positive PL (confidence threshold, wording "suspected"); no data (omit flag, never green-wash).
**AC:** flags render on all surfaces incl. scan card icons; community reports require auth and are stored low-severity/unverified until reviewed (admin moderation UI is a later-phase item — no queue infra in scope now); IP DB import job idempotent.

## F-06 Offers & competition [MVP]
**What:** Live offer table: seller, rating/count, FBA/FBM/AMZ, price+ship, Prime, stock level (cart-999 method via Keepa offers / collector), profit-if-matched (calc at that price), MOQ detection.
**Edge:** >20 offers (paginate, lowest-10 summary); stock unknown (— not 0); backorder/pre-order states; scammer-flagged seller (badge).
**AC:** stock shown when source provides; profit-if-matched uses active profile; seller name links to F-17 (P3: stub to Amazon storefront URL).

## F-07 Buy Box forensics [P2]
**What:** Ownership analysis over 30/90/180/365d from buybox_events: per-seller win %, avg winning price, last won, isFBA, stock; winner count, price std-dev, Amazon share %, suppression periods.
**Edge:** sparse data (<10 events → "insufficient history"); rotation among equals (surface winnerCount prominently — replen signal); used-condition buy box separate.
**AC:** percentages sum ≈100 (±1 rounding); windowed query <200ms cached 1h; matches Keepa BB stats on validation ASINs within tolerance.

## F-08 Variations viewer [MVP]
**What:** All variation ASINs w/ attribute matrix (size/color…), per-variant BB price, rank (if per-variant), review share, one-tap analyze.
**Edge:** ≤50 shown + count; parent lookup redirects to representative child w/ banner; orphaned child (parent unknown → flat).
**AC:** variation switch reuses cached parent data (no double lookup charge).

## F-09 eBay cross-check [P3]
**What:** eBay New/Used price series (Keepa series 28/29) charted vs Amazon; link to eBay search.
**AC:** renders only when series exist; clearly labeled source.

## F-10 History charts [MVP]
**What:** Multi-series step charts, all PriceSeries, ranges 1d/7d/30d/90d/180d/365d/all (canonical API enum; UI labels 1d/1w/1m/3m/6m/1y/all), toggles, zoom, close-up, crosshair tooltip, OOS gap rendering, monthly-sold overlay. Keepa-canonical colors (shared chartTheme).
**In:** /history contract. **Out:** interactive chart web/ext; static-interactive (range buttons, crosshair) mobile.
**Edge:** sparse series (single point → dot); -1 gaps; rank axis inverted; tz display local; range ≥180d served from daily agg.
**AC:** 10y × 8 series renders <50ms after data (web uPlot); visual parity check vs Keepa chart for 10 seed ASINs (manual QA gate); series toggle state persists per user.

## F-11 History statistics [MVP]
**What:** Stat table per series: current, min/max (w/ dates), avg 30/90/180/365, drop counts, OOS%, net price change. Backed by continuous aggregate + stats cache.
**AC:** numbers match chart hover values; window math tested against fixtures.

## F-12 Product Finder [P2]
**What:** Filter query over product_stats: ranges on any series (current/avgs/drop%), category incl/excl, BB seller type, OOS%, rank drops, monthlySold, review/rating, attributes (brand, dims, hazmat…), text search. Sort any column, ≤10k results, CSV export, URL-serialized shareable queries, saved searches.
**Edge:** over-broad query (result cap + "narrow filters" hint); stale stats (product_stats.updatedAt shown); attribute nulls (tri-state filters: any/has/not).
**AC:** p95 <2s on 5M-row product_stats with 6 filters (indexes per DATA_MODEL); export ≤10k rows; every filter round-trips through URL.

## F-13 AI Finder [P3]
**What:** NL prompt → LLM (server-side, function-calling against FinderFilters schema) → structured filters + human-readable explanation → user confirms → F-12 executes. Follow-up refinements keep context ("cheaper", "exclude grocery").
**Edge:** unmappable ask (return partial filters + "couldn't map: X"); hallucinated categories (validate against category table, drop invalid); prompt injection (filters schema is the only output channel — no free-form execution).
**AC:** 30-prompt eval set → ≥90% produce valid executable filters; user always sees/edits compiled filters before run; LLM cost logged per call.

## F-14 Deals browser [P2]
**What:** Recent price-drop feed: filter by series (priceTypes), % / absolute drop, window (day/week/month), category, price/rank ranges, lowest-ever flag, back-in-stock. Cards w/ mini sparkline + drop vs 30d avg.
**Impl:** v1 = proxied Keepa `deal` endpoint (cached 15min per filter-combo hash); v2 = self-computed from own ingest stream (flip when corpus coverage sufficient).
**Edge:** feed staleness (show as-of); erotic filter default-on; dedupe variations toggle.
**AC:** cache hit-rate >80%; identical DealRequest → one upstream call per window.

## F-15 Bulk Product Viewer [P2]
**What:** Paste/upload ≤10k ASINs/UPCs → async job → stat table (viewer columns configurable) + CSV; "track all" bulk action.
**Edge:** mixed junk input (per-row resolve status); quota interaction (batch = ceil(n/24) lookups, prompt confirmation); job partial failure (row-level errors, resumable).
**AC:** 10k-ASIN job completes <10min within Keepa budget (batches of 100, token-aware pacing); progress via polling endpoint.

## F-16 Best sellers [P2]
**What:** Ranked list per category (current or avg-rank basis), export, jump into Finder pre-filtered.
**Impl:** Keepa bestsellers endpoint cached 24h per category.

## F-17 Seller lookup [P3]
**What:** Seller profile: rating history chart, 30/90/365/lifetime pos%, business info, scammer flag, BB ownership stats across corpus, top brands/categories.
**Edge:** seller not found/new; suspended sellers.
**AC:** storefront tab lazy (separate quota-charged action).

## F-18 Storefront analysis [P3]
**What:** Seller's ASIN list (≤100k, Keepa storefront param) → QuickViewCards grid → bulk send to Viewer/Finder.
**Edge:** huge storefronts (paginate, cap fetch, "load more" costs shown); privacy posture: public data only.

## F-19 Category tree [P3]
**What:** Browse tree w/ product counts; node → pre-filtered Finder/Best-sellers/Deals.
**Impl:** category table synced weekly from Keepa category endpoint.

## F-20 Trackers & alerts [P2]
**What:** Per-ASIN tracker: series + direction (below/above/back-in-stock) + threshold + seller scope + expiry. Channels: email, mobile push, webhook (PRO). Bulk import ≤500. Management screen w/ current-vs-threshold.
**Trigger path:** ingest/collector inserts price_point → if (asin,mkt) has active trackers → evaluate → debounce 1h → notify. Tracked ASINs promoted to freshnessTier hot (collector refreshes ≥hourly).
**Edge:** threshold already met at creation (fire immediately? — no: confirm-on-create shows current value, requires explicit "notify anyway"); channel failure (retry ×3, mark undelivered); expired trackers auto-deactivate; per-plan tracker caps (TRIAL 10 / STARTER 50 / SERIOUS 500 / PRO 5000).
**AC:** insert→notification p95 <5min for hot ASINs; no duplicate fires within debounce; webhook HMAC-signed, 2s timeout, 3 retries.

## F-21 Watchlists w/ re-analysis [P3]
**What:** Saved Finder searches + WATCH lists re-scored daily against profile criteria; digest notification "3 new passing deals". This is the AI-native replacement for manually re-running Keepa queries.
**AC:** daily job fan-out within Keepa/collector budget; digest groups by list; opt-out per list.

## F-22 Sourcing lists & export [MVP]
**What:** BUY/WATCH/custom lists; items carry cost/sale/qty + verdict snapshot; notes (timestamped, multiple) + tags (reusable) per ASIN; CSV export MVP, Google Sheets push P2 (OAuth, field mapping, append mode).
**Edge:** duplicate add (bump qty prompt); snapshot vs live drift (show both, "refresh" action = new lookup charge); export field config persisted.
**AC:** list ops offline-capable on mobile (outbox); CSV includes all visible + configured fields; Sheets push idempotent per item.

## F-23 Analysis history [MVP]
**What:** Every lookup archived: ts, surface, source URL, cost/sale entered, verdict snapshot. Filter by text/tag/date/pass-fail.
**AC:** write is async (never slows analysis); history search <300ms; retention unlimited (rows are small).

## F-24 Settings profiles [MVP]
**What:** Named profiles: marketplace, buying criteria, cost assumptions, panel layout per surface. 1 default; plan-capped count (TRIAL 1 / STARTER 2 / SERIOUS 5 / PRO unlimited); P3: team sharing (PRO).
**Edge:** profile deleted while default (fallback to first); marketplace switch mid-session (invalidates analysis cache keys).
**AC:** Zod-validated Json; every surface reads same schema; switching profile recomputes verdicts locally without re-fetch (calc is client-side).

## F-25 Chrome extension [MVP]
**What:** MV3. Modes:
1. **Amazon product page:** inject side panel = full panel stack (iframe app served from our domain; postMessage bridge for page context — isolates CSP, reuses web components).
2. **Amazon search/category pages:** per-result QuickView overlay chips (rank, BB, FBA/FBM counts, AMZ-on-listing, variation count, monthlySold, sparkline, verdict dot) via one `/quick-view` batch call per page; click → full panel.
3. **Any retail site:** toolbar action + context-menu "Analyze with SourceTool" on selection/link/product page → title/UPC extraction (structured data → og meta → heuristics) → `/search` resolve → panel with match-confidence + alternates picker.
**Edge:** Amazon DOM changes (selector registry w/ remote-config overrides — ship fixes without store review); logged-out (panel shows login iframe); SPA navigation (history API hooks); MV3 service-worker eviction (stateless workers, all state in storage.session); marketplace detection from domain.
**AC:** works on amazon.com/ca/co.uk product+search pages; retail resolve tested on top-20 US retail sites fixture set; overlay adds <150ms to page interactive; extension review-compliant (no remote code, declared hosts).

## F-26 Mobile scanning [MVP]
Spec in MOBILE_APP.md (Speed Mode, offline queue, share intake). AC there.

## F-27 AI image search [P3]
**What:** Photo → ASIN candidates. Impl: CLIP-style embedding of catalog images (start: embeddings for ASINs seen by our users; fallback: Amazon visual search is not officially available → confine to corpus + title OCR assist) → pgvector similarity.
**Edge:** no match ≥ threshold → return OCR'd title as search seed.
**AC:** top-3 hit rate ≥70% on 200-photo retail bench; response <3s.

## F-28 Auth, plans, billing [MVP]
**What:** Email+password (OAuth later), verified email required for trial start; Stripe subscriptions (STARTER $24.95 / SERIOUS $39.95 / PRO $69.95 mo — undercuts SellerAmp+Keepa combined ~$50; final pricing TBD, config-driven); lookup quotas per plan; device/session limits (TRIAL 2 / STARTER 2 / SERIOUS 5 / PRO 10); grace on payment failure (7d read-only).
**Edge:** downgrade with over-cap trackers/profiles (soft-lock extras, don't delete); trial abuse (device+email heuristics, defer hard controls).
**AC:** Stripe webhook state machine tested (trialing→active→past_due→canceled); quota enforcement race-safe (Redis INCR).

## F-29 Seller account connection [MVP]
**What:** SP-API OAuth (LWA) flow; store encrypted refresh token; health check (getMarketplaceParticipations) on connect + weekly; powers F-04, fee lookups, P3 inventory cross-check ("you already stock this").
**Edge:** OAuth denial/timeout; multi-marketplace seller (create per-mkt links); token revocation (status ERROR + re-auth CTA).
**AC:** connect flow <90s happy path; tokens never logged/returned; deletion purges tokens + caches.

## F-30 Data pipeline [MVP core]
**What:** IngestModule (Keepa client, token budget, csv→price_points mapper, provenance) + CollectorModule (SP-API refreshers by freshnessTier, category curve fitter, storefront/category sync jobs).
**Edge:** Keepa outage (serve stale + banner, queue updates); token exhaustion (priority queue: interactive > trackers > background backfill); mapper version bumps (reprocess from products.raw).
**AC:** ingest idempotent (ON CONFLICT DO NOTHING verified); every Keepa call in KeepaTokenLedger; collector lag dashboard; kill-switch env flag per source.
