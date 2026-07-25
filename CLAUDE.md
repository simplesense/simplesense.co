# CLAUDE.md — SimpleSense.co

IMPORTANT: You MUST follow @EXECUTION_PROTOCOL.md on every task. The protocol beats speed.

## What this is

Prescriptive Shopify-analytics SaaS, LIVE at https://simplesense.co (Fly app `simplesense-co`).
pnpm monorepo: `@ss/core` (pure analyzers/grounding/ranking), `@ss/config`, `@ss/engine` (LLM),
`@ss/db` (Prisma + Supabase), `@ss/jobs`, `@ss/integrations` (Shopify/Stripe/crypto), `@ss/ui`,
`apps/web` (Next.js 15 App Router, Clerk auth).

## Non-negotiable product invariants

1. **Grounding** — never show a number that isn't computed from the store's own data.
   Missing data → "insufficient"/blank, NEVER a fabricated 0 or estimate.
2. **Tenant isolation** — every read/write is org-scoped through `getSession()`
   (`apps/web/lib/auth.ts`). The shared demo store is a read-only showcase.
3. **Server-enforced tier gating** — free = FIXED top-3 moves of the run; gate at the data
   path (loaders/routes), never CSS-hide data already sent (`apps/web/lib/gating.ts`).
4. **Secrets** live only in gitignored `.env` / `.env.local` — never committed, never logged.

## Commands

- Full gate (run before any commit):
  `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build`
- Deploy (only when asked; a deploy leaves the machine — D5):
  `fly deploy --app simplesense-co --ha=false --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<pk_...>`
- Prisma against the live DB: source env from `apps/web/.env.local` (packages/db/.env is empty);
  schema changes are `prisma db push` (managed role can't create a shadow DB — additive only).

## Repo conventions

- Commit per slice, message explains WHY; docs-only commits get `[skip ci]`.
- Ledgers are the memory: `PROGRESS.md` (slice log), `DECISIONS.md` (ADRs), `LEARNINGS.md`,
  `OPEN_QUESTIONS.md`, `SECURITY.md`. Ranked execution plans live in `PLAN-*.md` at the root.
- Keep `STATUS.md` current (Life OS reads it from GitHub): update the checklist + `updated:`
  whenever work lands or is planned.
- Design system: tokens in `packages/ui/src/tokens` — no hardcoded hex/px in components.
  Fonts: Instrument Serif (display) / Inter / Manrope. Icons: Bootstrap Icons.
- New behavior ships with a Vitest test; pure logic belongs in packages, not page files.

## Known human-blocked items (don't attempt; surface instead)

Live Stripe keys, Shopify Partner allowlist/approvals (`read_all_orders`, protected customer
data), Clerk production instance. Details in `STATUS.md`.

## Intelligence audit modules — working agreement

Per `COMPOUND_ENGINEERING_PLAN.md` (paid concierge audits: M8 Retention X-Ray, M1 AnswerShelf,
M2 AgentReady, M3 ReviewProof, M5 ReturnLens — separate from the core SimpleSense product).

- Rulebooks are data. New detection = new rule file with citation + `addedBecause`.
- Every failure becomes a fixture with a golden output BEFORE the fix.
- Reports run through the grounding validator. "Insufficient" beats a guess.
- Report voice: operator-to-operator, findings → dollar frame → exact next step. No
  adjectives doing the work numbers should do.
- Never edit a golden output to make a test pass; regenerate via founder review.
- Cost: every LLM call logs tokens+$ per run-id. Batteries respect daily caps.
- No new entitlement/billing code in this phase — Stripe payment links only, founder-created.
- No Shopify App Store work, no embedded app, no new data-source ingests into SimpleSense
  core from this phase's work.

## Niche pages (/for/*)
- Verticals are config, not code. New vertical = new config file, founder-approved copy.
- Demo numbers come from the pipeline on synthetic stores. No literal $/% in
  move templates (computed tokens only). No stat without a sourceUrl.
- Banned-claims lint is non-negotiable: no invented social proof, ever.
- Three pages until one wins. The funnel data decides, not enthusiasm.
