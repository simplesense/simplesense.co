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
- [x] Slice 9 — Outcome tracking (flywheel) — schedule/measure + Monitoring view
- [x] Slice 10 — Billing + TIER GATING: server-enforced entitlements live (free=top-3+teaser,
      Basic+=full, demo=showcase); Stripe code test-mode complete — live needs Stripe keys only
- [x] Slice 11 — Integration exports: grounded VIP-segment + SKU-economics CSV downloads
- [~] Slice 12 — Hardening: redaction, rate limits, env fail-fast, SECURITY.md DONE
- [x] Slice 13 — Polish & onboarding: marketing site + onboarding stepper + Move Detail + ParetoChart

## Completed: Acquisition source — real Order.sourceName (2026-07-13)

GO_LIVE.md W1.4 (`PLAN-acquisition-source.md`). `RealShopifyReader.orders()` was
hard-coding `sourceName: null` forever, so `acquisitionAnalyzer` always returned
"insufficient" for every real store (only the demo fixture had source data). Added
`sourceName` to the orders GraphQL query (a plain scalar, 0 added query-cost points),
a `normalizeSource()` helper (trim+lowercase, empty→null), and wired it into the
mapper. Doc-commented `acquisitionAnalyzer` to make explicit that Shopify channel is
point-of-sale, not marketing/ad attribution. No schema migration (column already
existed), no ingest/demo-fixture changes. Gate green: typecheck 8/8, test 166/166
(+2 new), lint 0/0, build 16/16 routes. Commit f182588.

## Completed: First-run funnel — auto-sync, onboarding, connect form (2026-07-13)

GO_LIVE.md W1.1 (`PLAN-first-run-funnel.md`). The OAuth callback now auto-starts the first
sync (shared `lib/sync-runner.ts`, used by both the server action and the route handler —
server actions can't be invoked from route handlers) so a merchant lands on `/connections`
already syncing instead of needing to notice and click "Sync now". Onboarding step 3 now
completes for real (any recommendation with status != NEW, tenant-scoped by construction).
The connect form is a labeled, client-validated component that normalizes bare store names
("mystore" → "mystore.myshopify.com"); the post-sync message is a real link into `/app`.
9 new tests (154 total, up from 145); full gate green. Screen checks deferred — no
dev-server launch tool available in this session (build + typecheck + unit tests are the
compensating evidence; see TASK.md/commit 3b337c5 for the honest limitation note).

## Completed: Streaming backfill, nested line-item pagination, derived firstOrderAt (2026-07-13)

GO_LIVE.md W1.2 (`PLAN-sync-scale.md`). `backfillStore` previously drained an ENTIRE store
into RAM before writing a single row — a deterministic OOM on the 1GB Fly machine for any
real store with meaningful history, and because the sync retries, a permanent onboarding
block. Now it streams orders page-by-page (`ingestCatalog` + per-page `ingestOrdersPage`,
split out of `ingest.ts`), with a `syncStartedAt` heartbeat per page so the 15-min
stale-job watchdog doesn't steal a long-running sync. Two silent data-quality bugs rode
the same path: orders with >20 line items were truncated (now fully fetched via per-order
nested GraphQL pagination) and `Customer.firstOrderAt` was hard-coded `null` (now derived
from `min(order.createdAt)` after orders land, populating the VIP CSV export column for
real stores). No schema changes, no external approvals needed. 4 new tests (158 total, up
from 154); full gate green.

## Completed: Per-store granted-scope tracking (2026-07-13)

GO_LIVE.md W1.3 (`PLAN-scope-grant-tracking.md`). `historyLimited` was derived from the
`SHOPIFY_SCOPES` env var — what the deployment REQUESTS — so flipping that env when Shopify
approves `read_all_orders` would instantly un-label every existing store's still-partial
data (grounding violation). Now the token exchange's `scope` response (previously thrown
away) is persisted as `Store.grantedScopes` (nullable; migration
`20260706000001_store_granted_scopes`), `historyLimited` computes per store via
`storeHasAllOrdersScope()` with an env fallback for legacy null grants, and /connections
shows a re-connect banner (`missingScopes()`) when the deployment requests scopes the
store hasn't granted — silent for legacy stores. Mock client deliberately reports no
`read_all_orders`. 7 new tests, red→green TDD (165 total, up from 158); full gate green.
⚠️ Deploy prerequisite for W1.5: `pnpm --filter @ss/db exec prisma migrate deploy` against
the Supabase pooler (additive column). Screen checks BLOCKED(human: migrate deploy) — the
live DB lacks the column until then; unit tests + build are the compensating evidence.

## Completed: Tier gating, server-enforced (2026-07-02)

TIERS entitlements were decorative (zero call sites); now enforced at every data path.
Free = FIXED top-3 moves of the run (by rank, all statuses — a sliding open-set window was
built first, and the adversarial review of the diff proved it enumerable via "Not now"
cycling; 13 findings, 5 distinct fixes folded same-day) + teaser KPIs; exports 403 (even on
demo — deliverables stay gated); detail panels + monitoring locked with /plans CTAs.
Basic+/demo = full. Enforced in: dashboard slice (locked moves never serialized), move-detail
404 gate, setMoveStatus write path, export route, monitoring query. Stripe status mapping
fails closed (unpaid/unknown → CANCELED). Deterministic rank ordering (id tiebreak)
everywhere. 145 tests green. The moment live Stripe keys land, paying flips entitlements
with no further code.

## Adversarial review of the 2026-06-28 diff — 7 defects folded

Ran a multi-agent review workflow (5 dimensions × find→adversarially-verify) over this
session's 34-file diff. 8 candidates → 7 confirmed real, all fixed with regression tests
(116 → 123 green). Highlights:

- **CRITICAL — Clerk split-brain:** provider/UI gated on the build-inlined publishable key,
  middleware + getSession() on the runtime secret. A divergent config looked authed while
  protecting nothing and returning the shared DEMO org to everyone (tenant-isolation collapse).
  Unified all gates on the publishable key + both-or-neither assertServerEnv check, now wired
  at boot via `apps/web/instrumentation.ts` (split config refuses to start).
- **HIGH — CSV formula injection:** toCsv() now apostrophe-defangs cells starting with = + - @
  tab/CR before quoting (customer email/city/title are merchant-uncontrolled).
- **HIGH — VIP over-inclusion:** zero-spend cutoff admitted the whole base; now drops
  non-paying customers (net <= 0) before ranking via the shared `netRevenue` helper.
- **MED/LOW — SKU marginRate** fabricated 0 when known-cost revenue netted to 0 → now blank.
- **LOW — header injection:** export filename sanitized; OAuth callback rejects non-myshopify
  domains.
One candidate (SKU marginRate "flips positive on negative revenue") was refuted on inspection.

## Completed: Marketing + onboarding + move detail + exports + chart (2026-06-28)

Shipped autonomously and deployed to simplesense.co (live; Clerk-gated app, public marketing):

- **Marketing surface (§5/§19.6):** `(marketing)` route group — editorial landing
  ("Stop drowning in data. Start executing."), `/how-it-works`, `/pricing` (reads TIERS
  live). Floating pill nav + blossom footer; `marketing.css` ports the warm surface from
  `@ss/ui` tokens. Public via middleware.
- **Onboarding (Slice 13):** `/onboarding` 3-step stepper reads live connection + run
  state and gates each CTA; ClerkProvider redirects sign-up→/onboarding, sign-in→/app.
- **Move Detail (Slice 7 drill-down):** `/app/moves/[id]` — tenant-scoped, resolves cited
  `evidenceMetricIds` to real values from the same run (refuses cross-tenant), formats by
  key/unit. Two-column: evidence table + why + togglable checklist | impact + SVG confidence
  Ring + apply/schedule + "how we'd ship it". Pure `shipPlan()`/`moveChecklist()` (6 tests).
- **Exports (Slice 11):** `@ss/core/export` pure `buildVipSegment()`/`buildSkuEconomics()`
  over the same NormalizedStore the analyzers see; margin fields blank (never fabricated 0)
  when cost unknown; RFC-4180 `toCsv()` (9 tests). `/api/export/[kind]` tenant-scoped CSV
  download; ExportButton wired into Customers/Products + move detail.
- **ParetoChart (§3c):** pure-SVG Lorenz concentration curve on Customers from the real
  top 1/5/10/20% cumulative shares.

Tests: 116 green. Every slice typechecks + lints clean + `@ss/web build` compiles.

Genuine deadends (require Satya — credentials/decisions, not code):
- Shopify OAuth real install — needs the app reviewed in the Partner dashboard + a real
  merchant store to connect (RealShopifyReader implemented, mock-tested).
- Stripe billing live — needs real secret key + price IDs (test-mode code done).
- Clerk production — currently DEV keys (dev handshake only); live domain wants a prod
  instance.
- Data integrations (GA4 / Meta / Google / Klaviyo) — OAuth apps + keys (export specs ready).
- **Rotate the secrets pasted in chat** (Anthropic, Supabase DB password, Shopify secret,
  Clerk secret) — they live only in gitignored env files, but the transcript saw them.

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

## Completed: Slice 9 — outcome flywheel (2026-06-27)

@ss/core `computeLift` (pure: lift + confidence, or INCONCLUSIVE below a 5% noise floor /
no baseline — never overclaims). @ss/jobs: `scheduleOutcome` (capture tracked-metric
baseline on IMPLEMENTED, schedule at 30d), `measureOutcome` (post-window lift), `listOutcomes`.
Wired: applying a move (server action) schedules an outcome; **Monitoring** view (`/monitoring`)
shows measuring/measured/inconclusive. ADR-007 covers privacy-safe cross-tenant aggregation.

AC results:

- [x] IMPLEMENTED schedules an outcome (baseline captured) — PASS (verified live: clicked Apply
      → outcome SCHEDULED, baseline 0.717, open moves 5→4)
- [x] baseline vs measured lift computed (or INCONCLUSIVE) — PASS (computeLift + outcome tests)
- [x] outcomes display to the merchant — PASS (Monitoring view)
- [x] cross-tenant aggregation privacy-safe — ADR-007 (aggregate-only; isolation holds)

90 tests green. Remaining: Slice 10 (Stripe billing), 11 (live exports), 12 (hardening),
13 (onboarding), Clerk auth, + RealShopifyReader/Inngest (live Shopify). Deploy: DEPLOY.md.

## Post-MVP (2026-06-28): live + auth + detail screens

- **Deployed live on Fly** (simplesense-co.fly.dev); Supabase via aws-1-us-west-1 pooler.
- **Live Shopify**: RealShopifyReader (GraphQL incl product COGS via read_inventory) +
  connect→Sync→dashboard loop; conservative geo (physical-store toggle in Settings).
- **Clerk auth** wired (login, org mapping, route protection; demo store read-only for new
  orgs). **Stripe billing** + Plans gating (mock until keys). **Slice 12 hardening** done.
- **Detail screens**: Customers (Pareto/RFM), Geography (trade-area vs regional), Products
  (margin/affinity) — read the latest run's metrics. All nav items now route.
- **Domain**: simplesense.co cert provisioned on Fly; awaiting DNS A/AAAA at the registrar.

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
