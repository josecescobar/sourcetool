# Repo Consolidation Plan

Review date: 2026-06-14. Owner: Juggernaut Resellers LLC.

This document records a review of the six Amazon-seller repositories under
`josecescobar/*` and the plan to consolidate them down to one.

## 1. Inventory & verdicts

All six repos are the same idea — an Amazon FBA sourcing / "SellerAmp replacement"
tool — attempted across three generations.

| Repo | What it is | Last activity | Verdict |
|------|-----------|--------------|---------|
| **sourcetool** | Full Turborepo monorepo: NestJS API (15 modules, 22 Prisma models), Next.js dashboard (`apps/web`), MV3 extension (`apps/extension`), `ai`/`db`/`shared`/`ui` packages. Real backend, auth, teams, Stripe billing. | 2026-02-16 | **KEEP — canonical** |
| **selleramp-killer** | Standalone MV3 extension (7,021 LOC, vite/Preact) that calls Rainforest/Keepa/Claude directly + a Next.js marketing website (5,798 LOC). More features, more recent, no backend. | 2026-06-11 | **HARVEST then retire** |
| **selleramp-killer-2** | 2-commit "Phase 1" stub of the same extension; superseded by selleramp-killer. | 2026-02-15 | **DELETE** |
| **AmazonSellerTool** | Only `backend/package.json` (Express+axios+redis). No source. | 2024-12-18 | **DELETE** |
| **seller-analysis-api** | Only a README (Express+MongoDB+JWT plan). No code. | 2024-12-18 | **DELETE** |
| **amazon-seller-dashboard** | Empty repo, zero commits. | — | **DELETE** |

The four DELETE repos hold no recoverable work. Deleting handled by owner via
GitHub Settings → Danger Zone.

## 2. The core finding: two architectures, not one

`sourcetool/apps/extension` and `selleramp-killer` look like duplicates but are
opposite designs:

- **sourcetool extension** is a *thin client*. `background/api-client.ts` talks to
  the NestJS API at `/api/*`; API keys, analysis, scoring, history, alerts, and
  billing all live server-side. Auth is JWT via the backend.
- **selleramp-killer** is *standalone*. It ships `rainforest-client`, `keepa`,
  `claude-client`, `fees/calculator`, `scoring/deal-scorer`, and
  `alerts/alert-generator` **inside the extension** and calls third-party APIs
  directly with user-supplied keys (`ApiKeySetup` → `chrome.storage`).

Consequence: porting a selleramp-killer feature into sourcetool means **replacing
its direct third-party API calls with calls to sourcetool's `ApiClient` →
backend**, and adding any missing backend endpoints. It is a feature migration
with architecture reconciliation, not a file copy.

## 3. What selleramp-killer has that sourcetool lacks

Worth harvesting (in rough value order):

1. **Marketing website** — `website/app/{page,features,faq,about,contact,privacy,terms,changelog,login,signup}` + components (`Hero`, `Features`, `Platforms`, `HowItWorks`, `FaqAccordion`, `Navbar`, `Footer`). Net-new, no backend coupling → cleanest win.
2. **Image / batch extraction via Claude** — `shared/batch/{image-prep,orchestrator,resolver}`, `shared/extraction/{claude-client,prompt,parse}`, sidepanel `batch/{BatchScreen,BatchRow,Dropzone}`, `hooks/useBatchJob`. (sourcetool has CSV `bulk-scan` on the backend but no image extraction.)
3. **eBay support in-extension** — `shared/fees/ebay-calculator`, sidepanel `tabs/EbayTab`.
4. **Offers & Variations** — `tabs/OffersTab`, `components/OfferRow`, `shared/components/VariationsTable`, `types/offers`.
5. **Theming** — `sidepanel/theme/{ThemeContext,tokens}` (light/dark design tokens).
6. **Richer charts** — `PriceHistoryChart`, `MiniChart`, `HistoryChart`.

## 4. What sourcetool has that selleramp-killer lacks

Keep these (do not regress): backend auth (`LoginForm`, JWT refresh), server buy
lists (`AddToBuyList`), backend AI verdict, Walmart scraper, server-backed
history/alerts, teams, Stripe billing, Prisma DB.

## 5. Website overlap

- `selleramp-killer/website` = marketing pages (additive) + a **mock** dashboard
  (history/batch/integrations/result/settings/sheets/account on `mock-data`).
- `sourcetool/apps/web` = the **real** backend-wired dashboard.

→ Harvest the **marketing pages** into a new `apps/marketing` (or marketing routes
in `apps/web`). Discard the mock dashboard — `apps/web` already does it for real.

## 6. Staged migration plan

- **Stage 1 — Marketing site (low risk, high value). ✅ DONE.** Brought
  selleramp-killer's marketing pages into `apps/marketing` (Next 15, Tailwind v4,
  self-contained). Dropped the mock dashboard; repointed login/signup/Navbar to
  the real app via `NEXT_PUBLIC_APP_URL` (`lib/app-url.ts`). `next build` passes
  — 13 static routes. Remaining cleanup: drop `selleramp-killer/website` at Stage 5.
- **Stage 2 — Shared logic. ⚠️ MOSTLY REDUNDANT (skipped).** Investigation
  showed sourcetool already supersedes selleramp-killer's shared logic:
  `apps/api/.../analysis/calculators` has table-driven Amazon FBA/FBM, **eBay**,
  and Walmart calculators + fee tables; `packages/ai` has AI deal-scoring,
  sell-through prediction, and verdict generation; `packages/shared` has the
  product/analysis/ai/marketplace types. selleramp-killer's versions are simpler
  client-side reimplementations — porting them would regress quality. **Nothing
  to move.** The only true gap is image extraction (Stage 3).
- **Stage 3 — Image/batch extraction (the one real feature gap). ✅ BACKEND DONE.**
  sourcetool's `bulk-scan` was CSV-only with no vision. Ported selleramp-killer's
  Claude-vision extraction server-side:
  - `packages/shared/src/types/extraction.types.ts` — `ExtractionResult`,
    `ImageExtractionInput`, `IdentifierKind` (shared across api/web/extension).
  - `packages/ai` — `EXTRACTION_SYSTEM_PROMPT` + `extractProductFromImage()` /
    `parseExtractionJson()`, using the existing Anthropic provider (server holds
    the key; Claude Haiku vision).
  - `apps/api` — `POST /ai/extract-image` (`{ base64, mediaType }` →
    `ExtractionResult`) behind the existing auth/team/plan guards.
  - Verified: `pnpm typecheck` passes for `shared`, `ai`, `api`.
  Remaining (Stage 4): client-side image resize (`prepareImage`, canvas) + the
  upload UI, then feed the result into the existing lookup/analysis pipeline.
- **Stage 4 — Image-scan UI + extension polish. ✅ DONE.**
  - **Web** (`apps/web`): `lib/image-prep.ts` (canvas resize → base64) +
    `components/scan-image-button.tsx`, wired into the Product Lookup page. A
    "Scan image" button next to Search runs `/ai/extract-image`, then looks up
    the detected identifier and prefills the buy price from the read retail
    price (mirrors SellerAmp's scan → cost flow). `pnpm typecheck` green.
  - **Extension** (`apps/extension`): `lib/image-prep.ts`, `ScanButton`, and a
    new `EXTRACT_IMAGE` background route; scan available in the empty state and
    the top bar (scan → `PRODUCT_DETECTED` → panel updates). Added a **dark
    theme** (`.dark` CSS vars + `ThemeToggle`, persisted to `chrome.storage`),
    closing the theming gap vs selleramp-killer. `webpack` build succeeds.
  - Note: `apps/web` `next build` can't run in the offline sandbox (next/font
    can't fetch Inter from Google Fonts) — unrelated to these changes; typecheck
    passes. The richer charts/offers/batch UI remain in §8 backlog.
- **Stage 5 — Retire `selleramp-killer`.** Everything unique is now in
  sourcetool: marketing (`apps/marketing`), image extraction (api + both UIs),
  and the feature backlog (§8). Safe to delete `selleramp-killer` — the last of
  the six repos to retire, leaving `sourcetool` as the single repo.

## 7. End state

One repo — `sourcetool` — containing `apps/api`, `apps/web`, `apps/extension`,
`apps/marketing`, and shared packages. The other five repos deleted.

## 8. Competitive parity: SellerAmp SAS (the tool we're replacing)

Mapped from screenshots of the SellerAmp SAS iOS app (v1.82i) provided by the
owner. SourceTool's job is to match/beat these surfaces.

| SellerAmp surface | What it does | SourceTool status |
|------|------|------|
| Barcode scan / camera | Scan UPC/EAN off shelf or packaging | ⚠️ Image extraction backend done (Stage 3); camera/upload UI = Stage 4 |
| Speed Mode | Rapid multi-barcode scan, key data fast, "Full Analysis" on demand | ❌ Not built — **backlog** |
| Text search / Share-menu | Look up by ASIN/UPC/EAN/keyword | ✅ Product lookup (3-provider chain) |
| History | All past lookups, grouped by ASIN, filterable | ✅ `history` module + `saved-searches` |
| Quick Info | BSR, Est. Sales, Max Cost at a glance | ✅ analysis + ai (sell-through) |
| Profit Calculator | Cost/Sale, FBA·FBM, storage months, fees, ROI, breakeven, margin, est. payout | ✅ `analysis` engine + calculators |
| Alerts panel | Buy Box share, Private Label, IP, Size, Meltable, Low-Price-Fee, Variations count | ⚠️ Partial — `alerts`/`product-watches` exist; some flags (IP, meltable, PL, variations count) are **backlog** |
| Offers | Live offers table: Seller/Stock/Price/Profit/ROI, FBA vs SFP | ⚠️ `OfferHistory` model + history; dedicated offers table UI = backlog |
| Charts | Amazon/FBA/FBM/Buy Box price, Sales Rank, Offer Count/Rating/Review, range toggles | ✅ web dashboard (Recharts) + Keepa data; extension charts = Stage 4 |
| Ranks & Prices | BSR top %, lowest FBA/FBM, Keepa BSR drops, BB price changes, est. time-to-sale | ⚠️ Mostly covered by history/analysis; "Keepa BSR drops" / "time-to-sale" = backlog |
| Profiles (×5) + Buying Criteria | Per-profile thresholds (Min/Max BSR, Min profit, Min ROI), additional costs, default time frames, fulfilment (FBA/FBM, EFN/Pan-EU), VAT | ⚠️ `settings`/`teams` exist; **profile-based buying-criteria schema is a notable gap → backlog** |
| Notes & Tags | Per-product notes/tags | ❌ Backlog (small) |
| Discount chips | 5–50% / 3-for-2 quick cost adjusters | ❌ Backlog (small) |
| Google Sheets export | Push lookups to a sheet | ❌ Backlog; sourcetool has CSV/PDF export instead |
| Seller Central actions | Add Product / Inventory / Orders shortcuts | ❌ Backlog (SP-API write actions) |

**Keepa** (separate reference app shown): the price/BSR **data layer** — already
integrated as a provider and powers history charts. Its **Product Finder**
(filter-based product *discovery* by BSR/price/category/rank-drops) is a flow
SourceTool does **not** have — a potential net-new "discovery" module (backlog).

### Backlog distilled (post-consolidation feature ideas)

1. Speed Mode — rapid multi-scan with deferred full analysis.
2. Profile-based buying criteria (the engine behind Max Cost / deal verdicts).
3. Richer alert flags: IP/meltable/private-label/variations-count.
4. Offers table UI (FBA vs SFP) in extension + web.
5. Keepa-style Product Finder (discovery by filters).
6. Notes & tags, discount chips, Google Sheets export, Seller Central actions.
7. Dark theme for `apps/extension` (selleramp-killer already had `ThemeContext`).

These are **enhancements beyond consolidation** — tracked here so the SellerAmp
screenshots aren't lost, but not required to retire `selleramp-killer`.
