# HANDOFF.md — Developer Handoff

Everything a new developer needs to get this codebase running, understand how it's
put together, and know what's genuinely unfinished. Written to be read top to bottom
once, then used as a reference. If something here is stale, trust the code over this
document and fix this document.

For the *why* — the product's goal and design philosophy, independent of any specific
technology — see [GROUND_DESIGN.md](GROUND_DESIGN.md). This document is the *how*.

---

## 1. What this is, in one paragraph

SimpleSense is a live, paid Shopify-analytics SaaS product (currently running at
simplesense.co) that reads a merchant's own store data and tells them a short, ranked
list of specific, dollar-quantified actions to take — never a dashboard of charts to
interpret themselves. Every number shown is computed from the merchant's own data; if
the data needed for a claim isn't there, the product shows "insufficient," never a
guess. Alongside the core subscription product, the same underlying engine sells a
handful of one-time paid "concierge audit" reports (retention health, AI-agent
discoverability, AI-answer-engine visibility, review-integrity, returns-abuse
patterns) as an additional, separately-priced revenue line.

---

## 2. Stack and repo layout

pnpm monorepo (workspace-managed via `corepack`, not a global pnpm install).

```
apps/
  web/                  Next.js 15 App Router app — the entire product surface
                         (marketing site, authenticated dashboard, API routes,
                         niche landing pages, concierge-audit landing pages)
packages/
  core/                 Pure, I/O-free analyzers + signal detection + grounding
                         validation + ranking. The product's actual "brain."
                         Zero dependencies on DB/HTTP/LLM — testable in isolation.
  config/               Environment/config readers (Shopify, Stripe, tiers, audit
                         payment links) + assertServerEnv fail-fast startup check.
  engine/               LLM synthesis layer: prompt construction, a real LLM client
                         and a deterministic mock LLM client (same contract, used
                         whenever no API key is configured), calls into core's
                         grounding validator before anything is persisted.
  db/                   Prisma schema + client + tenancy-enforcing query helpers +
                         ingestion/backfill data-shaping. Postgres (Supabase-hosted
                         in production; embedded PGlite locally/CI).
  jobs/                 Backfill, analyze, outcome-measurement, and the scheduled
                         "tick" orchestrator that ties them together.
  integrations/         External API clients — Shopify (OAuth + Admin API reader),
                         Stripe (checkout/portal/webhooks), Klaviyo (read-only flow
                         data), plus the intelligence-audit modules' data adapters
                         (agent-ready, answer-shelf, review-proof).
  ui/                   Design tokens (colors/typography/spacing/motion, all CSS
                         variables, no hardcoded hex/px anywhere else in the repo)
                         + shared React components for the authenticated app shell.
  rulebooks/            Versioned rule sets for the concierge audit modules —
                         each rule is data (citation, remediation text, the commit/
                         complaint that created it) plus a pure detect() function.
  reports/              Shared branded report renderer (HTML + PDF) for concierge
                         audit deliverables.
  csv-ingest/           Hand-rolled CSV schema-sniffing/parsing for merchant-
                         uploaded order/return exports (used by the returns-abuse
                         audit module).
  safe-fetch/           SSRF-safe HTTP fetch (IP-blocklist, robots.txt parsing,
                         content-safety heuristics) — the network primitive every
                         other package that reaches an external URL builds on.
  crawler/              Playwright-based page capture for the audit modules that
                         need rendered DOM (JS-injected review widgets, etc.) —
                         built on top of safe-fetch's SSRF/robots.txt logic.
  capture-archive/      Append-only, hash-verified, retention-policy-aware storage
                         for crawler captures (tamper-evidence for audit findings).
  entities/             Brand/domain/competitor registry (not yet wired into any
                         module's run pipeline — see §7).
  verticals/            Config-driven niche marketing pages (/for/pet-brands etc.):
                         synthetic demo-store generator + honesty-rail lints
                         (banned-claims, cite-or-omit, no-literal-percent).
```

Language: TypeScript throughout, strict mode. Test runner: Vitest. Linter: oxlint
(also enforces the design-token rule — no raw hex/px in components). Formatter:
Prettier. Database: PostgreSQL via Prisma ORM. Auth: Clerk. Payments: Stripe.
Deployment: Fly.io. LLM: model is env-configured, never hardcoded to a specific
provider string.

---

## 3. Getting it running locally

**Prerequisites:** Node.js, `corepack enable` (pins the exact pnpm version — don't
`npm install -g pnpm`).

```bash
git clone <repo>
cd simplesense.co
pnpm install
```

**Environment variables** — go in `apps/web/.env.local` (NOT a repo-root `.env` —
Next.js only auto-loads env files that live inside the Next.js app's own directory;
a root-level `.env` is invisible to it). `packages/db/.env` is intentionally empty;
Prisma commands run against `apps/web`'s env.

Minimum to run with everything mocked (no external accounts needed at all):
- Nothing. `createShopifyClient()`, `MockStripeClient`, `MockKlaviyoClient`, and the
  mock LLM engine are all used automatically whenever their real credentials are
  absent. The app runs end-to-end against the seeded demo store with zero external
  accounts.

To connect real services, add:
| Var | Purpose | Where to get it |
|---|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Postgres connection | Supabase project settings |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Auth | Clerk dashboard |
| `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` | Real store OAuth | Shopify Partner dashboard |
| `STRIPE_SECRET_KEY` | Billing | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature check | Stripe CLI (`stripe listen`) locally, or the Dashboard webhook endpoint in prod |
| `STRIPE_PRICE_BASIC` / `STRIPE_PRICE_PRO` | Tier→Stripe-Price mapping | Stripe Dashboard → Products (must be **recurring** prices, and must belong to the **same Stripe account** as the API keys above — see §7) |
| `STRIPE_PAYMENT_LINK_<MODULE>` | Per-audit-module payment link (e.g. `..._RETENTION_X_RAY`) | Stripe Dashboard, founder-created, no API integration |
| `APP_ENCRYPTION_KEY` | Base64-encoded 32-byte AES-256-GCM key for encrypting stored Shopify tokens | Generate once (`openssl rand -base64 32`), never rotate casually (existing tokens become unreadable) |
| `CRON_SECRET` | Bearer auth for `/api/cron/tick` | `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | Real recommendation synthesis (mock LLM used when absent) | Provider dashboard |
| `LLM_MODEL` | Model identifier, defaults to a current Claude model if unset — never hardcode a different default in code | — |

```bash
pnpm --filter @ss/db push     # sync Prisma schema to the DB (see §6 — no `migrate dev` in prod)
pnpm --filter @ss/db seed     # seeds the shared demo org/store
pnpm --filter @ss/web dev     # http://localhost:3000
```

**Full verification gate** (run before any commit — this is the actual CI pipeline
too):
```bash
pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build
```

---

## 4. The core pipeline (what actually happens to a merchant's data)

This is `@ss/core` + `@ss/engine`, the part of the codebase everything else exists to
serve. Five stages, each a pure function of the stage before it:

1. **Normalize** — Shopify orders/customers/products/locations become one
   `NormalizedStore` shape. Money is `Decimal` in the DB, cast to `number` at this
   boundary. `netRevenue = totalPrice − refundedAmount` is the one revenue primitive
   every analyzer shares.
2. **Analyze** (`packages/core/src/analyzers/*.ts`) — ~12 pure functions, each
   `(NormalizedStore, context) → Metric[]`. A `Metric` is `{key, valueNumeric | null,
   unit, window}`. Any analyzer whose denominator is zero or whose required field is
   missing emits `valueNumeric: null` with an explicit insufficient-data flag —
   **never a fabricated 0**. Analyzers: Pareto/customer-concentration, RFM segments,
   cohort/repeat-purchase, replenishment interval, product affinity, SKU margin,
   discount dependency, return rate, AOV/free-ship gap, geography (branches on
   physical-vs-online), new-vs-returning mix, acquisition-source mix. Two more
   (channel profitability, owned-channel email share) are defined but permanently
   return insufficient until the integrations they need exist — named honestly rather
   than omitted.
3. **Detect signals** (`signals.ts`) — pure threshold comparisons against
   `DEFAULT_THRESHOLDS` (e.g. "top-20% revenue share > 65%"). Only metrics behind a
   *triggered* signal are ever forwarded past this point — the LLM never sees the
   full metric set, only what actually fired.
4. **Synthesize** (`@ss/engine`) — an 11-rule system prompt forces the model to only
   use provided numbers, cite which metric(s) justify each claim, and never invent a
   benchmark or a new number. Output is forced through a JSON-schema tool call, not
   free text. A deterministic mock implementation of the exact same contract exists
   so the whole pipeline runs and grounds correctly with zero API key and zero cost.
5. **Grounding validation** (`grounding.ts`) — the actual enforcement layer, not just
   a prompt instruction. Every number appearing anywhere in a recommendation's title
   or body text is traced back to a cited metric (raw, rounded, or ×100-as-percent),
   an impact-range figure, or a small allow-listed set of structural integers. A
   recommendation that cites nothing, cites an insufficient-data metric, or contains
   an untraceable number is **rejected before a user ever sees it**, not flagged
   after.
6. **Rank** — `(avg(impactLow, impactHigh) × confidence) / effortWeight`, ties broken
   by confidence then lower effort.

Everything from step 2 onward runs identically whether the store is a real connected
Shopify account or the shared read-only demo org — the demo experience is the exact
same pipeline running on synthetic seed data, not a hand-written mockup.

---

## 5. Application surface (what actually exists today)

**Public marketing:** `/`, `/how-it-works`, `/pricing`, `/privacy`, `/terms`.

**Public concierge-audit landing pages:** `/audits/{agent-ready,answer-shelf,
retention-x-ray,return-lens}` — each a pitch + lead-intake form for a paid,
founder-fulfilled diagnostic report. (`review-proof`, the 5th module, deliberately
has no landing page yet — a founder pricing/positioning call, not a gap; see
`PARKING_LOT.md`.)

**Public niche marketing pages:** `/for/{pet-brands,candle-brands,apparel-brands}` —
config-driven, each pairing the core product with one concierge-audit module,
computed demo numbers only (no hand-written stats), banned-claims-linted at build
time.

**Public shareable:** `/audit/[slug]` — a read-only snapshot of one analysis run,
SEO'd, no auth required (this is the free/viral wedge).

**Authenticated app:** `/app` (dashboard), `/app/moves/[id]` (one recommendation in
detail), `/connections` (Shopify connect/manage), `/customers`, `/geography`,
`/products` (tier-gated detail views), `/monitoring` (sync health + outcomes),
`/settings`, `/plans` (tier selection), `/onboarding`, `/internal/audit-intakes`
(founder-only lead list — currently gated by "signed in and not the demo org," which
is a placeholder, not a real role check — flagged as needing hardening before real
multi-admin use).

**API routes:** billing checkout/portal (Stripe), Shopify OAuth start/callback +
webhook receiver, Stripe webhook receiver, cron tick (bearer-secret authed, not
Clerk), CSV export, health check.

**Auth boundary:** `apps/web/middleware.ts` — Clerk-protected by default; the public
matcher list above is the complete exception list. `apps/web/lib/auth.ts`'s
`getSession()` is the single point every server-side data access goes through to
resolve a Clerk session into a tenant `orgId` (or the demo-org fallback when Clerk
isn't configured at all, e.g. in a sandbox with no auth keys set).

---

## 6. Data layer

Postgres via Prisma. Tenancy root is `Organization` → `Store` → everything else
(`Customer`, `Product`, `Order`, `OrderLineItem`, `AnalysisRun` → `Metric` +
`Recommendation` → `RecommendationOutcome`, `Audit`). `AuditIntake` (concierge-audit
leads) is deliberately **not** tenant-scoped — it's a standalone lead-capture table,
not product data.

Tenant isolation is enforced in code, not database row-level security:
`packages/db/src/tenancy.ts`'s `getOrgStore(db, orgId, storeId)` is the *only* way
any store-scoped query is allowed to run — it proves the store belongs to the org
before anything else touches it. There is deliberately no helper that accepts a bare
`storeId` without an `orgId` alongside it. An automated cross-org isolation test
exists specifically to catch a regression here.

**Migrations:** the live database is a managed Supabase Postgres whose role can't
create the shadow database `prisma migrate dev` needs. Schema changes in production
are `prisma db push` (additive only) plus a baseline-migration record kept for
history; local/CI dev can use `prisma migrate dev` normally. `packages/db/.env` is
empty on purpose — always source env from `apps/web/.env.local`.

Ingestion is idempotent (`upsert` keyed on `[storeId, shopifyId]` everywhere); a
store's `syncStatus` only flips to `READY` after every row is written, never
optimistically. Disconnecting a store cascades a full tenant-scoped purge and clears
(not deletes) the `Store` row.

---

## 7. Current known state and blockers (as of this handoff)

This app is **already live** at simplesense.co on Fly.io — this is not a first
deploy. Test-mode Stripe billing is wired and verified working end-to-end (checkout
session creation confirmed against a real Stripe test account this session).

**Confirmed human-blocked items** (don't attempt to self-serve these — they need the
account owner):
- **Live Stripe keys.** Test mode works. Going live needs: (a) live-mode API keys
  from an activated Stripe account, (b) the Basic/Pro products **recreated in live
  mode** (test and live are separate object namespaces — nothing carries over), (c)
  Settings → Billing → Customer portal → a saved default configuration in the
  Stripe Dashboard, or `/api/billing/portal` fails outright.
  **A real gotcha hit this session, worth repeating to whoever does this next:**
  Stripe lets one email belong to multiple accounts. It's easy to copy API keys from
  one account while creating products in another — this produces a "No such price"
  400 error that looks like a code bug but isn't. Verify the account ID embedded in
  the secret key (the string right after `sk_live_5`/`sk_test_5`) matches the account
  ID in the product/price URLs before assuming anything else is wrong.
- **Shopify approvals** — `read_all_orders` and protected-customer-data scopes are
  still pending. Without them, a real connected store's order history is capped at
  Shopify's default ~60-day window, not the full multi-year window the product's
  copy promises. This is a real product-completeness gap for any paying customer
  today, independent of billing.
- **Clerk production instance** — currently dev-mode Clerk keys.
- **Secret rotation** — `STATUS.md` already flagged rotating secrets that passed
  through chat at some point (Anthropic/Supabase/Shopify/Clerk); the Stripe test key
  used to verify billing this session should be added to that same rotation list —
  anything typed into a chat conversation should be treated as potentially exposed.

**Not yet wired despite existing:**
- `@ss/entities` (brand/domain/competitor registry) is built and tested but not
  connected to any module's actual run pipeline — a real integration design decision
  (does an entity become a DB model? keyed off the existing Store/org identity, or
  something new?) that's waiting on product input, not blocked technically.
- `@ss/capture-archive` has only in-memory and JSON-file backends — no DB-backed one
  yet, same "where does this actually persist long-term" question as above.
- `CRON_SECRET` is referenced by the cron workflow but needs to actually be set as
  both a Fly secret and a GitHub Actions repo secret.
- S3 (a real, multi-LLM-provider "battery" for the AnswerShelf audit module) only has
  a mock implementation — needs OpenAI/Gemini/Perplexity API keys, none configured.

**Self-declared gaps in SECURITY.md** (not hidden, worth knowing): no
Sentry/audit-logging for sensitive actions yet; the rate limiter is in-memory and
per-instance, not shared — won't hold up if the app scales past one machine; ingest
isn't transactional per-store (mitigated by the idempotent re-sync + `SYNCING`/`ERROR`
status machine, but a mid-sync crash can leave partial data until the next
successful re-sync).

---

## 8. Non-negotiable invariants — do not casually change these

These are structural product guarantees, not style preferences. If a change would
violate one of these, stop and raise it rather than routing around it:

1. **Grounding.** Never show a number that isn't computed from the store's own data.
   Missing data renders as "insufficient" or blank — never a fabricated 0 or a
   plausible-looking estimate. This extends to marketing copy too (the `/for/*` pages
   have an automated banned-claims lint and a type-level cite-or-omit rule for
   exactly this reason).
2. **Tenant isolation.** Every read or write goes through `getSession()` →
   `getOrgStore()`. The shared demo org is a read-only showcase, never a write target
   for a real session.
3. **Server-enforced tier gating.** The free tier is a *fixed* top-3 moves of a run,
   enforced at the data-loading layer. Never gate by hiding already-sent data with
   CSS — a paying-tier's full data must never be present in a free-tier response at
   all.
4. **Secrets** live only in gitignored `.env`/`.env.local` files (or the host's
   secret manager in production) — never committed, never logged, and treat anything
   that ever appeared in a chat transcript as compromised.

---

## 9. Where the rest of the context lives

This repo's memory is a set of living root-level documents, not just this one:

- `CLAUDE.md` — the standing project brief every session (human or AI) works from.
- `PROGRESS.md` — slice-by-slice build log of the core product.
- `LEDGER.md` — the same, for the concierge-audit modules and niche pages, with a
  compounding-metric focus (delivery hours per audit).
- `DECISIONS.md` — ADRs for the big structural calls (why pnpm monorepo, why
  PGlite locally, why `db push` over `migrate dev` in prod, why the LLM model is
  env-configured, etc.).
- `LEARNINGS.md` — bugs found and fixed, with the regression story behind each.
- `SECURITY.md` — the full security posture and self-declared gaps.
- `STATUS.md` — the current top-of-mind checklist (what's live, what's next).
- `PARKING_LOT.md` — decisions made autonomously that a human should glance at;
  read this before assuming something was a deliberate, reviewed choice.
- `OPEN_QUESTIONS.md` — unresolved product/design questions.
- `COMPOUND_ENGINEERING_PLAN.md` — the founder's plan for the concierge-audit
  modules (what each one is, pricing, kill-gates, build order).
- `EXECUTION_PROTOCOL.md` — the working discipline this codebase was built under
  (evidence over assertion, small verified steps, honest DONE/BLOCKED reporting).
  Worth reading before making sweeping changes — it's not decoration.
