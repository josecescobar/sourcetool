# DATA_MODEL.md — SourceTool

Postgres 16 + TimescaleDB. Prisma manages OLTP tables; time-series tables are created/altered via raw SQL migrations (Prisma `migration.sql` files — keep them in the same migration history). Naming: snake_case tables/columns via `@@map`/`@map`; camelCase in Prisma client.

**Notation note:** Prisma blocks below marked `// pseudo-schema` use compressed one-line shorthand for brevity. Expand them into full valid Prisma models at implementation time (one field per line, explicit types/relations). All enums referenced (`Plan`, `DeviceType`, `SellerLinkStatus`, `ListKind`, `TrackDirection`, `RiskType`, `EligibilityStatus`) must be declared as Prisma `enum` blocks in `schema.prisma`.

## Conventions
- PKs: `id uuid default gen_random_uuid()` unless noted. Time-series tables use composite natural keys (no uuid — space matters at billions of rows).
- All money in **integer minor units** (cents) + currency inferred from marketplace. Matches Keepa convention; avoids float bugs.
- `marketplace smallint` everywhere = Keepa domainId (1=US, 2=UK, 3=DE, 4=FR, 5=JP, 6=CA, 8=IT, 9=ES, 10=IN, 11=MX, 12=BR). Never store the string.
- Timestamps `timestamptz`. Keepa minutes converted at ingest: `unix = (keepaMinute + 21564000) * 60`.
- `-1` sentinel from Keepa (no offer/OOS) → stored as `NULL`… **except** in `price_points.value` where we store `-1` as-is (see note there).

## Enum: price series
`packages/shared/src/series.ts` — single source of truth, mirrored as smallint in DB. **Deliberately identical to Keepa csv indices** so import is a pass-through and any Keepa doc maps 1:1:
```
0 AMAZON, 1 NEW, 2 USED, 3 SALES_RANK, 4 LIST_PRICE, 5 COLLECTIBLE, 6 REFURBISHED,
7 NEW_FBM_SHIPPING, 8 LIGHTNING_DEAL, 9 WAREHOUSE, 10 NEW_FBA, 11 COUNT_NEW,
12 COUNT_USED, 13 COUNT_REFURBISHED, 14 COUNT_COLLECTIBLE, 16 RATING, 17 COUNT_REVIEWS,
18 BUY_BOX_SHIPPING, 19-22 USED_* subconditions, 23-26 COLLECTIBLE_*, 27 REFURBISHED_SHIPPING,
28 EBAY_NEW_SHIPPING, 29 EBAY_USED_SHIPPING, 30 TRADE_IN, 31 RENT, 32 BUY_BOX_USED_SHIPPING,
33 PRIME_EXCL, 34 COUNT_NEW_FBA, 35 COUNT_NEW_FBM,
100 MONTHLY_SOLD  // our extension of the range; Keepa ships this outside csv
```

## Time-series tables (raw SQL, hypertables)

### price_points — the core table
One narrow table for ALL series (prices, rank, counts, rating). Chosen over per-series tables (36 tables = migration hell) and over wide rows (sparse series waste space; Keepa updates series independently).
```sql
CREATE TABLE price_points (
  asin        char(10)    NOT NULL,
  marketplace smallint    NOT NULL,
  series      smallint    NOT NULL,
  ts          timestamptz NOT NULL,
  value       integer     NOT NULL,  -- cents | rank | count | rating*10 | -1 = became unavailable
  source      smallint    NOT NULL DEFAULT 0,  -- 0=keepa, 1=collector, 2=extension
  PRIMARY KEY (asin, marketplace, series, ts)
);
SELECT create_hypertable('price_points', 'ts', chunk_time_interval => INTERVAL '30 days');
ALTER TABLE price_points SET (timescaledb.compress,
  timescaledb.compress_segmentby = 'asin, marketplace, series',
  timescaledb.compress_orderby   = 'ts');
SELECT add_compression_policy('price_points', INTERVAL '90 days');
```
- **`value = -1` is stored, not nulled**: history is event-sourced ("price became unavailable at ts") exactly like Keepa csv; charts need the gap boundaries. Stats queries filter `value >= 0`.
- Points are **change events**, not samples: a row exists only when the value changed (Keepa semantics). Chart rendering = step-after interpolation. This keeps 10 years of history to typically <5k rows/series/ASIN.
- Ingest is idempotent: `INSERT ... ON CONFLICT DO NOTHING` (PK dedupes re-imports).
- Scale math: 5M tracked ASINs × ~8 active series × ~1.5k events avg ≈ 60B rows worst case, but realistic v1 corpus (500k ASINs) ≈ 6B; compressed ~25 bytes/row ≈ manageable. Segment-by clause makes per-ASIN chart reads a single compressed batch scan.

**Continuous aggregates** (power stats + Finder without raw scans):
```sql
CREATE MATERIALIZED VIEW price_points_daily
WITH (timescaledb.continuous) AS
SELECT asin, marketplace, series,
       time_bucket('1 day', ts) AS day,
       min(value)  FILTER (WHERE value >= 0) AS min_v,
       max(value)  FILTER (WHERE value >= 0) AS max_v,
       last(value, ts) AS close_v,
       count(*) AS events
FROM price_points GROUP BY 1,2,3,4;
-- refresh policy: every hour, window 3 days
```

### buybox_events
Who held the buy box when (Keepa `buyBoxSellerIdHistory` + our collector observations).
```sql
CREATE TABLE buybox_events (
  asin char(10) NOT NULL, marketplace smallint NOT NULL,
  ts timestamptz NOT NULL,
  seller_id varchar(21),          -- NULL = no buy box / suppressed
  price integer, is_fba boolean, condition smallint DEFAULT 0,  -- 0=new
  source smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (asin, marketplace, ts, condition)
);
SELECT create_hypertable('buybox_events', 'ts', chunk_time_interval => INTERVAL '30 days');
-- same compression pattern, segmentby asin, marketplace
```
Buy-box stats (win %, winner count, avg price per seller over window) are computed on read with a windowed query over this table, cached 1h in Redis. No pre-aggregation until proven slow.

### offer_snapshots
Point-in-time live-offer captures (from Keepa `offers` param or collector Pricing API). Retained 180 days then dropped (retention policy) — history value is low, volume high.
```sql
CREATE TABLE offer_snapshots (
  asin char(10) NOT NULL, marketplace smallint NOT NULL,
  ts timestamptz NOT NULL, seller_id varchar(21) NOT NULL,
  condition smallint NOT NULL, price integer NOT NULL, shipping integer NOT NULL DEFAULT 0,
  is_fba boolean NOT NULL, is_prime boolean NOT NULL DEFAULT false,
  is_buybox boolean NOT NULL DEFAULT false, stock integer,          -- NULL = unknown
  seller_rating smallint, seller_rating_count integer,
  PRIMARY KEY (asin, marketplace, ts, seller_id, condition)
);
SELECT create_hypertable('offer_snapshots','ts', chunk_time_interval => INTERVAL '7 days');
SELECT add_retention_policy('offer_snapshots', INTERVAL '180 days');
```

### seller_rating_points
```sql
CREATE TABLE seller_rating_points (
  seller_id varchar(21) NOT NULL, marketplace smallint NOT NULL,
  ts timestamptz NOT NULL, rating_pct smallint, rating_count integer,
  PRIMARY KEY (seller_id, marketplace, ts)
);
SELECT create_hypertable('seller_rating_points','ts', chunk_time_interval => INTERVAL '90 days');
```

## OLTP tables (Prisma)

### products
```prisma
model Product {
  asin           String   @db.Char(10)
  marketplace    Int      @db.SmallInt
  title          String?
  brand          String?
  manufacturer   String?
  rootCategoryId BigInt?
  categoryTree   Json?          // [{id, name}] path
  imageUrls      String[]
  eans           String[]       // also UPCs; indexed for barcode lookup
  partNumber     String?
  packageDims    Json?          // {l,w,h,mm; weight g}
  itemDims       Json?
  variationCsv   Json?          // parent/child: parentAsin, variation attrs
  parentAsin     String?  @db.Char(10)
  isHazmat       Boolean  @default(false)
  isMeltable     Boolean  @default(false)
  isAdult        Boolean  @default(false)
  listedSince    DateTime?
  trackedSince   DateTime?      // Keepa trackedSince
  referralFeePct Decimal? @db.Decimal(5,2)
  fbaFeeCents    Int?           // pick&pack, cached
  monthlySold    Int?           // latest "bought in past month"
  lastKeepaSync  DateTime?
  lastCollectorSync DateTime?
  freshnessTier  Int      @default(2)  // 0=hot 1=warm 2=cold — drives collector cadence
  raw            Json?          // last full Keepa product blob (minus csv), for unmapped fields
  updatedAt      DateTime @updatedAt
  @@id([marketplace, asin])
  @@index([parentAsin, marketplace])
  @@index([eans], type: Gin)     // barcode → ASIN
  @@map("products")
}
```

### users & auth
```prisma
model User {
  id String @id @default(uuid())
  email String @unique
  passwordHash String
  emailVerifiedAt DateTime?
  plan Plan @default(TRIAL)          // TRIAL | STARTER | SERIOUS | PRO
  stripeCustomerId String? @unique
  lookupQuotaUsed Int @default(0)    // reconciled from Redis hourly
  quotaPeriodStart DateTime @default(now())
  defaultProfileId String?
  webhookUrl String?                 // PRO alert webhook (PUT /me/webhook)
  webhookSecretEnc Bytes?            // HMAC secret, encrypted
  createdAt DateTime @default(now())
  // relations: sessions, sellerAccounts, profiles, lists, trackers, lookups
}
model Session {  // device-scoped, mirrors SellerAmp device limits
  id String @id @default(uuid())
  userId String
  refreshTokenHash String
  deviceType DeviceType   // WEB | EXTENSION | MOBILE
  deviceName String?
  lastSeenAt DateTime
  expiresAt DateTime
  revokedAt DateTime?
  @@index([userId])
}
model SellerAccount {   // SP-API connection
  id String @id @default(uuid())
  userId String
  sellerId String                  // merchant token
  marketplace Int @db.SmallInt
  lwaRefreshTokenEnc Bytes         // AES-256-GCM
  status SellerLinkStatus          // ACTIVE | REVOKED | ERROR
  connectedAt DateTime @default(now())
  @@unique([userId, sellerId, marketplace])
}
```

### settings_profiles (buying criteria + cost assumptions + layout)
```prisma
model SettingsProfile {
  id String @id @default(uuid())
  userId String
  name String
  marketplace Int @db.SmallInt
  criteria Json      // {minProfitCents, minRoiPct, minBsr, maxBsr, minMonthlySales}
  costs Json         // {salesTaxPct, vatScheme, vatPct, prepFeeCents, inboundPerLbCents,
                     //  returnRatePct, laborCents, fulfilment: 'FBA'|'FBM', fbmCostCents,
                     //  storageMonths}
  panelLayout Json   // ordered [{panelId, visible}] per surface {web, ext, mobile}
  isDefault Boolean @default(false)
  @@unique([userId, name])
}
```
Criteria/costs as validated Json (Zod schema in packages/shared), not columns: fields evolve fast, are never queried relationally, and the calc engine consumes them as an object anyway.

### lookups (analysis history)
```prisma
model Lookup {
  id String @id @default(uuid())
  userId String
  asin String @db.Char(10)
  marketplace Int @db.SmallInt
  surface DeviceType
  sourceUrl String?          // retail page / amazon url the lookup came from
  costPriceCents Int?
  salePriceCents Int?
  verdict Json               // {profit, roi, maxCost, eligible, flags[]} snapshot
  createdAt DateTime @default(now())
  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, asin, marketplace])
}
```

### lists / items / notes / tags
```prisma
// pseudo-schema — expand per notation note
model List { id, userId, name, kind ListKind /* BUY | WATCH | CUSTOM */, createdAt }
model ListItem {
  id, listId, asin, marketplace,
  costPriceCents Int?, salePriceCents Int?, qty Int @default(1),
  snapshot Json,          // verdict at add-time
  position Int, createdAt
  @@unique([listId, asin, marketplace])
}
model Note { id, userId, asin, marketplace, body String, createdAt }  // multiple per asin
model Tag  { id, userId, name @@unique([userId, name]) }
model AsinTag { userId, asin, marketplace, tagId @@id([userId, asin, marketplace, tagId]) }
```

### trackers & notifications
```prisma
// Notification/PushToken are pseudo-schema — expand per notation note
model Tracker {
  id String @id @default(uuid())
  userId String
  asin String @db.Char(10)
  marketplace Int @db.SmallInt
  series Int @db.SmallInt         // PriceSeries enum
  direction TrackDirection        // BELOW | ABOVE | BACK_IN_STOCK
  thresholdValue Int?             // cents or rank; NULL for BACK_IN_STOCK
  sellerScope String?             // NULL=any, 'AMZ', or specific sellerId
  channels String[]               // email | push | webhook
  expiresAt DateTime?
  lastFiredAt DateTime?           // debounce: min 1h between fires
  active Boolean @default(true)
  @@index([asin, marketplace, active])   // alert evaluator entry point
  @@index([userId])
}
model Notification {
  id, userId, trackerId?, kind, payload Json,
  channels String[],   // email|push|webhook
  deliveredAt DateTime?, createdAt
}
model PushToken { id, userId, expoToken String @unique, platform, createdAt }
```

### risk data
```prisma
model BrandRisk {         // IP-complaint / PL database, imported + community-fed
  id String @id @default(uuid())
  marketplace Int @db.SmallInt
  brand String
  riskType RiskType       // IP_COMPLAINT | PRIVATE_LABEL | KNOWN_GATED
  severity Int            // 1-3
  source String           // import batch / report origin
  notes String?
  @@unique([marketplace, brand, riskType])
  @@index([brand])
}
model EligibilityCache {  // per seller-account restriction results
  sellerAccountId String
  asin String @db.Char(10)
  marketplace Int @db.SmallInt
  status EligibilityStatus  // ELIGIBLE | APPROVAL_REQUIRED | NOT_ELIGIBLE | UNKNOWN
  reasons Json?
  checkedAt DateTime
  @@id([sellerAccountId, asin, marketplace])   // TTL 7d enforced in service
}
```

### sellers, categories, ingest state
```prisma
// StorefrontAsin/KeepaTokenLedger/CollectorRun are pseudo-schema — expand per notation note
model Seller {
  sellerId String @db.VarChar(21)
  marketplace Int @db.SmallInt
  name String?
  isScammer Boolean @default(false)
  hasFba Boolean?
  shipsFromChina Boolean?
  currentRatingPct Int?
  currentRatingCount Int?
  storefrontSyncedAt DateTime?
  raw Json?
  @@id([marketplace, sellerId])
}
model StorefrontAsin { marketplace, sellerId, asin, lastSeenAt @@id([marketplace, sellerId, asin]) }
model Category {
  id BigInt              // Amazon browse node id
  marketplace Int @db.SmallInt
  name String
  parentId BigInt?
  productCount Int?
  @@id([marketplace, id])
  @@index([marketplace, parentId])
}
model KeepaTokenLedger { id, ts, endpoint, tokensSpent Int, context String }  // burn analytics
model CollectorRun { id, queue, asinCount, startedAt, finishedAt, errors Json? }
```

## Sales estimation storage
No table. Estimate = pure function (packages/calc `estimateMonthlySales`) over: (a) rank-drop count from `price_points` series 3 (30/90d, via daily aggregate), (b) `products.monthlySold` when present, (c) category-level BSR→sales curve coefficients:
```prisma
model CategorySalesCurve {
  marketplace Int @db.SmallInt
  rootCategoryId BigInt
  coefficients Json      // piecewise log-log fit params + version
  sampleSize Int
  fittedAt DateTime
  @@id([marketplace, rootCategoryId])
  @@map("category_sales_curves")
}
```
Recomputed monthly by a worker from observed monthlySold-vs-rank pairs across the corpus. This curve table is our own moat data; seed v1 with published community curve approximations.

## Indexing summary (hot paths)
| Query | Index |
|---|---|
| Chart read: one ASIN, N series, time range | `price_points` PK (asin, marketplace, series, ts) + compression segmentby — sequential batch |
| Barcode → product | GIN on `products.eans` |
| Alert evaluation on ingest | `Tracker(asin, marketplace, active)` |
| Analysis history screen | `Lookup(userId, createdAt DESC)` |
| Finder (Phase 2) | Dedicated `product_stats` table (below). Finder never touches hypertables directly. |

### product_stats (Finder backing table, Phase 2)
One row per (marketplace, asin); refreshed incrementally by a worker from continuous aggregates + products. Plain table (not a materialized view — incremental upserts, partial refresh by freshness).
```sql
CREATE TABLE product_stats (
  marketplace smallint NOT NULL, asin char(10) NOT NULL,
  root_category_id bigint, brand text, title_tsv tsvector,
  -- per key series s ∈ {buybox(18), amazon(0), new(1), fba(10), fbm(7), rank(3), used(2), list(4)}:
  --   {s}_current int, {s}_avg30 int, {s}_avg90 int, {s}_avg180 int, {s}_avg365 int,
  --   {s}_drop30_pct smallint, {s}_drop90_pct smallint   (generate columns from this template)
  rank_drops30 int, rank_drops90 int, rank_drops180 int, rank_drops365 int,
  oos90_amazon_pct smallint, oos90_buybox_pct smallint,
  bb_seller_type smallint,        -- 0=none 1=amazon 2=3p_fba 3=3p_fbm
  bb_winner_count90 smallint, bb_amazon_pct90 smallint,
  offer_count_new int, offer_count_fba int, offer_count_fbm int,
  monthly_sold int, monthly_sold_chg90_pct smallint,
  review_count int, rating smallint,
  is_hazmat bool, is_meltable bool, is_adult bool, is_variation bool,
  weight_g int, listed_since timestamptz, updated_at timestamptz NOT NULL,
  PRIMARY KEY (marketplace, asin)
);
CREATE INDEX ON product_stats (marketplace, root_category_id, rank_3_current);
CREATE INDEX ON product_stats (marketplace, bb_seller_type, rank_3_current);
CREATE INDEX ON product_stats USING gin (title_tsv);
-- + partial indexes for common filter combos, added when query patterns are known
```
`FinderFilters` (API_SPEC) maps 1:1 to these columns: every range filter = a column pair, every switch = a bool column.

## Migration & retention policy summary
- Compression after 90d (price_points, buybox_events); retention drop: offer_snapshots 180d only.
- `products.raw` Json trimmed of csv arrays before store (history lives in hypertables only — no duplication).
- Backups: nightly pg_dump of OLTP + weekly full base backup; hypertable chunks are append-mostly so incremental WAL archiving is cheap.
