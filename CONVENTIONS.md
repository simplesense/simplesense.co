# Conventions

Coding standards and patterns for Simple Sense. Update when a new pattern is adopted.

## Language & types

- TypeScript strict everywhere. `noUncheckedIndexedAccess` is on — guard array access.
- No `any` in `core`/`engine`. Prefer discriminated unions over boolean flags.
- Money is a `Decimal` in the DB; in pure `core` it is handled as `number` of the
  store's currency minor-or-major unit consistently — document the unit on every Metric.

## Package boundaries

- `packages/core` is **pure**: no network, no fs, no framework, no `Date.now()` inside
  analyzers (pass `now`/window bounds in). This is what makes it deterministic + testable.
- The **only** LLM call lives in `packages/engine` (Stage 3). Everything numeric is
  computed in `core` and merely *referenced* by the engine.
- External services live behind a typed interface in `packages/integrations`, each with
  a `*.mock.ts`. Never call a live external API in a unit test.

## Naming

- Packages: `@ss/<name>`. Files: kebab-case. React components: PascalCase files.
- Metric keys: dotted, stable, namespaced — `pareto.top20_revenue_share`,
  `geo.single_region_share`. Treated as an API; do not rename without a migration note.
- Test files colocated: `*.test.ts` next to source (or under `test/` for fixtures).

## Grounding (Prime Directive #1)

- Every number rendered to a user traces to a `Metric` row. The LLM receives only
  computed signals/metrics and references them by id; the Stage-4 validator rejects any
  recommendation citing an unknown metric id or a number absent from the inputs.
- When data is insufficient, analyzers emit an explicit "insufficient data" Metric —
  never a fabricated number.

## Multi-tenancy (Prime Directive #2/#3)

- Every domain row carries `organizationId` (or a `storeId` that resolves to one).
- All reads go through tenant-scoped helpers; there is a test that proves org A cannot
  read org B. No raw cross-tenant query path.

## UI (design system — §19)

- `packages/ui` is the canonical visual source. Never hardcode hex/px — use tokens.
- `MoveCard` and `MetricCard` are branded primitives; do not replace with generic shadcn.
- Voice: Pattern → Why → Move → Impact. Sentence case. Ranged numbers. No emoji (plain `✓` only).

## Tests & commits

- A slice is not done until its tests exist and pass. Every fixed bug gets a regression test.
- Conventional commits referencing the slice: `feat(core): pareto analyzer`,
  `fix(engine): reject hallucinated metric id`.
