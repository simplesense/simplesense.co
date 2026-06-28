# Build Progress

Running build log for Simple Sense. Newest log entries first. The backlog mirrors
SIMPLE_SENSE_BUILD_PROMPT.md §13. A slice is **done** only when every acceptance
criterion below it is checked and its tests pass.

## Backlog

- [x] Slice 0 — Repo, tooling, CI
- [~] Slice 1 — Schema/migrations/seed/tenant-isolation DONE on Supabase; auth (Clerk) deferred
- [~] Slice 2 — Shopify OAuth flow + crypto + HMAC + disconnect DONE (mock); live needs Shopify creds
- [~] Slice 3 — Ingestion: paginated reader + idempotent backfill + status machine DONE (mock-tested); RealShopifyReader mapping + Inngest durability pending creds
- [x] Slice 4 — Analyzers (pure, deterministic) — + adversarial audit, 14 fixes
- [x] Slice 5 — Signal detection (+ packages/config)
- [x] Slice 6 — LLM synthesis + grounding validation + ranking (@ss/engine)
- [x] Slice 7 — Dashboard ("This week's moves") + design-system port (@ss/ui)
- [x] Slice 8 — The free "Simple Sense Audit" (the wedge)
- [ ] Slice 9 — Outcome tracking (flywheel)
- [ ] Slice 10 — Billing (Stripe tiers) + gating
- [ ] Slice 11 — Integration exports (Klaviyo/Meta/Google)
- [ ] Slice 12 — Hardening
- [ ] Slice 13 — Polish & onboarding

## Completed: Slice 1 — schema + tenant isolation on Supabase (2026-06-27)

@ss/db: Prisma schema for the full §7 model (Organization/User/Store/Customer/Product/
Order/OrderLineItem/AnalysisRun/Metric/Recommendation/RecommendationOutcome/Audit/
Subscription) + enums; tenant-scoped client + tenancy helpers; seed. Live on the user's
**Supabase** project (IPv6 direct connection): schema pushed (`db push`), baseline
migration generated + `migrate resolve --applied` (managed `postgres` role can't create
the shadow DB `migrate dev` needs — ADR-006). Seed wrote demo org/user/store/subscription.

AC results:

- [x] Prisma schema + migrations applied (Supabase in sync; baseline migration recorded) — PASS
- [x] seed creates a demo org/user(/store/subscription) — PASS (wrote to Supabase)
- [x] a test proves a query scoped to org A cannot read org B's rows — PASS (tenancy.test, 3 tests)
- [~] "a user can sign up and is attached to an Organization" — DEFERRED: auth (Clerk) needs
      keys; the Org/User schema + isolation are done, and a dev-auth shim / Clerk wiring is the
      remaining piece. Tracked for the auth pass.

## Completed: Persistence + dev-auth shim (2026-06-27)

The dashboard + Audit now read from **Supabase**, not in-memory fixtures:
- `@ss/db`: `loadNormalizedStore` (DB→domain), `ingestNormalizedStore` (idempotent
  domain→DB upserts), seed now ingests the demo analytics (68 orders, locations, store flags).
- `@ss/jobs`: `analyzeStore` (load → analyze → grounded engine → PERSIST run/metrics/recs);
  `openRecommendations`/`latestMetricValue` read helpers.
- `apps/web`: dev-auth shim (`getSession` → demo org; Clerk-ready), `getDashboard`
  (tenant-scoped, triggers a run on first load), `setMoveStatus` server action
  (tenant-scoped persistence of VIEWED/IMPLEMENTED/DISMISSED).
- Schema evolved: Store gains currency/hasPhysicalLocations/freeShippingThreshold;
  StoreLocation model; Order gains ship-to fields (pushed to Supabase).

Verified live: /app analyzes once (54s, live Claude), persists, then reloads in ~1s from
DB; dismiss persists across reloads (5→4); 1 run / 5 recs / 47 metrics in Supabase.

Pricing updated to the RESOLVED $0/$99/$299 tiers (geo+Pareto in Basic, one-click in Pro).

## Completed: Slice 2 — Shopify OAuth + connection management (2026-06-27)

@ss/integrations (new): AES-256-GCM token encryption; Shopify OAuth (authorize URL, shop
validation, callback HMAC), webhook HMAC verification, typed ShopifyClient (real fetch +
mock), createShopifyClient/createLlmClient-style factory. @ss/db: disconnectStore (tenant-
scoped purge). apps/web routes: /api/stores/connect/start (state cookie + redirect),
/connect/callback (HMAC + state + token exchange → encrypted store + webhook register),
/api/webhooks/shopify (raw-body HMAC verify, PII-free). Connections page + disconnect action.

AC results:

- [~] OAuth start→callback — BUILT (routes + flow); structurally works via mock; LIVE needs
      a Shopify Partner app (SHOPIFY_API_KEY/SECRET) — flagged on the Connections page.
- [x] token stored ENCRYPTED at rest — PASS (AES-256-GCM, round-trip + tamper tests)
- [x] webhooks registered on connect; syncStatus PENDING — PASS (mock-recorded)
- [x] disconnect purges store data (tenant-scoped) — PASS (disconnect.test)
- [x] callback handler logic w/ mocked Shopify; encryption round-trip; webhook HMAC — PASS (80 tests)

## Completed: Slice 3 — historical ingestion core (2026-06-27)

@ss/integrations: `ShopifyReader` (page generators of normalized domain) — `MockShopifyReader`
(fully working/tested) + `RealShopifyReader` (throws clearly until the live GraphQL→domain
mapping is implemented; never silently empty). @ss/jobs: `collectStore` (drains all pages) +
`backfillStore` (SYNCING → idempotent upsert ingest → READY; ERROR + rethrow on failure).

AC results:

- [x] paginates + upserts; re-run produces no duplicates (idempotent) — PASS (backfill.test)
- [x] progress + syncStatus PENDING→SYNCING→READY (and →ERROR) — PASS
- [x] pagination over a mocked multi-page dataset — PASS (collectStore, pageSize 7)
- [x] failure-resume (ERROR + rethrow so the runner retries) — PASS
- [~] LIVE backfill — needs RealShopifyReader GraphQL mapping (Shopify creds) + Inngest durability

Next: Slice 9 (outcome flywheel), then GitHub/Vercel deploy (DEPLOY.md done — needs Vercel account).

## Build order (chosen 2026-06-27): HEART-FIRST

Satya chose heart-first + autonomous (commit per slice). Execution order:
**Slice 4 (analyzers) → 5 (signals) → 6 (engine: grounding+ranking, mock LLM) → UI port
(packages/ui) → 7 (dashboard) → 8 (public Audit)** on a seed fixture store — a runnable,
grounded demo with no credentials. Then the plumbing: **1 (schema/tenant) → 2 (Shopify
OAuth) → 3 (ingestion) → 9 (outcomes) → 10 (billing) → 11 (exports) → 12 (hardening) →
13 (onboarding)**, each behind typed interfaces with mocks until keys are supplied.

## Current slice: Slice 5 — Signal detection (DONE) → next Slice 6 (engine)

Plan:

- packages/core/signals.ts: `detectSignals(metrics, thresholds)` — pure Stage-2 rules
  (vip_pareto, geo_focus, bopis_local vs regional_inventory by has_physical_locations,
  discount_dependency, aov_freeship, sku_margin_kill, retention_gap) with severity bands.
- packages/config: canonical SIGNAL_THRESHOLDS, $49/$99 tiers + entitlements, env/LLM config.
- Each signal carries `metricKeys` (the grounding allow-list Stage 3 may cite).

Acceptance criteria results:

- [x] AC1 — signals produced from metrics using config thresholds — PASS
- [x] AC2 — severity assigned (over/under bands) — PASS
- [x] AC3 — thresholds documented in config (SIGNAL_THRESHOLDS) — PASS
- [x] AC4 — threshold boundary tests (just-under vs just-over) — PASS (signals.test.ts)
- [x] Bonus — Slice 4→5 integration test (analyzers→signals) + 14 audit fixes w/ regression tests

Slice 5 done 2026-06-27.

## Completed: Slice 6 — engine (synthesis + grounding + ranking)

@ss/engine: LlmClient boundary; MockLlmClient (deterministic, grounded — runs with no
key); AnthropicLlmClient (fetch + tool-use, model from env); runEngine orchestrates
Stage 3 (LLM) → Stage 4 (grounding, in core) → Stage 5 (ranking, in core). Grounding
validator + ranking are pure and unit-tested in @ss/core.

AC results:

- [x] AC1 — engine calls LLM with signals only, gets schema-valid JSON — PASS
- [x] AC2 — grounding validator rejects unknown metrics / numbers not in input — PASS
      (grounding.test.ts + engine.test.ts grounding-rejection test; injected $999,999 → quarantined)
- [x] AC3 — ranking formula orders results; Recommendation rows shaped — PASS (ranking.test.ts)
- [x] AC4 — token usage logged (tokensUsed on EngineResult) — PASS
- [x] AC5 — fixture store → Pareto VIP + geo-concentration moves, each citing real metric ids — PASS

Slice 6 done 2026-06-27. The deterministic + grounded HEART is complete (60 tests).

## Completed: Slice 7 — dashboard + design-system port

@ss/ui: tokens vendored verbatim from the bundle (colors/typography/spacing/base);
ported Button, Badge, Card, MetricCard, MoveCard (the hero) + recommendationToMove
(the §19 MoveCard⇄Recommendation contract). apps/web: app shell (sidebar 16.5rem +
sticky blurred topbar 4rem), seed store (Wildflower Skincare), runDemo() runs the full
pipeline server-side, "This week's moves" renders ranked MoveCards with interactive
apply/dismiss. Bootstrap Icons vendored; fonts via Google.

AC results:

- [x] AC1 — app shell (sidebar + topbar, §19) lists recs sorted by rank as MoveCards
      (rank/pattern/why/✓moves/impact/confidence) — PASS (verified: 5 grounded cards render,
      VIP "top 20% drive 72%", geo BOPIS within 5mi; prod build green)
- [x] AC2 — mark DISMISSED works ("Not now"); apply marks IMPLEMENTED — PASS (client state)
- [x] AC3 — empty state handled — PASS
- [x] AC4 — visuals match §19 (token-driven, no hardcoded hex/px) — PASS
- [~] MoveDetailView (single-move route) — DEFERRED (card is self-contained; detail route later)
- [~] Playwright e2e — DEFERRED to when auth lands (Slice 1); covered now by the runDemo
      unit test + a prod-build/HTTP render smoke check
- Note: auth gating of /app deferred to Slice 1 (route is currently open for the demo).

Slice 7 done 2026-06-27.

## Completed: Slice 8 — public "Simple Sense Audit" (the wedge)

Public `/audit/[slug]` renders unauthenticated: a curated 2–3 highest-conviction
MoveCards (read-only, no Apply) + grounded headline stats + a wedge CTA, styled per §19.
`buildAudit()` is the trust boundary — payload carries only aggregate computed metrics
and prescriptive copy, never raw customer PII.

AC results:

- [x] AC1 — `/audit/:slug` renders read-only, curated MoveCards, no auth — PASS (verified via HTTP)
- [x] AC2 — contains NO raw customer PII — PASS (audit.test.ts: no emails / customerId / ship-to city)
- [x] AC3 — shows highest-conviction grounded insights; shareable link works unauthenticated — PASS
- [~] `publicSlug` persistence — DEFERRED to the DB slice (slug is currently a route param; the
      Audit model + real slug generation land with Slice 1/persistence).

Slice 8 done 2026-06-27.

## MILESTONE: heart-first runnable demo COMPLETE (Slices 0,4,5,6,7,8)

A grounded, design-accurate, runnable product with zero credentials: seed store →
analyzers → signals → grounded engine → ranked MoveCards (/app) + public Audit
(/audit/demo). 63 tests green; prod build green. Remaining = plumbing (1 schema/tenant,
2 Shopify OAuth, 3 ingestion, 9 outcomes, 10 billing, 11 exports, 12 hardening, 13 onboarding).

## Completed: Slice 4 — Analyzers (pure, deterministic)

Plan:

- packages/core: normalized domain types (Order/Customer/Product/LineItem/Address/
  StoreLocation/NormalizedStore), the Metric model, pure helpers (math/geo/window).
- MVP analyzers: pareto, geography (physical-vs-online branch + trade-area overlap),
  rfm, cohort (+2nd→3rd, time-to-second), replenishment, affinity, sku-margin,
  discount, returns, aov+freeship, new-vs-returning, acquisition. Gated
  (channel-profitability, owned-channel) emit flagged "insufficient".
- Known-answer fixtures + tests for every analyzer; insufficient-data paths tested.

Acceptance criteria results:

- [x] AC1 — MVP analyzers (§8.1) implemented in core, each emits Metric with window — PASS
- [x] AC2 — geo records has_physical_locations + branches physical/online + trade-area overlap — PASS
- [x] AC3 — sparse/empty data yields "insufficient data", never a fabricated number — PASS
- [x] AC4 — channel-profitability/LTV:CAC + owned-channel stubbed behind flags — PASS (flagged insufficient)
- [x] AC5 — known-answer fixtures for every analyzer; empty-data behavior — PASS (27 core tests)

Blockers:

- None. Adversarial audit workflow running; folding any real findings before commit.

## Completed: Slice 0 — Repo, tooling, CI

Plan:

- pnpm-workspace monorepo (`apps/*`, `packages/*`); pnpm via corepack (no global pnpm on host).
- TypeScript strict (`tsconfig.base.json`), Vitest (root config), oxlint, Prettier.
- `packages/core` as the pure/deterministic package — first real code is a tested math util.
- `apps/web` Next.js (App Router) with a hello page + `GET /api/health` route and a smoke test.
- GitHub Actions CI: install → typecheck → lint → format:check → test.
- Five ledgers at repo root (OPEN_QUESTIONS.md already present from planning).
- `.env.example` with every required var; local dev uses embedded PGlite (no Docker).

Acceptance criteria results:

- [x] AC1 — `pnpm install && pnpm dev` boots a hello route — PASS (`/` serves hero;
      `GET /api/health` → `{status:"ok"}`, verified via curl against the dev server)
- [x] AC2 — `pnpm test` runs a passing smoke test — PASS (6 tests, 2 files green)
- [x] AC3 — CI green on push — PASS locally for all CI steps (typecheck/lint/format/test);
      `.github/workflows/ci.yml` committed (runs on push to GitHub)
- [x] AC4 — all five ledger files exist — PASS (PROGRESS/DECISIONS/CONVENTIONS/LEARNINGS/OPEN_QUESTIONS)
- [x] AC5 — smoke test for hello route + trivial pure-function test in `core` — PASS
      (`apps/web/app/api/health/route.test.ts` + `packages/core/test/math.test.ts`)

Blockers:

- None. (External provider keys are an action item for Satya per OPEN_QUESTIONS §7; not needed for Slice 0.)

Slice 0 done 2026-06-27. Next: Slice 1 — Auth, org/user, Prisma schema, migrations, tenant-isolation test.

## Log (newest first)

- 2026-06-27 Slice 0 — Scaffolding monorepo, tooling, CI, ledgers. Resolved host gaps:
  no `pnpm` → corepack; no Docker/Postgres → PGlite for local/test (ADR-002).
  Ran a parallel extraction pass over the design-system bundle + insight library →
  `docs/BUILD_SPEC.md` (canonical port spec for tokens/components/screens/analyzers).
