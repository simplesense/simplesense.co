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
