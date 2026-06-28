# Architecture Decision Records

Numbered ADRs. Each: Context / Decision / Alternatives / Consequences. Append new
ADRs; never rewrite history (correct via a superseding ADR).

## ADR-001: Stack & monorepo shape

Date: 2026-06-27
Context: SIMPLE_SENSE_BUILD_PROMPT.md §5 pins a stack. We need a layout that keeps
the analyzers pure/testable and separates the LLM boundary cleanly.
Decision: pnpm-workspace monorepo. `apps/web` = Next.js (App Router). `packages/`:
`core` (pure analyzers/signals/ranking/grounding — no I/O), `engine` (orchestration
+ LLM client), `db` (Prisma), `integrations` (typed external clients + mocks),
`jobs` (Inngest), `ui` (design-system port), `config` (validated env + thresholds +
tiers). Internal packages export TypeScript source directly (consumed via Next
`transpilePackages` and Vitest) — no per-package build step in dev.
Alternatives: Turborepo (add later for task caching); single Next app (rejected —
muddies the pure/impure boundary the grounding guarantee depends on).
Consequences: Clean test surface for `core`; the grounding boundary is structural.

## ADR-002: Local/test database = PGlite; prod = Neon/Supabase via env

Date: 2026-06-27
Context: §5 specifies managed Postgres. The build host has no Docker, no local
Postgres, no `psql`. We still need the DoD "runs locally from a single command"
and an automated tenant-isolation test that exercises real SQL.
Decision: Use **PGlite** (`@electric-sql/pglite`, embedded WASM Postgres) when
`DATABASE_URL` is empty — zero-dependency, real Postgres semantics, runs in CI and
on any laptop. When `DATABASE_URL` is set, use it (Neon/Supabase) for prod. Prisma
schema stays the single source of truth; the client selects the driver from env.
Alternatives: SQLite (rejected — diverges from Postgres semantics the analyzers and
JSON columns rely on); require Docker (rejected — not available, raises setup cost).
Consequences: One schema, two drivers. Tenant-isolation and ingestion tests run
anywhere with no server. Revisit if a Prisma+PGlite adapter edge case appears.

## ADR-003: pnpm via corepack

Date: 2026-06-27
Context: No global `pnpm` on host; global npm install lacked permissions.
Decision: Pin `packageManager: pnpm@9.15.0`; developers/CI use `corepack enable`.
Consequences: Reproducible package manager without a global install.

## ADR-004: LLM model is env-configured, never hardcoded

Date: 2026-06-27
Context: Prime Directive / §16 — do not hardcode a possibly-stale model string.
Decision: `LLM_MODEL` + `LLM_MAX_TOKENS` come from env (default `claude-sonnet-4-6`
for cost-balanced synthesis; can be raised to an Opus tier for quality). The engine
is model-agnostic; token usage is logged per run (no PII). Verify the current
recommended model at docs.claude.com before launch (OPEN_QUESTIONS §11).
Consequences: Model swappable without code changes; cost is a tunable, not a constant.

## ADR-005: Tooling — Vitest + oxlint + Prettier

Date: 2026-06-27
Context: §5 names Vitest + Playwright. Need fast lint that can also host the
design-system adherence rules (the bundle ships `_adherence.oxlintrc.json`).
Decision: Vitest (unit/integration), Playwright (e2e, added at first user-facing
slice), **oxlint** (fast; will absorb the adherence config so hardcoded colors/px
fail CI), Prettier (format). TypeScript strict with `noUncheckedIndexedAccess`.
Consequences: Sub-second lint; one linter for correctness + brand adherence.

## ADR-006: Supabase schema via `db push` + baseline migration (not `migrate dev`)

Date: 2026-06-27
Context: Supabase's managed `postgres` role cannot CREATE DATABASE, so Prisma's
`migrate dev` (which spins up a shadow database to diff) fails on a hosted Supabase
project. We still want a committed migration history for reproducible deploys.
Decision: For the initial sync, run `prisma db push` (no shadow DB) to create tables,
then generate a baseline migration offline with `prisma migrate diff --from-empty
--to-schema-datamodel … --script` and record it with `prisma migrate resolve --applied
0_init`. Going forward, author migrations and apply with `prisma migrate deploy`
(also no shadow DB). The direct host `db.<ref>.supabase.co` is IPv6-only and reachable
from this machine, so it serves both DATABASE_URL and DIRECT_URL.
Alternatives: a dedicated shadow database URL (extra provisioning); staying on PGlite
(rejected now that real Supabase works). Consequences: clean history + Supabase-compatible.

## ADR-007: Outcome flywheel — tracked metric, lift, privacy-safe aggregation

Date: 2026-06-27
Context: §8.6 — implementing a move should measure its real lift over an attribution
window and feed future confidence, without leaking data across tenants.
Decision: On IMPLEMENTED we capture the baseline of the move's **tracked metric** (its
first cited evidence metric — already grounded) and schedule a measurement at
`ATTRIBUTION_WINDOW_DAYS` (30). After the window, `measureOutcome` records the post-window
value and `computeLift` (pure, in @ss/core) returns lift + confidence, or **INCONCLUSIVE**
when there's no baseline or the change is within a 5% noise floor — never overclaiming.
Cross-tenant learning (sharpening priors "stores like yours saw Y from X") will be derived
ONLY from **aggregated** outcomes (counts/means across many orgs), never per-tenant rows;
no query joins one org's data to another's. Per-tenant outcomes are tenant-scoped reads.
Alternatives: attribute to GMV directly (rejected — noisier than the move's own metric);
fixed lift labels (rejected — not grounded). Consequences: proof compounds; isolation holds.
