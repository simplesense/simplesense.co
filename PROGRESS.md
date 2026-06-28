# Build Progress

Running build log for Simple Sense. Newest log entries first. The backlog mirrors
SIMPLE_SENSE_BUILD_PROMPT.md §13. A slice is **done** only when every acceptance
criterion below it is checked and its tests pass.

## Backlog

- [x] Slice 0 — Repo, tooling, CI
- [ ] Slice 1 — Auth, org/user, schema, migrations
- [ ] Slice 2 — Shopify OAuth connect
- [ ] Slice 3 — Historical ingestion (background)
- [ ] Slice 4 — Analyzers (pure, deterministic)
- [ ] Slice 5 — Signal detection
- [ ] Slice 6 — LLM synthesis + grounding validation + ranking
- [ ] Slice 7 — Dashboard (ranked prescriptions / "This week's moves")
- [ ] Slice 8 — The free "Simple Sense Audit" (the wedge)
- [ ] Slice 9 — Outcome tracking (flywheel)
- [ ] Slice 10 — Billing (Stripe tiers) + gating
- [ ] Slice 11 — Integration exports (Klaviyo/Meta/Google)
- [ ] Slice 12 — Hardening
- [ ] Slice 13 — Polish & onboarding

## Build order (chosen 2026-06-27): HEART-FIRST

Satya chose heart-first + autonomous (commit per slice). Execution order:
**Slice 4 (analyzers) → 5 (signals) → 6 (engine: grounding+ranking, mock LLM) → UI port
(packages/ui) → 7 (dashboard) → 8 (public Audit)** on a seed fixture store — a runnable,
grounded demo with no credentials. Then the plumbing: **1 (schema/tenant) → 2 (Shopify
OAuth) → 3 (ingestion) → 9 (outcomes) → 10 (billing) → 11 (exports) → 12 (hardening) →
13 (onboarding)**, each behind typed interfaces with mocks until keys are supplied.

## Current slice: Slice 4 — Analyzers (pure, deterministic)

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
