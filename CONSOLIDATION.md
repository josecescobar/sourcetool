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
- **Stage 2 — Shared logic.** Move architecture-agnostic logic into packages:
  eBay fee calculator → `packages/shared` (or `apps/api`), deal-scoring math →
  `packages/ai`, plus the richer TypeScript types (`offers`, `batch`, `deal`,
  `fees`).
- **Stage 3 — Backend endpoints.** Add the capabilities the richer extension needs
  but the server doesn't have yet: image-based extraction (Claude), eBay fee
  endpoint, offers/variations on product lookup.
- **Stage 4 — Extension UI.** Rebuild the richer sidepanel in `apps/extension`
  (theming, tabbed UI, batch dropzone, charts) wired to the Stage 3 endpoints —
  not to direct third-party calls.
- **Stage 5 — Retire.** Once parity is reached, delete `selleramp-killer`.

## 7. End state

One repo — `sourcetool` — containing `apps/api`, `apps/web`, `apps/extension`,
`apps/marketing`, and shared packages. The other five repos deleted.
