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

## Current slice: Slice 0 — Repo, tooling, CI

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
