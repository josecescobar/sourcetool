# CODEX_INSTRUCTIONS.md — Standing Rules for All Sessions

You are implementing SourceTool per the doc set: PROJECT_OVERVIEW, ARCHITECTURE, DATA_MODEL, API_SPEC, FRONTEND_WEB, MOBILE_APP, FEATURES, BUILD_PLAN. These docs are the source of truth. If code and docs conflict, flag it — don't silently diverge. If a doc under-specifies, choose the simplest option consistent with the doc's stated tradeoffs and record the decision in `docs/DECISIONS.md` (append-only log: date, decision, why).

## Session protocol
1. Start by restating which BUILD_PLAN session you're executing and its exit criteria.
2. Read the relevant docs sections + existing code in the modules you'll touch before writing anything.
3. Work in a branch-sized scope: one BUILD_PLAN session = one deliverable. Don't drift into adjacent sessions; note follow-ups in `docs/TODO.md` instead.
4. End with: how to run it, what was tested, any DECISIONS/TODO entries added.

## Repo & structure rules
- Monorepo layout exactly as ARCHITECTURE.md. New shared logic goes in `packages/*` only if ≥2 apps need it now — not speculatively.
- `packages/shared` and `packages/calc` stay pure: no IO, no framework imports, 100% unit-testable.
- `apps/*` never import from another app. `packages/*` never import from `apps/*`.
- NestJS: one module per ARCHITECTURE.md module map. Cross-module access ONLY through exported services. Prisma queries against another module's tables are a review-blocker.
- Time-series tables: raw SQL migrations (kept in Prisma migration files), accessed via typed repository classes using `$queryRaw` with tagged templates (never string-concatenated SQL).

## Code conventions
- TypeScript strict; no `any` (use `unknown` + narrowing); no `@ts-ignore` without a comment ticket.
- Validation at every boundary with Zod schemas from `packages/shared` — DTOs, env vars (validated at boot), queue payloads, webhook bodies. Internal code trusts typed data; boundaries never do.
- Errors: throw typed domain errors (`QuotaExceededError` etc.) mapped to API error codes in one exception filter. Never leak internals in messages. Every catch either handles meaningfully or rethrows with context — no swallowing.
- Money is integer cents everywhere. Marketplace is the smallint domainId everywhere. Keepa-minute conversion only in the ingest mapper — the rest of the codebase sees timestamptz/Date.
- Naming: tables snake_case, TS camelCase, enums SCREAMING_SNAKE in DB / PascalCase in TS. Endpoints and fields must match API_SPEC.md exactly — clients are generated from it.
- Comments explain *why*, not *what*. No dead code, no commented-out blocks, no TODO without a `docs/TODO.md` entry.
- Dependencies: prefer stdlib/platform; adding a dependency requires one-line justification in the PR description. No new state-management, ORM, or HTTP libs — the stack is chosen.

## Testing requirements (per session, non-negotiable)
- `packages/calc`: golden fixtures + property tests; any fee-table change needs a fixture proving it.
- Mappers (Keepa csv, SP-API payloads): fixture-based tests with real sanitized payloads committed under `__fixtures__/`.
- API: e2e (supertest) per new endpoint — happy path + auth + validation + quota/plan gate.
- Time-series queries: perf assertion tests against the seeded 5M-row dataset (fail if >2× budget).
- Web: Vitest for logic-bearing components; Playwright smoke stays green.
- Mobile: Jest for outbox/sync logic; calc parity fixture test (same fixtures as server).
- Never mock what you can run: use dockerized Postgres/Redis in tests, mock only third-party HTTP (nock/msw with recorded fixtures).

## Third-party discipline
- Keepa/SP-API/Stripe calls ONLY through their client wrappers (IngestModule.KeepaClient, SpApiClient, StripeService). Every Keepa call must pass TokenBudgetService and write KeepaTokenLedger. Direct fetch to third parties elsewhere is a review-blocker.
- Secrets via validated env only; never committed, never logged. LWA refresh tokens only touched by SellerLinkModule's crypto service.
- All external calls: timeout, retry w/ exponential backoff + jitter, circuit-breaker state logged. Degrade to partial responses (API_SPEC UNKNOWN semantics), never cascade failures into 500s.

## Performance budgets (enforced, not aspirational)
Analysis warm p95 <1.5s, cold <3s; chart history query <100ms; quick-view batch <400ms; finder <2s. If a session's change threatens a budget, measure and report before merging.

## Git & delivery
- Conventional commits (`feat(api): ...`, `fix(mobile): ...`). One session ≈ one PR.
- Migrations must apply to a fresh DB from zero (`pnpm db:reset` green) and be backward-compatible for one deploy (no drop-and-recreate on live tables; expand→migrate→contract).
- CI must be green (lint, typecheck, all tests, build all apps) before a session is "done". No skipped tests without a TODO entry.

## Session kickoff template (paste this to start each Codex session)
```
Project: SourceTool. Docs in /docs are source of truth.
Execute BUILD_PLAN.md session <N.N>: <title>.
Relevant docs: <list the 2–3 files/sections this session needs>.
Exit criteria: <copy from BUILD_PLAN + phase-wide requirements>.
Follow CODEX_INSTRUCTIONS.md session protocol. Restate scope, then begin.
```
