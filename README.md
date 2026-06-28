# Simple Sense

**The co-pilot that tells your store where to turn next.**

Simple Sense is a prescriptive e-commerce analytics SaaS. It connects to a Shopify
store, ingests its full order/customer/product history, and produces a **ranked,
grounded list of moves** — what to do, why, and the expected dollar impact — not
another dashboard. Every number shown traces to a deterministically computed metric;
the LLM only ranks and explains, never invents (Prime Directive #1).

> Build spec: [`SIMPLE_SENSE_BUILD_PROMPT.md`](SIMPLE_SENSE_BUILD_PROMPT.md) ·
> Design system: [`simplesense-design-system/`](simplesense-design-system/project/README.md) ·
> Extracted port reference: [`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md) ·
> Decision ledgers: [`PROGRESS.md`](PROGRESS.md) · [`DECISIONS.md`](DECISIONS.md) ·
> [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md)

## Quick start

```bash
corepack enable          # provides pnpm (pinned to packageManager in package.json)
pnpm install
cp .env.example .env      # local dev works with empty keys (see "Local dev" below)
pnpm dev                  # → http://localhost:3000  (hello route + /api/health)
```

Verify the toolchain:

```bash
pnpm typecheck   # tsc --noEmit across all packages
pnpm lint        # oxlint (fast); absorbs the design-system adherence rules
pnpm format:check
pnpm test        # vitest (unit + integration)
```

## Local dev without external services

The build is designed to run with **zero credentials**:

- **Database** — leave `DATABASE_URL` empty to use embedded **PGlite** (a real
  Postgres in WASM, no Docker/server). Set `DATABASE_URL` to a Neon/Supabase URL for
  prod. (See [`DECISIONS.md`](DECISIONS.md) ADR-002.)
- **Integrations** (Shopify, Stripe, Anthropic, Clerk, Resend, …) each sit behind a
  typed interface with a mock. They run against the mock until you supply the key in
  `.env`. Credential-gated slices are flagged in [`PROGRESS.md`](PROGRESS.md).

## Architecture

A multi-tenant Next.js app over a pure, deterministic analysis core.

```
apps/web            Next.js (App Router) — marketing + operator app + API routes
packages/core       PURE analyzers, signal detection, ranking, grounding (no I/O)
packages/engine     prescription engine: orchestration + the single LLM call
packages/db         Prisma schema, migrations, seed, typed client (Postgres/PGlite)
packages/integrations  shopify/klaviyo/meta/google/stripe/resend clients + mocks
packages/jobs       Inngest functions: backfill, webhook-sync, analyze, measure-outcome
packages/ui         design-system port: tokens + components (MoveCard, MetricCard, charts)
packages/config     validated env, tier definitions, signal thresholds
```

The pipeline: ingest Shopify history → **pure analyzers** compute `Metric`s →
**signal detection** flags noteworthy metrics → **LLM synthesis** turns signals into
ranked prescriptions (referencing metric ids only) → **grounding validation** rejects
any unfounded number → **ranking** → persisted `Recommendation`s rendered as `MoveCard`s.

## Status

Built slice-by-slice per [`PROGRESS.md`](PROGRESS.md). Current: **Slice 0 (repo,
tooling, CI) complete.**
