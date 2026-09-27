# API_SPEC.md — SourceTool REST API

Base: `https://api.sourcetool.app/v1`. JSON only. All endpoints auth-required unless marked `[public]`. OpenAPI generated from NestJS decorators + Zod DTOs (`@anatine/zod-nestjs`); the OpenAPI doc feeds `packages/api-client` codegen — clients never hand-write fetch calls.

## Conventions
- Auth: `Authorization: Bearer <accessJWT>` (15 min). Refresh via `/auth/refresh`.
- Path params: `{mkt}` = Keepa domainId int (1=US, 6=CA, 2=UK); `{asin}` = 10-char.
- Money: integer cents. Timestamps: ISO-8601 UTC.
- Pagination: cursor-based — `?cursor=&limit=` → `{ items, nextCursor }`. Never offset.
- Errors: `{ error: { code: string, message: string, details? } }` with proper HTTP status. Stable machine codes: `QUOTA_EXCEEDED`, `NOT_ELIGIBLE_PLAN`, `SELLER_LINK_REQUIRED`, `ASIN_NOT_FOUND`, `UPSTREAM_TIMEOUT`, `VALIDATION`, `RATE_LIMITED`.
- Idempotency: mutating POSTs accept `Idempotency-Key` header (stored 24h in Redis).
- Versioning: URL major version only. Additive changes don't bump.

## Rate limits & metering
- Global per-user: 60 req/min (burst 120 for `/quick-view` batch). Headers: `X-RateLimit-Remaining`, `Retry-After`.
- **Lookup metering**: `GET .../analysis` decrements plan quota (one charge per distinct ASIN per rolling hour per user). `429 QUOTA_EXCEEDED` includes `{quotaResetAt}`. Non-analysis reads (charts of already-analyzed ASINs, lists, history) are free.
- Plans: TRIAL (14d, 300 lookups), STARTER (1,000/mo), SERIOUS (unlimited, fair-use 300/day), PRO (unlimited + team).

## Auth
```
POST /auth/register            {email, password} → 201 {user} (+verification email)
POST /auth/login               {email, password, deviceType, deviceName?} → {access, refresh, user}
POST /auth/refresh             {refresh} → {access, refresh}   // rotation + reuse detection → revoke family
POST /auth/logout              {refresh} → 204
POST /auth/forgot / /auth/reset-password
GET  /me                       → {user, plan, quota: {used, limit, resetAt}, sellerAccounts[], defaultProfileId}
GET  /me/sessions              → device list; DELETE /me/sessions/{id}  // device-limit management
```

## Seller account link (SP-API OAuth)
```
GET  /seller-link/authorize?marketplace=1   → {redirectUrl}   // Amazon consent page (LWA, our app id)
GET  /seller-link/callback?spapi_oauth_code=&state=           [public, signed state] → redirects to app
GET  /seller-link                → SellerAccount[]
DELETE /seller-link/{id}         → 204 (revoke + purge eligibility cache)
```

## Core analysis (the endpoint)
```
GET /products/{mkt}/{asin}/analysis?profileId=&cost=&sale=&fresh=0|1
```
`fresh=1` forces Keepa update (costs extra internal tokens; PRO only, rate-limited 10/hr).
Response (composite; every panel reads from this one payload):
```jsonc
{
  "product": { "asin","title","brand","imageUrls","categoryTree","eans","parentAsin",
               "dims","weightG","isHazmat","isMeltable","isAdult","listedSince","monthlySold" },
  "pricing": { "buyBox": 1899, "amazon": null, "lowestFba": 1950, "lowestFbm": 1780,
               "listPrice": 2499, "offerCounts": {"new":14,"fba":6,"fbm":8,"used":2},
               "amazonOnListing": false, "buyBoxSuppressed": false },
  "stats":   { "windows": {"30":{...},"90":{...},"180":{...},"365":{...}},   // min/max/avg per series
               "rankDrops": {"30":42,"90":118}, "oosPct90": {"amazon":100,"buyBox":2} },
  "salesEstimate": { "monthly": 85, "method": "rank_curve|monthly_sold|blend", "confidence": "high|med|low",
                     "timeToSellDays": 11, "sharedRank": false },
  "calc":    { /* CalcResult — see /calc below; computed with profile defaults + query cost/sale */ },
  "eligibility": { "status": "ELIGIBLE|APPROVAL_REQUIRED|NOT_ELIGIBLE|NO_SELLER_LINK|UNKNOWN",
                   "reasons": [], "checkedAt": "..." },
  "riskFlags": [ {"type":"IP_COMPLAINT","severity":3,"detail":"Brand X: 4 reports"},
                 {"type":"PRIVATE_LABEL","severity":2}, {"type":"MELTABLE"}, {"type":"SIZE_OVERSIZED"} ],
  "verdict": { "pass": true, "failed": [], "colors": {"profit":"green","roi":"green","bsr":"amber"} },
  "variations": { "parentAsin": "...", "count": 6, "items": [{asin, attrs, buyBox, rank}] },
  "meta": { "dataAge": {"keepa": "2026-08-04T10:11:00Z", "collector": null}, "lookupCharged": true }
}
```
Latency budget: warm (DB-served) p95 <1.5s; cold (Keepa fetch) p95 <3s. Enrichments (fees, eligibility, risk) run in parallel with 800ms per-branch timeout → partial response with `"status":"UNKNOWN"` rather than blocking.

## Product data
```
GET /products/{mkt}/{asin}                     → product metadata only (free)
GET /products/{mkt}/{asin}/history?series=0,1,3,18&range=1d|7d|30d|90d|180d|365d|all&agg=raw|daily
     // canonical range enum — all clients map UI buttons (1d/1w/1m/3m/6m/1y/all) to these values;
     // server auto-selects agg=daily for range ≥180d unless agg=raw forced (PRO)
     → { "series": { "0": [[tsSec,value],...], ... } }   // step-after; -1 = gap start
GET /products/{mkt}/{asin}/offers              → live offer list (per-seller stock, profit-if-matched given profileId)
GET /products/{mkt}/{asin}/buybox?range=90d    → { current, sellers: [{sellerId,name,winPct,avgPrice,lastSeen,isFba,stock}], winnerCount, stdDev }
GET /products/{mkt}/{asin}/variations
GET /products/{mkt}/{asin}/ebay                → eBay comparison series (Phase 3)
POST /products/{mkt}/{asin}/notes  {body} ; GET/DELETE same
PUT  /products/{mkt}/{asin}/tags   {tagIds[]}
GET  /products/{mkt}/{asin}/lookup-history     → my prior lookups of this ASIN
```

## Search & resolve
```
GET /search?mkt=1&q=term|ASIN|EAN|UPC|amazon-url&limit=10
     → [{asin, title, image, buyBox, rank, isVariationParent}]
     // resolve order: ASIN regex → EAN/UPC (products.eans GIN, fallback Keepa code lookup) → term search (Keepa /search)
POST /resolve/url        {url}   → {asin?, mkt?}          // parse any Amazon URL incl. shortlinks
POST /resolve/image      multipart {image} → [{asin, confidence}]   // Phase 3: embeddings match
POST /quick-view         {mkt, asins: [..≤24], profileId?} → per-ASIN mini payload {rank, buyBox, fbaCount, fbmCount,
                          amazonOnListing, variationCount, monthlySold, sparkline90d,
                          verdict: "green"|"amber"|"red"|null}   // server-computed vs profile criteria (BSR/price checks only — no cost known); null when no profile
     // powers extension search-results overlay; metered as 1 lookup per 24-batch
```

## Calculator (pure, free, no ASIN required)
```
POST /calc     { mkt, input: CalcInput } → CalcResult
CalcInput  = { costCents, saleCents, fulfilment: "FBA"|"FBM", fbmShipCents?, weightG?, dims?,
               referralFeePct?, fbaFeeCents?,          // omitted → looked up for asin
               asin?,                                   // triggers fee lookup via SP-API/cache
               storageMonths, prepFeeCents, inboundPerLbCents, laborCents,
               returnRatePct, salesTaxPct, vat?: {scheme, ratePct, onCost, onSale},
               discount?: {kind:"pct"|"coupon"|"multibuy", value, bulkQty?} }
CalcResult = { profitCents, roiPct, marginPct, breakevenCents, maxCostCents,
               payoutCents, fees: {referral, fbaFulfil, storage, closing, total}, vatCents?, warnings[] }
```
Implementation note: this endpoint wraps `packages/calc` — the identical pure function bundled into all clients for offline/instant recompute. Server call needed only when fee lookup by ASIN is required.

## Eligibility & risk
```
GET  /eligibility/{mkt}/{asin}?sellerAccountId=   → cached (7d TTL) or live getListingsRestrictions
POST /eligibility/batch   {mkt, asins[≤50], sellerAccountId}  → map (Phase 2; SP-API rate-aware queue, returns 202 + poll token when large)
GET  /risk/brand?mkt=&brand=                      → BrandRisk[]
POST /risk/report         {mkt, brand, riskType, notes}  → community report (moderated)
```

## Trackers & alerts
```
POST   /trackers        {mkt, asin, series, direction, thresholdValue?, sellerScope?, expiresAt?, channels[]}
GET    /trackers?cursor=            → paginated w/ current value vs threshold
PATCH  /trackers/{id}   ; DELETE /trackers/{id}
POST   /trackers/import {mkt, items:[{asin, thresholdValue, series}]}   // bulk ≤500
GET    /notifications?cursor=       ; POST /notifications/read {ids[]}
PUT    /me/push-tokens  {expoToken, platform}
PUT    /me/webhook      {url, secret}            // HMAC-signed POSTs on alert fire (PRO)
```

## Finder, deals, sellers (Phase 2–3)
```
POST /finder/query      { mkt, filters: FinderFilters, sort, cursor, limit≤100 } → rows from product_stats
     // FinderFilters mirrors DATA_MODEL product_stats columns: ranges on current/avg30/avg90/avg365/dropPct
     // per series, rootCategoryId, bbSellerType, oosPct, reviewCount, rating, monthlySold, hazmat, etc.
POST /finder/ai         { mkt, prompt } → { filters: FinderFilters, explanation }   // LLM compile, user confirms before /finder/query
POST /finder/saved      CRUD + {schedule: "daily"|null} → feeds watchlist alerts
GET  /deals?mkt=&priceTypes=&dropPct=&range=day|week|month&category=&cursor=
POST /viewer/batch      { mkt, asins[≤10000] } → 202 {jobId}; GET /viewer/batch/{jobId} → rows | csvUrl
GET  /sellers/{mkt}/{sellerId}            → profile + rating history + BB stats
GET  /sellers/{mkt}/{sellerId}/storefront?cursor=   → ASIN list w/ mini stats
GET  /categories/{mkt}?parentId=          → tree children + product counts
GET  /bestsellers/{mkt}/{categoryId}?basis=current|avg30|avg90
```

## Lists & export
```
POST /lists {name, kind} ; GET /lists ; PATCH/DELETE /lists/{id}
POST /lists/{id}/items   {mkt, asin, costCents?, saleCents?, qty}   // snapshot captured server-side
PATCH/DELETE /lists/{id}/items/{itemId}
POST /lists/{id}/export  {format: "csv"|"sheets", fields[]?, sheetId?} → 202 {jobId} → notification w/ url
GET  /lookups?cursor=&q=&tag=            → analysis history
```

## Settings profiles
```
GET/POST /profiles ; PATCH/DELETE /profiles/{id} ; POST /profiles/{id}/set-default
```
Profile Json bodies validated by Zod schemas from packages/shared (single source with clients).

## Billing
```
POST /billing/checkout {plan, interval} → {stripeUrl}
POST /billing/portal → {stripeUrl}
POST /webhooks/stripe   [public, sig-verified] — sync plan/status
```

## Third-party integration policies
**Keepa (licensed data source)** — server-side only, key never leaves backend. Wrapper: `IngestModule/KeepaClient` with typed methods `getProducts(asins, opts)`, `update(asin)`, `search(term)`, `getSeller`, `query(finderSelection)`, `getDeals(dealRequest)`, `getBestSellers(categoryId)`, `getCategory(id|parents)`. All calls pass through TokenBudgetService (Redis bucket mirroring plan refill; queue + backoff on empty; every call logged to KeepaTokenLedger). Response csv arrays → `price_points` rows via pure mapper (unit-tested against fixture blobs). Licensing guardrail: no endpoint exposes raw bulk Keepa data; users get derived analysis, charts, and their own exports.

**Amazon SP-API** — LWA client-credentials for app-level calls; per-user tokens via seller link. Used endpoints: `getMyFeesEstimateForASIN` (fees), `getListingsRestrictions` (eligibility), `getCatalogItem` (attributes/rank), `getItemOffersBatch` (collector pricing), `getMarketplaceParticipations` (link validation). Respect per-endpoint rate plans; per-seller token buckets; exponential backoff on 429; all collector traffic uses our own seller credentials where user link not required.

**Stripe** — subscriptions; usage records only if we later meter overage.
