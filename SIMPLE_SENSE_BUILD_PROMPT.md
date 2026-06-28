# SIMPLE SENSE — COMPOUND ENGINEERING BUILD PROMPT
**Version 1.2 · June 2026 · Single self-contained build specification for an autonomous coding agent**

*v1.1 updates: pricing → \$49 Basic / \$99 Pro; geo prescriptions now branch on physical-store presence (omnichannel beachhead vs online-only); analyzer catalog aligned to `SimpleSense_Insight_Library.md` and expanded (returns, per-SKU margin, free-ship threshold, replenishment cadence, channel profitability as a gated fast-follow).*

*v1.2 updates: added **§19 Design System & UI Implementation** — the SimpleSense Design System handoff (warm cream / signal-blue / clay; Instrument Serif + Inter + Manrope; Bootstrap Icons) is now the canonical UI source of truth, with verbatim tokens, the component inventory, the `MoveCard` ⇄ `Recommendation` mapping, and a screen→slice map. Cross-referenced from §0, §6, §8.3, §11.4, and Slices 2/7/8/9/10.*

> You are an autonomous senior full-stack engineer. This document is your complete brief. Read it **in full** before writing any code. It defines *what* to build (Simple Sense), *how* the system is architected, and — critically — the **self-driving build loop** you will run end to end. You will plan, build, test, self-review, record what you learned, and repeat, slice by slice, until the Definition of Done is met. Do not wait for further human prompting except where this document explicitly tells you to pause.

---

## 0. HOW TO USE THIS DOCUMENT (read first)

**Intended environment:** an agentic coding harness with **filesystem access, a shell, and git** (e.g., Claude Code, Codex, Cursor agent). If you lack one of these, state which and propose the closest workable substitute before proceeding.

**Your operating contract:**
1. Read sections 1–19 fully. Do not skim. **§19 (Design System) is the canonical UI source of truth — match it exactly and never improvise styling.**
2. Produce the **Build Plan** (Section 3, Step A) and the five **ledger files** before touching feature code.
3. Execute the **Compound Build Loop** (Section 3) over the **Build Backlog** (Section 13), one vertical slice at a time.
4. Obey the **Prime Directives** (Section 2) at all times — they outrank convenience, speed, and your own preferences.
5. When something is ambiguous: if low-risk, make a documented assumption in `OPEN_QUESTIONS.md` and proceed; if high-risk or irreversible, **stop and ask the human** (Section 16).

**Definition of "done" for the whole engagement:** every slice in Section 13 passes its acceptance criteria, the global Definition of Done (Section 15) is green, and the app runs locally from a single documented command with seed data.

---

## 1. MISSION & PRODUCT CONTEXT

### 1.1 What we are building
**Simple Sense** is an AI-powered **prescriptive** e-commerce analytics SaaS. It connects to a Shopify store, ingests its full order/customer/product history (3–5+ years), and produces a **ranked, prescriptive action list** — *what to do, why, and the expected dollar impact* — not another dashboard.

The one-line framing: *"Everyone else sells a better rear-view mirror. Simple Sense is the co-pilot telling you where to turn next."*

### 1.2 Who it is for (ICP)
DTC / omnichannel merchants doing **\$1M–\$15M GMV** on **Shopify** (Woo / BigCommerce are later), who have rich data but cannot afford a CMO, analyst, or agency. They want judgment, ranked and explained, at software price.

**Beachhead = omnichannel SMBs (a physical store *plus* Shopify)** — that is where the geo / foot-traffic prescriptions are most differentiated and least served, and it is the wedge to lead with. **Expansion = pure-ecommerce stores**, which the same engine serves with the geo *action* adjusted (regional ad / inventory placement instead of in-store pickup). The engine must **detect whether a store has physical locations and branch the geo prescription accordingly** (see §1.4 and §8.1).

### 1.3 The wedge and the business
- **Wedge:** a free **"Simple Sense Audit"** — connect your store, get one high-signal report that proves value in a single sitting.
- **Tiers (config, not hardcoded business logic):** Basic \$49/mo, Pro \$99/mo. The free Audit is the front door; **Pro** adds cohort/LTV analysis, one-click actions, multi-store, API access, and priority support.
- **The moat (build for it from day one):** a **compounding outcome loop** — every recommendation is tagged with the *measured* revenue lift it produced, so prescriptions get sharper as the install base grows. Dashboards stop at "here's your data"; we record **what actually worked**.

### 1.4 Two reference insights the product must be able to generate
These are concrete examples of the output quality bar. The engine must be *capable* of producing prescriptions of this caliber, grounded in the store's real numbers:
- **Geographic concentration (branches on store type):**
  - *Omnichannel — store has physical locations:* "82% of your customers are within 5 miles of your stores → geo-fence Meta/Google ads to that radius; turn on local pickup / BOPIS via Shopify Flow; shift budget from national spray to local high-intent." This is the **hero** prescription and the beachhead's differentiator.
  - *Online-only — no physical locations:* "40% of your revenue ships to 3 zip clusters where you hold no local inventory → place forward inventory / a second 3PL node there and run regional free-ship offers; tighten regional ad targeting." **Same geo *analysis*, different *action* — never tell an online-only store to drive foot traffic.**
- **Pareto customer economics:** "Your top 20% of customers drive ~70% of revenue → build the exact top-20% Klaviyo segment (auto-defined); launch a VIP flow (early access, private sales, higher touch); double down on the acquisition channel that produced them."

> These two are illustrative. The **full catalog of ~20 prescription types** the engine should be capable of — geo/trade-area, VIP/Pareto, channel profitability, retention timing, AOV/free-shipping, returns/margin, discount dependency, replenishment cadence, cohort quality — lives in **`SimpleSense_Insight_Library.md`**. Treat that file as the **canonical check catalog** for §8.1–8.2; each insight maps to one or more analyzers/signals.

### 1.5 What success looks like for the MVP
A merchant can: sign up → connect Shopify → wait through a transparent sync → receive a ranked list of grounded, explained prescriptions → mark one "implemented" → have the system measure and report the lift weeks later. Plus the public-facing free Audit as the acquisition wedge.

---

## 2. PRIME DIRECTIVES (hard rules — never violate)

1. **Never fabricate data or metrics. Grounding is mandatory.** Every number shown to a user — in a prescription, an impact estimate, a chart, or the Audit — must trace to a **computed metric** derived from the store's real data. The LLM is given *only* computed metrics and must reference them by id; it must never invent figures. A validation layer (Section 8.6) **rejects** any recommendation whose cited numbers do not match the computed metrics. If data is insufficient, say so explicitly ("not enough order history to compute X") — never estimate to fill a gap.
2. **Security and PII first.** Treat all merchant and customer data as sensitive PII. Encrypt secrets and OAuth tokens at rest. Never log PII or tokens. Never expose another tenant's data — enforce tenant isolation on every query (Section 11.1).
3. **Multi-tenant by construction.** Every domain row is scoped to an `organizationId`. There is no query path that can read across tenants. Write a test that proves isolation.
4. **Ask before irreversible or destructive actions.** Never drop a production DB, delete user data, force-push, rewrite shared git history, rotate live credentials, or send real emails/charges to real users without an explicit human go-ahead. In dev, destructive actions must be guarded and obvious.
5. **No silent scope creep.** Build exactly the current slice. New ideas go to `OPEN_QUESTIONS.md`, not into the code.
6. **Cost-aware AI.** LLM inference cost is the unit-economics swing factor. Cache analysis results, do deterministic math in code (not the LLM), and only call the model for *synthesis and ranking* over already-computed numbers. Make the model and token budget configurable.
7. **Tests are part of the work, not after it.** A slice is not done until its tests exist and pass. Every bug you fix becomes a regression test.
8. **Determinism where it matters.** Statistical analyzers must be pure, deterministic, and unit-tested against fixtures with known answers.
9. **Idempotent ingestion.** Re-running a sync must not duplicate data. Use upserts keyed on external ids.
10. **Document decisions as you go.** Every non-obvious choice becomes an ADR in `DECISIONS.md`.

---

## 3. THE COMPOUND BUILD LOOP (the self-driving protocol)

This is the engine of the engagement. "Compound" means **every unit of work makes the next one easier**: learnings become tests, decisions become ADRs, patterns become conventions, and the spec's open questions shrink over time.

### Step A — Bootstrap (run once, before any feature code)
1. Restate, in your own words, what Simple Sense is and the MVP scope (≤200 words). This is your comprehension check.
2. Create the repo scaffold (Section 6) and tooling (lint, format, typecheck, test, CI).
3. Create the **five ledger files** at repo root:
   - `PROGRESS.md` — the running build log (template below).
   - `DECISIONS.md` — numbered ADRs (Context / Decision / Consequences).
   - `CONVENTIONS.md` — coding standards, naming, folder rules, patterns you adopt.
   - `LEARNINGS.md` — bugs found → tests added; gotchas; non-obvious fixes.
   - `OPEN_QUESTIONS.md` — unresolved questions, each with the assumption you made and its risk level.
4. Convert Section 13 into an ordered checklist in `PROGRESS.md`.
5. Confirm the app boots (a "hello" route + a passing smoke test) and CI is green.

### Step B — The per-slice loop (repeat for each slice in Section 13)
For the current slice, run this exact cycle and **only advance when its Definition of Done is green**:

```
1. PLAN      Write a 5–12 line plan in PROGRESS.md: files to add/change,
             data model deltas, the acceptance criteria you are targeting.
2. BUILD     Implement the smallest complete vertical slice (DB → API → UI as needed).
3. TEST      Write/extend unit + integration (+ e2e where the slice is user-facing).
4. RUN       Execute typecheck, lint, and the full test suite. Fix until all green.
5. SELF-REVIEW  Apply the Self-Review Rubric (Section 3, Step C). Be your own
             harshest reviewer. Fix everything you find.
6. VERIFY    Re-run the slice's acceptance criteria explicitly, one by one,
             and record pass/fail for each in PROGRESS.md.
7. RECORD    Update ledgers: ADRs for decisions, LEARNINGS for any bug→test,
             CONVENTIONS for any new pattern, OPEN_QUESTIONS for anything deferred.
8. COMMIT    One focused commit (or small set) with a conventional-commit message
             referencing the slice (e.g., "feat(ingest): historical order backfill").
9. NEXT      Mark the slice done in PROGRESS.md and start the next slice's PLAN.
```

If a step fails repeatedly (e.g., a test won't pass after 3 honest attempts), log the blocker in `PROGRESS.md`, try a *different* approach, and only escalate to the human if it is a true external blocker (missing credential, ambiguous high-risk decision) — see Section 16.

### Step C — Self-Review Rubric (apply before marking any slice done)
- **Correctness:** Does it actually satisfy every acceptance criterion? Did I run it, not just read it?
- **Grounding (if it touches numbers):** Does every displayed figure trace to a computed metric? Did the validation layer pass?
- **Tenant isolation:** Can this code path leak another org's data? Is there a test proving it can't?
- **Errors & edges:** Empty store, zero orders, partial sync, API timeout, rate limit, malformed webhook — handled?
- **Security/PII:** Any secret or PII logged, returned, or stored unencrypted? Any unauthenticated route that shouldn't be?
- **Idempotency:** Re-run safe? No duplicates?
- **Cost:** Any unnecessary LLM call or unbounded loop? Cached where sensible?
- **Tests:** Do they assert behavior (not implementation)? Would they catch a regression?
- **Clarity:** Would the next engineer understand this in 60 seconds? Names honest? Dead code removed?

### Ledger templates

`PROGRESS.md`
```
# Build Progress

## Backlog
- [ ] Slice 0 — Repo, tooling, CI
- [ ] Slice 1 — Auth, org/user, schema
- [ ] ... (full list from Section 13)

## Current slice: <name>
Plan:
- ...
Acceptance criteria results:
- [ ] AC1 — <verbatim> — PASS/FAIL + note
Blockers:
- ...

## Log (newest first)
- <date> <slice> — <what changed, what was learned>
```

`DECISIONS.md`
```
# Architecture Decision Records

## ADR-001: <title>
Date: <date>
Context: <why a decision was needed>
Decision: <what was chosen>
Alternatives considered: <...>
Consequences: <trade-offs, what this locks in or unlocks>
```

---

## 4. ARCHITECTURE OVERVIEW

### 4.1 System shape
A multi-tenant SaaS web app with a transactional database, durable background jobs for ingestion and analysis, a grounded LLM "prescription engine," and outbound integrations. Standalone "connect-your-store" model (not a Shopify-embedded admin app for MVP — simpler, and it fits the free-Audit wedge).

```
                         ┌──────────────────────────────────────────┐
                         │                 BROWSER                    │
                         │  Next.js (App Router) UI · Tailwind ·       │
                         │  shadcn/ui · marketing site + app dashboard │
                         └───────────────┬────────────────────────────┘
                                         │ HTTPS (auth: Clerk/Auth.js)
                         ┌───────────────▼────────────────────────────┐
                         │            APP / API LAYER                  │
                         │  Next.js route handlers + server actions    │
                         │  - auth, org/user, billing (Stripe)         │
                         │  - Shopify OAuth + connection mgmt          │
                         │  - read APIs for recommendations/audit      │
                         └──────┬───────────────────────┬──────────────┘
                                │ enqueue                │ read/write
                  ┌─────────────▼─────────────┐   ┌──────▼───────────────┐
                  │  BACKGROUND JOBS (Inngest) │   │  POSTGRES (Neon/      │
                  │  - historical backfill     │◄──┤  Supabase) + Prisma   │
                  │  - webhook sync            │   │  tenant-scoped schema │
                  │  - analysis pipeline       │   └──────▲───────────────┘
                  │  - outcome measurement     │          │
                  └───┬───────────────┬────────┘          │
        ingest (GraphQL)             │ compute            │ persist metrics +
        ┌─────────────▼───┐   ┌───────▼────────────┐       │ recommendations
        │  SHOPIFY Admin   │   │ PRESCRIPTION ENGINE │──────┘
        │  API + webhooks  │   │ 1 analyzers (pure)  │
        └──────────────────┘   │ 2 signal detection  │
                               │ 3 LLM synthesis     │──► ANTHROPIC CLAUDE API
                               │ 4 grounding validate│    (structured output)
                               │ 5 ranking           │
                               └─────────┬───────────┘
                                         │ execution exports (MVP) / deep (later)
                   ┌──────────────┬──────┴───────┬───────────────┐
                   ▼              ▼              ▼               ▼
               KLAVIYO        META ADS       GOOGLE ADS        RESEND
            (segment export) (action export)(action export)  (email)
```

### 4.2 Data flow (happy path)
1. Merchant signs up → org + user created.
2. Merchant connects Shopify (OAuth) → encrypted token stored, webhooks registered.
3. **Historical backfill** job paginates orders/customers/products into normalized analytics tables (idempotent upserts).
4. **Analysis pipeline** runs: pure analyzers compute metrics → signal detection flags noteworthy metrics → LLM synthesizes ranked prescriptions grounded in those metrics → grounding validation → ranking → persisted as `Recommendation` rows.
5. Dashboard renders ranked, explained prescriptions; the public **Audit** renders a curated subset.
6. Merchant marks a recommendation **implemented** → an **outcome measurement** job schedules a before/after lift computation over an attribution window → result persisted → feeds the flywheel and future ranking confidence.

---

## 5. TECH STACK (chosen, with rationale)

Pin to these unless you hit a hard blocker; if you deviate, record an ADR with the reason.

| Layer | Choice | Why | Acceptable alt |
|---|---|---|---|
| Language | **TypeScript** (strict) | One language across app + jobs; strong types for a data product | — |
| Web framework | **Next.js (App Router)** | Full-stack, fast to ship, great DX, Vercel-native | Remix |
| UI | **Tailwind + shadcn/ui** | Speed + clean, consistent components | — |
| Auth | **Clerk** (or Auth.js) | Drop-in orgs/users/multi-tenant; fastest path | Auth.js + custom org model |
| DB | **Postgres** (Neon or Supabase) | Relational order data + analytics; mature | — |
| ORM/migrations | **Prisma** | Type-safe schema + migrations the agent can drive | Drizzle |
| Background jobs | **Inngest** | Durable, retryable, serverless functions; ideal for paginated backfill + scheduled outcome jobs | Trigger.dev; BullMQ+Redis |
| Heavy analytics (optional) | **DuckDB** in-process | Fast OLAP over a store's history without hammering Postgres | Pure SQL in Postgres |
| LLM | **Anthropic Claude API** | Grounded synthesis with structured output / tool use. Use the current recommended model via env var; verify the latest model string at docs.claude.com. **Do not hardcode a model that may be stale.** | — |
| Payments | **Stripe** (Billing) | Flexible tiered subscriptions for a standalone SaaS | Shopify Billing API (if you later embed) |
| Email | **Resend** | Simple transactional email | Postmark |
| Product analytics | **PostHog** | Funnels, activation tracking | — |
| Errors/observability | **Sentry** + structured logs | Catch + triage | — |
| Testing | **Vitest** (unit/integration), **Playwright** (e2e) | Fast, TS-native | — |
| CI | **GitHub Actions** | typecheck + lint + test on PR | — |
| Hosting | **Vercel** (app) + managed Postgres + **Inngest Cloud** | Low ops, scales with usage | — |

**Repo manager:** pnpm workspaces (or Turborepo if you prefer task caching).

---

## 6. REPOSITORY STRUCTURE

```
simple-sense/
├─ README.md                  # how to run, env setup, architecture summary
├─ PROGRESS.md DECISIONS.md CONVENTIONS.md LEARNINGS.md OPEN_QUESTIONS.md
├─ .env.example               # every required var (Section 12), no real secrets
├─ .github/workflows/ci.yml
├─ apps/
│  └─ web/                     # Next.js app (marketing + app + API route handlers)
│     ├─ app/                  # routes (public Audit, dashboard, auth, api/*)
│     ├─ components/           # UI (shadcn-based)
│     └─ lib/                  # client/server utils
├─ packages/
│  ├─ db/                      # Prisma schema, migrations, seed, typed client
│  ├─ core/                    # domain logic: analyzers, signals, ranking (PURE, framework-free)
│  ├─ engine/                  # prescription engine: orchestration + LLM client + grounding validation
│  ├─ integrations/            # shopify, klaviyo, meta, google, stripe, resend clients
│  ├─ jobs/                    # Inngest functions: backfill, webhook-sync, analyze, measure-outcome
│  ├─ ui/                       # design system: tokens (globals.css) + ported components (Button, Badge, Card, Input, Avatar, MetricCard, MoveCard) + SVG charts — vendored from the SimpleSense Design System handoff (§19)
│  └─ config/                  # shared config, tier definitions, thresholds
└─ test/                       # fixtures with known-answer datasets for analyzers
```

**Rule:** `packages/core` is **pure and deterministic** — no network, no framework, no I/O. This is what makes the analyzers trivially testable and the grounding guarantee enforceable.

**UI rule:** the **§19 Design System** is the canonical visual source of truth — vendor its tokens + components and recreate the screens exactly; never improvise styling or hardcode hex/spacing (the bundle ships an adherence lint config).

---

## 7. DATA MODEL

Tenant-scoped relational model. Sketch (Prisma-style; refine as needed, record schema ADRs):

```prisma
model Organization { id String @id @default(cuid()) name String createdAt DateTime @default(now())
  users User[] stores Store[] subscription Subscription? }

model User { id String @id @default(cuid()) orgId String email String @unique role Role
  org Organization @relation(fields:[orgId], references:[id]) }

model Store {                 // a connected Shopify shop
  id String @id @default(cuid()) orgId String shopDomain String @unique
  accessTokenEnc String        // ENCRYPTED at rest, never logged
  syncStatus SyncStatus @default(PENDING) lastSyncedAt DateTime?
  org Organization @relation(fields:[orgId], references:[id]) }

// --- Ingested analytics data (idempotent upserts keyed on shopify ids) ---
model Customer { id String @id storeId String shopifyId BigInt email String? city String?
  region String? country String? lat Float? lng Float? firstOrderAt DateTime?
  @@unique([storeId, shopifyId]) }
model Product  { id String @id storeId String shopifyId BigInt title String type String?
  @@unique([storeId, shopifyId]) }
model Order { id String @id storeId String shopifyId BigInt customerId String? totalPrice Decimal
  currency String discountTotal Decimal createdAt DateTime
  @@unique([storeId, shopifyId]) }
model OrderLineItem { id String @id orderId String productId String? qty Int price Decimal }

// --- Analysis outputs ---
model AnalysisRun { id String @id storeId String startedAt DateTime finishedAt DateTime?
  status RunStatus }
model Metric {                 // every computed fact lives here; the grounding source of truth
  id String @id runId String key String        // e.g. "pareto.top20_revenue_share"
  valueNumeric Float? valueJson Json? unit String? window String? }  // window e.g. "trailing_24m"
model Recommendation {
  id String @id runId String storeId String category String title String
  rationale String                    // explanation in plain language
  evidenceMetricIds String[]          // MUST reference Metric ids actually used
  impactLow Float impactHigh Float impactUnit String   // e.g. USD/month range
  effort Effort confidence Float rankScore Float status RecStatus @default(NEW)
  suggestedExecution Json }           // structured "how to do it" (e.g., segment def, ad change)
model RecommendationOutcome {
  id String @id recommendationId String implementedAt DateTime
  measurementWindowDays Int baselineValue Float? measuredValue Float? liftValue Float?
  liftConfidence Float? status OutcomeStatus }

model Audit { id String @id storeId String createdAt DateTime publicSlug String @unique
  recommendationIds String[] }        // curated subset for the free wedge
model Subscription { id String @id orgId String stripeCustomerId String tier Tier
  status SubStatus currentPeriodEnd DateTime }
```

Enums: `Role`, `SyncStatus(PENDING|SYNCING|READY|ERROR)`, `RunStatus`, `Effort(LOW|MED|HIGH)`, `RecStatus(NEW|VIEWED|IMPLEMENTED|DISMISSED)`, `OutcomeStatus(SCHEDULED|MEASURED|INCONCLUSIVE)`, `Tier(ESSENTIALS|GROWTH|OPERATOR)`.

---

## 8. THE PRESCRIPTION ENGINE (the heart — build this carefully)

A 5-stage pipeline. Stages 1–2 and 5 live in `packages/core` (pure, deterministic, unit-tested). Stage 3 is the only LLM call. Stage 4 enforces grounding.

### 8.1 Stage 1 — Analyzers (pure functions, deterministic)
Each analyzer takes normalized data and returns `Metric` records. The **canonical catalog of checks is `SimpleSense_Insight_Library.md`** (each library entry maps to one or more analyzers/signals). Implement the **MVP set** (computable from Shopify data alone) now; **stub the connected-data set behind feature flags**.

**MVP analyzers (Shopify order/customer/product data only):**
- **Pareto / customer concentration** — revenue share of top 1/5/10/20% of customers.
- **Geographic concentration (branches on store type)** — revenue share by region and by radius / zip-cluster from ship-to addresses. **If the store has physical locations** (Shopify POS locations / local-pickup enabled): also compute share within N-mile / drive-time of each store and **trade-area overlap** between stores, and emit a BOPIS / foot-traffic-eligible signal. **If online-only:** emit a regional-inventory / regional-offer signal instead. Record `has_physical_locations` on the metric so Stages 2–3 select the correct action.
- **RFM segmentation** — recency/frequency/monetary buckets; size + value per segment.
- **Cohort retention / repeat-purchase** — first-purchase cohorts, repeat rate, **time-to-second-order and 2nd→3rd-order conversion**.
- **Replenishment cadence** — for repeat-purchased SKUs, the median reorder interval (to time replenishment prescriptions against the store's current reminder timing).
- **Product affinity / cross-sell** — frequently co-purchased products.
- **Per-SKU true margin & Pareto** — contribution by SKU net of discounts and (where return data exists) returns; flag money-losing SKUs.
- **Discount dependency** — share of revenue / orders tied to discount codes; margin signal.
- **Returns analysis** — return rate overall and by SKU/category where Shopify return data exists; flag outliers.
- **AOV & free-shipping-threshold gap** — AOV trend, and whether the configured free-ship threshold sits below / at / above AOV.
- **New vs returning revenue mix** over the window.
- **Acquisition mix (Shopify-native)** — revenue by `source` / UTM where present (first-order attribution only).

**Connected-data analyzers — implement behind flags as fast-follows (do NOT block MVP):**
- **Channel profitability / LTV:CAC by source** — requires **ad-spend** from Meta/Google (read scope) joined to cohort LTV. First-order CAC is misleading, so this is explicitly *not* MVP and must be clearly gated. This is one of the three signature insight themes — **name it, flag the dependency, never fabricate it** from Shopify data alone.
- **Owned-channel share & flow coverage** — requires **Klaviyo** read data (email/SMS revenue share; which lifecycle flows exist) to flag "owned channel underperforming" and "missing flows."

Each analyzer must: handle empty/sparse data gracefully (emit "insufficient data" rather than a number), be unit-tested against fixtures with **known answers**, and be windowed (e.g., trailing 24 months) with the window recorded on the metric.

### 8.2 Stage 2 — Signal detection
Pure rules that mark a metric as *noteworthy* and worth turning into a prescription, with tunable thresholds in `packages/config` (e.g., `top20_revenue_share > 0.65` → VIP opportunity; `single_region_share > 0.5` → geo-focus opportunity; `discount_revenue_share > 0.4` → margin risk; `freeship_threshold < aov` → AOV-lift opportunity; `sku_margin_after_returns < 0` → kill/reprice signal; `replenishment_reminder_gap_days > reorder_cadence` → mistimed-reorder signal; `repeat_rate < category_benchmark` → retention-gap signal). The geo signal carries the `has_physical_locations` flag so Stage 3 selects the BOPIS vs regional-inventory action. Output: a list of `Signal { metricId, type, severity, context }`.

### 8.3 Stage 3 — LLM synthesis (grounded, structured)
Feed the model **only** the detected signals and their underlying metric values. The model's job is *judgment and articulation*, not arithmetic: turn signals into ranked, plainly-explained prescriptions with an expected-impact **range** and a concrete suggested execution. It must reference metrics by id and must not introduce any number not present in the input.

**Use structured output / tool-use to force this JSON schema** (one object per recommendation):
```json
{
  "category": "string (e.g. 'VIP / retention', 'Geo / acquisition', 'Channel profitability', 'AOV / shipping', 'Returns / margin', 'Lifecycle / timing')",
  "title": "string, action-first, <= 80 chars",
  "rationale": "string, plain language, explains the move and the why",
  "evidence_metric_ids": ["string"],          // MUST be ids from the input
  "impact_low": 0, "impact_high": 0, "impact_unit": "USD/month",
  "effort": "LOW|MED|HIGH",
  "confidence": 0.0,                           // 0..1
  "suggested_execution": {                     // concrete, tool-ready where possible
    "type": "klaviyo_segment | meta_geofence | shopify_flow | manual | ...",
    "spec": {}                                  // e.g. segment definition, radius, etc.
  }
}
```

**Embedded system prompt for Stage 3** (implement verbatim as the engine's system prompt; tune wording but not the rules):
> You are the prescription engine for Simple Sense, an advisor to a \$1M–\$15M Shopify merchant. You are given a set of SIGNALS, each with the exact computed metrics behind it. Produce a list of prescriptive recommendations in the required JSON schema. Hard rules: (1) Use ONLY the numbers provided — never invent, round beyond the source precision, or extrapolate a figure that is not given. (2) Every recommendation must cite the metric ids it relies on in `evidence_metric_ids`. (3) `impact_low`/`impact_high` must be a defensible range derived from the provided metrics; if you cannot ground an impact in the data, set both to 0 and say so in the rationale. (4) Be specific and operator-grade: each recommendation says exactly what to do, why, and the expected effect. (5) Prefer fewer, higher-conviction moves over a long weak list. (6) No hype, no vague "optimize" language. (7) For geo/acquisition signals, honor the `has_physical_locations` flag: if true, you may recommend local pickup / BOPIS / foot-traffic plays; if false, recommend regional ad-targeting, inventory placement, or regional shipping offers instead — never tell an online-only store to drive in-store foot traffic. Return only valid JSON.

Make the **model id and max-token budget configurable** (env). Log token usage per run for cost tracking (no PII in logs).

**Prescription output copy follows the §19 brand voice** — Pattern → Why → Move → Impact, the noun "moves," sentence case, ranged grounded numbers, no emoji. Each `Recommendation` renders into the signature **`MoveCard`** (§19): `category`→category, the finding/`title`→pattern (serif), `rationale`→why, the `suggested_execution` steps→the ✓ "moves" list, the `impact_low–impact_high` range→the impact badge, `confidence`→confidence, and **Apply this move** marks it `IMPLEMENTED` (triggers the §8.6 outcome job).

### 8.4 Stage 4 — Grounding validation (the guardrail)
A pure validator that, for each returned recommendation: confirms every `evidence_metric_id` exists in the run's metrics; confirms any numeric claim in `rationale`/impact is consistent with those metrics (within source precision); **rejects or quarantines** any recommendation that fails. Rejections are logged to `LEARNINGS.md` patterns and surfaced in dev. **This is the enforcement of Prime Directive #1 — it must exist and be tested.**

### 8.5 Stage 5 — Ranking
Deterministic score, e.g. `rankScore = (expectedImpactMidpoint * confidence) / effortWeight`, with `effortWeight` from `{LOW:1, MED:2, HIGH:3.5}`. Sort descending. Persist `Recommendation` rows. Make the formula a single pure function with unit tests.

### 8.6 The flywheel — outcome measurement
When a recommendation is marked `IMPLEMENTED`: schedule a job that, after the attribution window, computes the relevant metric **before vs after** and writes a `RecommendationOutcome` (lift + confidence, or `INCONCLUSIVE`). Over time these outcomes (a) display as proof to the merchant and (b) feed `confidence` priors for similar future recommendations. Keep the cross-merchant learning **aggregated and privacy-safe** (no raw cross-tenant data leakage) — log an ADR for how aggregation respects tenant isolation.

---

## 9. EXTERNAL INTEGRATIONS

| Integration | MVP scope | Later |
|---|---|---|
| **Shopify Admin API** (GraphQL) + webhooks | OAuth connect; backfill orders/customers/products; webhook sync for new orders; idempotent upserts | App Store listing; embedded App Bridge UI |
| **Klaviyo** | Generate/export the recommended segment definition (e.g., top-20% VIP) | One-click create segment + flow via API |
| **Meta Ads** | Output the geo-fence / audience action as a clear, copy-ready spec | API-driven campaign edits |
| **Google Ads** | Same — export the recommended change | API-driven changes |
| **Stripe** | Tiered subscriptions (\$49 Basic / \$99 Pro), plan gating, webhooks for status | Usage-based add-ons |
| **Resend** | Transactional: welcome, sync-complete, "your audit is ready", outcome report | Lifecycle campaigns |

**Note on inbound data:** the Meta / Google / Klaviyo rows above are MVP **outbound** (action exports) only. Their **inbound read scopes** — ad spend (Meta/Google) and email/SMS revenue + flow inventory (Klaviyo) — are what power the **fast-follow channel-profitability and owned-channel analyzers** in §8.1. Wire the inbound side later; do not block MVP on it.

**Integration rules:** every external client lives in `packages/integrations` behind a typed interface, with retries + backoff, rate-limit handling, and a **mock implementation** for tests. Never call a live external API in unit tests.

---

## 10. API SURFACE (key contracts — refine as you build)

Authenticated, tenant-scoped unless noted. (Illustrative; implement as route handlers/server actions.)
- `POST /api/stores/connect/start` → Shopify OAuth redirect.
- `GET  /api/stores/connect/callback` → exchange code, store encrypted token, register webhooks, enqueue backfill.
- `GET  /api/stores/:id/status` → sync status + progress.
- `POST /api/webhooks/shopify` → verify HMAC, enqueue sync (no PII logged).
- `POST /api/analysis/:storeId/run` → enqueue analysis pipeline.
- `GET  /api/recommendations?storeId=` → ranked recommendations.
- `POST /api/recommendations/:id/status` → mark VIEWED/IMPLEMENTED/DISMISSED; IMPLEMENTED schedules outcome job.
- `GET  /api/outcomes?storeId=` → measured lifts.
- `POST /api/audit/:storeId` → generate public Audit; returns `publicSlug`.
- `GET  /audit/:slug` → **public** read-only Audit page (no auth; expose only curated, non-PII content).
- `POST /api/billing/checkout` and `POST /api/webhooks/stripe`.

Every handler: validate input (zod), enforce org scope, handle errors with typed responses, never leak internal detail or PII.

---

## 11. NON-FUNCTIONAL REQUIREMENTS

### 11.1 Security & privacy (SOC 2-aware posture)
- Encrypt OAuth tokens and any secret at rest (app-level encryption or a managed KMS/secret store). Never log them.
- Tenant isolation enforced on every query; write an automated test that attempts a cross-tenant read and asserts it fails.
- Validate and HMAC-verify all inbound webhooks.
- PII minimization: only ingest fields the analyzers need; never render raw customer PII on the public Audit.
- Audit logging for sensitive actions (connect, disconnect, data export, billing) — without storing PII.
- Document a `SECURITY.md` posture (data flows, what's stored, retention, deletion on disconnect) to seed the SOC 2 roadmap.
- **Data deletion:** disconnecting a store purges its ingested data; implement and test it.

### 11.2 Performance & cost
- Backfill paginates and rate-limit-respects Shopify; resumable on failure.
- Analysis caches metrics per run; do not recompute or re-call the LLM unnecessarily.
- LLM: one synthesis call per analysis run over compact, pre-aggregated signals (not raw rows). Track tokens/cost per run.
- Reasonable p95 dashboard load; analysis runs async with transparent progress.

### 11.3 Reliability & observability
- Sentry for errors; structured request logs (PII-scrubbed).
- Jobs are retryable and idempotent; surface sync/analysis failures to the user clearly.
- PostHog activation funnel: signup → connect → sync complete → first recommendation viewed → recommendation implemented.

### 11.4 Accessibility & UX
- WCAG-minded components; keyboard-navigable; clear empty/loading/error states (esp. "syncing your history" and "not enough data yet").
- **Visuals follow §19 (Design System) exactly** — the warm tokens, the component library, and the screen layouts in the handoff bundle; never improvise styling.

---

## 12. ENVIRONMENT & SECRETS (`.env.example`)

Provide every key (no real values). At minimum:
```
DATABASE_URL=
DIRECT_URL=
CLERK_SECRET_KEY=            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
APP_ENCRYPTION_KEY=          # for token encryption at rest
SHOPIFY_API_KEY=             SHOPIFY_API_SECRET=   SHOPIFY_SCOPES=   SHOPIFY_APP_URL=
ANTHROPIC_API_KEY=           LLM_MODEL=            LLM_MAX_TOKENS=
INNGEST_EVENT_KEY=           INNGEST_SIGNING_KEY=
STRIPE_SECRET_KEY=           STRIPE_WEBHOOK_SECRET=  STRIPE_PRICE_ESSENTIALS=  STRIPE_PRICE_GROWTH=  STRIPE_PRICE_OPERATOR=
KLAVIYO_API_KEY=             META_ACCESS_TOKEN=     GOOGLE_ADS_*=
RESEND_API_KEY=              SENTRY_DSN=            NEXT_PUBLIC_POSTHOG_KEY=
```
Fail fast at startup if a required var is missing (validated config module).

---

## 13. THE BUILD BACKLOG (ordered vertical slices)

Build in this order. Each slice ships something testable end-to-end. **Acceptance Criteria (AC)** are the contract; **Tests** are mandatory.

### Slice 0 — Repo, tooling, CI
- **Goal:** Bootable monorepo with lint/format/typecheck/test + green CI.
- **AC:** `pnpm install && pnpm dev` boots a hello route; `pnpm test` runs a passing smoke test; CI green on push; all five ledger files exist.
- **Tests:** smoke test for the hello route + a trivial pure-function test in `core`.

### Slice 1 — Auth, org/user, schema, migrations
- **Goal:** Multi-tenant foundation.
- **AC:** A user can sign up and is attached to an Organization; Prisma schema + migrations applied; seed script creates a demo org/user; **a test proves a query scoped to org A cannot read org B's rows.**
- **Tests:** auth flow integration; tenant-isolation test.

### Slice 2 — Shopify OAuth connect
- **Goal:** Connect a store; store encrypted token.
- **AC:** OAuth start→callback works against a dev store; token stored **encrypted**; webhooks registered; `Store.syncStatus = PENDING`; disconnect purges store data (stubbed data ok for now).
- **Tests:** callback handler with mocked Shopify; encryption round-trip; HMAC webhook verification.

### Slice 3 — Historical ingestion (background)
- **Goal:** Backfill orders/customers/products durably and idempotently.
- **AC:** Inngest backfill paginates and upserts; re-running produces **no duplicates**; progress + `syncStatus` transitions PENDING→SYNCING→READY; handles rate limits and resumes after failure.
- **Tests:** idempotency (run twice → same row count); pagination over a mocked multi-page dataset; failure-resume.

### Slice 4 — Analyzers (pure, deterministic)
- **Goal:** Compute the core metrics.
- **AC:** The **MVP analyzers in §8.1** — Pareto, geo concentration *with the physical-vs-online branch + trade-area overlap*, RFM, cohort/repeat (incl. 2nd→3rd-order), replenishment cadence, per-SKU true margin, discount dependency, returns, AOV + free-ship-threshold gap, new-vs-returning, Shopify-native acquisition mix — implemented in `core`; each emits `Metric` records with window; `has_physical_locations` recorded on geo metrics; sparse/empty data yields "insufficient data," not a fabricated number. Channel-profitability/LTV:CAC and owned-channel analyzers are **stubbed behind flags** (need external data — see §8.1).
- **Tests:** **known-answer fixtures** for every analyzer (hand-computed expected values); empty-data behavior.

### Slice 5 — Signal detection
- **Goal:** Flag noteworthy metrics with tunable thresholds.
- **AC:** Signals produced from metrics using config thresholds; severity assigned; thresholds documented in `config`.
- **Tests:** threshold boundary tests (just-under vs just-over).

### Slice 6 — LLM prescription synthesis + grounding validation + ranking
- **Goal:** Turn signals into ranked, grounded prescriptions.
- **AC:** Engine calls the LLM with signals only, gets schema-valid JSON; **grounding validator rejects any recommendation citing unknown metrics or numbers not in the input**; ranking formula orders results; `Recommendation` rows persisted; token usage logged. With a fixture store, the engine produces the **Pareto VIP** and **geo-concentration** style prescriptions, each citing real metric ids.
- **Tests:** schema validation; **grounding-rejection test** (inject a hallucinated number → must be rejected); ranking unit test; an engine integration test with a mocked LLM returning canned JSON.

### Slice 7 — Dashboard (ranked prescriptions)
- **Goal:** Merchant-facing ranked list — the **"This week's moves"** screen (§19) — with rationale/impact/effort and suggested execution.
- **AC:** Authenticated dashboard in the app shell (sidebar + sticky topbar, §19) lists recommendations sorted by rank, **each rendered as a `MoveCard`** (rank / pattern / why / ✓ moves / impact / confidence); a **`MoveDetailView`** opens a single move; empty/syncing/error states handled; mark VIEWED/DISMISSED works. Visuals match §19 exactly (warm tokens, no hardcoded styles).
- **Tests:** e2e (Playwright): sign in → see recommendations → dismiss one.

### Slice 8 — The free "Simple Sense Audit" (the wedge)
- **Goal:** Public, shareable report from a curated subset — the **"Store audit"** view (`AuditView`, §19).
- **AC:** Generating an Audit produces a `publicSlug`; `/audit/:slug` renders read-only (styled per §19, curated `MoveCard`s), contains **no raw customer PII**, and shows 2–3 highest-conviction grounded insights; shareable link works unauthenticated.
- **Tests:** public route renders without auth; PII-leakage assertion (no emails/names in the public payload).

### Slice 9 — Outcome tracking (flywheel)
- **Goal:** Measure lift after implementation.
- **AC:** Marking IMPLEMENTED schedules an outcome job; after the window, baseline vs measured lift computed and stored (or INCONCLUSIVE); outcomes display to the merchant; cross-tenant aggregation (if any) is privacy-safe (ADR written).
- **Tests:** outcome computation over a fixture with a known lift; scheduling logic; isolation of aggregation.

### Slice 10 — Billing (Stripe tiers) + gating
- **Goal:** Monetize with three tiers.
- **AC:** Checkout creates a subscription at the chosen tier; Stripe webhooks update status; plan gates features (define what each tier unlocks in `config`); trial/free-Audit path preserved.
- **Tests:** webhook handling (mocked Stripe events); gating logic per tier.

### Slice 11 — Integration exports (Klaviyo/Meta/Google)
- **Goal:** Make prescriptions actionable.
- **AC:** For relevant recommendations, produce copy-ready/export specs (e.g., a Klaviyo segment definition for the VIP cohort; a geo-fence spec for Meta/Google); behind typed interfaces with mocks.
- **Tests:** export spec generation from a fixture recommendation.

### Slice 12 — Hardening
- **Goal:** Security, reliability, observability, cost.
- **AC:** Sentry wired; PII-scrubbed logging verified; rate limits on sensitive routes; `SECURITY.md` written; data-deletion-on-disconnect implemented and tested; token-cost logging confirmed; config fails fast on missing env.
- **Tests:** logging scrubber test; deletion test; an automated check that no secret/PII appears in logs for a sample flow.

### Slice 13 — Polish & onboarding
- **Goal:** First-run experience.
- **AC:** Guided onboarding (connect → sync → first Audit); strong empty/loading states; activation events firing to PostHog; README complete with run instructions and architecture summary.
- **Tests:** e2e of the full onboarding happy path.

---

## 14. TESTING & QA STRATEGY
- **Unit:** all `core` analyzers, signal rules, ranking, grounding validator — against known-answer fixtures. This is the highest-value test surface; invest here.
- **Integration:** ingestion idempotency, engine with mocked LLM, webhook verification, billing webhooks.
- **E2E (Playwright):** signup→connect→sync→recommendations→implement; public Audit.
- **Security tests:** tenant isolation, PII non-leakage, log scrubbing, deletion-on-disconnect.
- **No live external calls in tests** — always use the package mocks.
- Target meaningful coverage on `core` and `engine` specifically (the parts where correctness = product credibility).

---

## 15. DEFINITION OF DONE (global)
The engagement is done when **all** are true:
1. Every slice's AC passes (recorded in `PROGRESS.md`).
2. `pnpm typecheck && pnpm lint && pnpm test` are green; CI passes.
3. App runs locally from documented commands with a seed/fixture store and produces grounded recommendations + a public Audit.
4. Prime Directive #1 is provably enforced (grounding-rejection test passes).
5. Tenant isolation, PII non-leakage, and deletion-on-disconnect tests pass.
6. `README.md`, `SECURITY.md`, and all five ledgers are complete and current.
7. `OPEN_QUESTIONS.md` lists every assumption made, each with its risk level, for human review.

---

## 16. GUARDRAILS & ANTI-PATTERNS (what NOT to do)
- **Do not** let the LLM compute or invent numbers. Math is code; the model only explains and ranks.
- **Do not** build outside the current slice. Park ideas in `OPEN_QUESTIONS.md`.
- **Do not** call live external APIs in tests, or hit real merchant data in dev without explicit seed/fixtures.
- **Do not** perform irreversible actions (drop DB, delete user data, force-push, send real emails/charges) without explicit human approval. **Pause and ask** for: schema changes that drop data, anything touching production, rotating live credentials, or a high-impact ambiguous decision with no clearly-low-risk default.
- **Do not** log secrets or PII, ever.
- **Do not** mark a slice done without running it and checking each AC explicitly.
- **Do not** hardcode a possibly-stale LLM model string — read it from config and note to verify the current model.

When you must pause for the human, post: the decision needed, the options with trade-offs, your recommended default, and what you'll assume if you proceed.

---

## 17. OPEN QUESTIONS & ASSUMPTIONS (resolve or confirm before/while building)
The human (Satya) will confirm these; until then, make the **stated default assumption**, record it in `OPEN_QUESTIONS.md`, and proceed where low-risk:
1. **Auth provider:** default **Clerk** for speed. (Alt: Auth.js.)
2. **Embedded vs standalone Shopify app:** default **standalone connect-your-store** for MVP (fits the free-Audit wedge). Embedded App Bridge is later.
3. **DuckDB vs pure Postgres** for analyzers: default **Postgres-only** for MVP simplicity; add DuckDB only if performance demands.
4. **Tier feature gating specifics:** default — **Basic (\$49)** = core ranked recommendations + 1 store + the free Audit; **Pro (\$99)** = + cohort/LTV analysis, integration exports + one-click actions, outcome-tracking depth, multi-store, API access, priority support, more frequent re-analysis. **Confirm the exact split.**
5. **Attribution window for outcome measurement:** default **30 days**; confirm.
6. **LLM model + token budget:** set via env; confirm the current recommended Claude model at build time.
7. **Hosting accounts/keys:** assume the human provisions Shopify dev store, Anthropic, Stripe, Inngest, Neon/Supabase, Clerk, Resend keys. Flag any missing key as an external blocker.
8. **Brand/legal:** name "Simple Sense," domain SimpleSense.co. No faith/cause positioning in product or copy (keep it operator-focused). The **SimpleSense Design System handoff bundle** is provided in-repo and is the canonical UI source of truth (§19) — vendor it. **Reconcile:** the product UI uses the warm cream / signal-blue / clay system, which differs from the older investor-deck navy/teal — decide whether to re-skin the deck to match or knowingly keep two aesthetics.

---

## 18. FIRST ACTION (do this now)
1. Restate the MVP in ≤200 words (comprehension check).
2. Scaffold the repo (Section 6), tooling, CI, and the five ledgers.
3. Write `PROGRESS.md` with the Section 13 backlog as a checklist.
4. Begin **Slice 0**, then enter the **Compound Build Loop** (Section 3) and proceed through the backlog, pausing only per Section 16.

---

## 19. DESIGN SYSTEM & UI IMPLEMENTATION (canonical — match exactly)

The product's look, components, and voice are **already designed**. The **SimpleSense Design System handoff bundle** (exported from Claude Design; folder `simplesense-design-system/`) is the **single visual source of truth** for both surfaces — the **marketing site** and the **operator app**. Vendor it into the repo and recreate the screens pixel-perfectly. Its own `README.md` ("Visual Foundations", "Content Fundamentals") and `SKILL.md` are authoritative — read them top-to-bottom and follow their imports. Do **not** screenshot the prototypes; every value is in the source.

### 19.0 How to consume it (in this stack)
1. **Tokens → CSS variables + Tailwind theme.** Copy `tokens/*.css` (colors, typography, spacing, base) into the app's `globals.css` so all `--ss-*` vars **and the semantic aliases** (`--surface-card`, `--action-primary`, `--text-strong`, `--border-hairline`, …) are defined at `:root`. Map those vars into the Tailwind theme (colors, spacing, borderRadius, fontFamily, boxShadow) so utilities resolve to tokens — never hardcode hex or px.
2. **Fonts & icons.** Vendor **Inter** (local woff2, variable 100–900) and the **Bootstrap Icons** webfont (`assets/vendor/bootstrap-icons/`) into the repo; load **Instrument Serif** and **Manrope** from Google Fonts (or drop licensed files in `assets/fonts/` and update `tokens/fonts.css`). Icons are `<i class="bi bi-…">`, inheriting `currentColor`.
3. **Components.** Port the React primitives (already React + token-driven) into `packages/ui`, preserving every variant/prop (§19.3). The branded primitives — especially **`MoveCard`** and **`MetricCard`** — are the source of truth for their roles; do **not** replace them with generic shadcn equivalents (shadcn may coexist for un-branded plumbing).
4. **Charts.** Port the custom SVG chart set (§19.4); do **not** swap in recharts/chart.js with default styling.
5. **Adherence.** The bundle ships `_adherence.oxlintrc.json` — wire it (or an equivalent lint rule) so hardcoded colors/spacing fail CI. The `frontend-design` skill applies.

### 19.1 Brand voice (the product's words — the engine must obey this)
Operator-to-operator: a seasoned shopkeeper next to you on Monday morning. **Second person** ("your store"), often first-person co-pilot ("here's what I'd do"); never "users." Every recommendation follows **Pattern → Why → Move → Expected impact**, grounded in the store's own numbers. **Sentence case** everywhere, except the wordmark and section eyebrows, which are **letter-spaced all-caps** (`S I M P L E   S E N S E`) via `.ss-eyebrow`. Numbers are **concrete and ranged**, never falsely precise (`\$1.1–1.5M`, `10–15 hrs/week`). Vocabulary: *prescriptive · moves · the next move · operator · co-pilot · rear-view mirror · flywheel · ranked · why · impact range*. Avoid: *synergy, leverage* (verb)*, seamless, revolutionary,* and "AI-powered" (say what it **does**). **No emoji** — the only glyph allowed in running text is a plain `✓`. This voice governs all `Recommendation` output copy from §8.3.

### 19.2 Tokens (verbatim — full set in `tokens/`)
**Color.** Page bg cream `#f4f1ea` · card/surface `#fffdf9` · soft surface `#ece7dc` · hairline border `#e4ddcf` · strong divider `#d8cfbd` · ink `#211c15` · secondary text `#4a4234` · muted `#837a68`. Primary **signal blue** `#0871e7` (hover `#0860c4`, active `#074fa0`). Accent **clay** `#c25a3c` (deep `#a8492f`). **Blossom pink** `#e8a0b4` — decoration only, never UI chrome. Semantic: success `#1f8a5b`/bg `#e2f1e9` · warning `#cd8420`/bg `#f8ecd5` · danger `#c8442e`/bg `#f7e1db` · info `#0871e7`/bg `#e3eefc`. Data-viz sequence: `#0871e7`, `#1f8a5b`, `#cd8420`, `#c25a3c`, `#8a5cc4`. **Use the semantic aliases in components**, not raw hex.
**Type.** Display **Instrument Serif** (hero, big numbers, pull quotes — `line-height 1.02`, `tracking -0.02em`, large); in-product display/labels **Manrope**; UI/body **Inter** (variable 100–900). Scale (rem): 2xs .6875 · xs .75 · sm .875 (UI default) · base 1 · md 1.125 · lg 1.375 (card titles) · xl 1.75 (section heads) · 2xl 2.25 (page titles) · 3xl 3 · 4xl 4.25 (hero) · 5xl 6. Weights 400/500/600/700. Eyebrow tracking `0.16em`. One italic serif word may emphasize inside a display headline.
**Spacing** (4px base): `--space-1…10` = .25 / .5 / .75 / 1 / 1.5 / 2 / 3 / 4 / 6 / 8 rem. **Radii:** controls `.5rem` · cards `.75rem` · large cards `1rem` · pills `999px`. **Shadows:** warm-tinted `rgba(53,42,24,…)`, xs→lg (card = `0 8px 24px rgba(53,42,24,.09)`); the blue CTA carries an inner top **glint** `inset 0 -3px 4px rgba(255,255,255,.35)`. **Layout:** sidebar `16.5rem` · topbar `4rem` · content max `1500px`. **Motion:** `--ease-out` `cubic-bezier(.16,1,.3,1)`; UI transitions 140–240ms, entrances fade+rise ~1.2–1.5s; respect `prefers-reduced-motion`. **Forbidden:** glassmorphism, mesh/purple-blue gradients, hard slate shadows, colored-left-border cards.

### 19.3 Component inventory (`components/`; namespace `window.SimpleSenseDesignSystem_33cb4c`; each has `.jsx` + `.d.ts` + `.prompt.md`)
- **Button** — `variant`: `primary | clay | secondary | ghost`; `size`: `sm | md | lg`; `pill`; `icon`/`iconRight` (bi name). Primary/clay carry the glint; press shifts color, never shrinks.
- **Badge** — `tone`: `neutral | primary | success | warning | danger | clay`; `variant`: `soft | outline`; `dot`. Pill-shaped.
- **Card**, **Input**, **Avatar** — core primitives (see files).
- **MetricCard** (app) — `label`, `value` (large), `delta` + `deltaTone`, `icon`. The dashboard KPI tile.
- **MoveCard** (app) — **the signature unit and the product's hero component**; everything else is supporting cast.

**`MoveCard` ⇄ `Recommendation` wiring (the key contract):** render every `Recommendation` (§7/§8) as a `MoveCard` — `rank` ← ranking order · `category` ← `category` · **`pattern`** (serif) ← the finding / `title` · `why` ← `rationale` · **`moves[]`** (✓ list) ← the `suggested_execution` steps · `impact` (success badge) ← the `impact_low–impact_high` range (e.g. `+\$1.1–1.5k/mo`) · `confidence` (bullseye) ← `confidence` · **"Apply this move"** → marks `IMPLEMENTED`, triggering the §8.6 outcome job. The card's structure **is** Pattern → Why → Move → Impact, so the engine schema and the UI are one shape.

### 19.4 Charts (`ui_kits/app/charts.jsx`; `window.SSCharts` — pure SVG, no deps, data-viz tokens)
`Sparkline`, `TrendLine`, `ParetoChart`, `CohortHeatmap`, `BarRows`, `Ring` (donut/progress), `GeoConcentration`. These map directly to analyzers: **ParetoChart** → customer-concentration · **CohortHeatmap** → cohort retention · **GeoConcentration** → geo/trade-area. Port them as-is (warm palette baked in).

### 19.5 Screen inventory → build-slice map
App shell = **fixed left sidebar (`16.5rem`) + sticky blurred topbar (`4rem`)**, content capped at `1500px`, centered (`ui_kits/app/`, see `App.jsx` + `Sidebar.jsx`). Canonical nav — label · `bi` icon · maps to:
- **"This week's moves"** · `compass` (badge = open count) → **Slice 7** — ranked `MoveCard`s; `MoveDetailView` opens a single move.
- **"Store audit"** · `clipboard-data` → **Slice 8** — public/shareable curated `MoveCard`s, no PII.
- **"Monitoring"** · `activity` → **Slice 9** — flywheel outcomes (lift, before/after).
- **"Customers"** · `people` → Pareto / VIP / RFM detail (Slice 4 analyzers surfaced).
- **"Geography"** · `geo-alt` → geo / trade-area detail — the **omnichannel hero**; branches physical (BOPIS) vs online-only (regional) per §1.4 / §8.1.
- **"Products"** · `box-seam` → per-SKU true-margin detail.
- **"Connections"** · `plug` → **Slice 2** — Shopify + integrations connect.
- **"Plans & billing"** · `credit-card` → **Slice 10** — Stripe; pricing shows **\$49 Basic / \$99 Pro**.
- **"Settings"** · `gear` → account / store settings.
- **Onboarding** (`Onboarding.jsx`, separate flow) → post-connect onboarding.

### 19.6 Marketing surface (`ui_kits/marketing/`)
`index.html` (warm editorial landing: floating pill nav, Instrument Serif hero, full-bleed product video with a faint white tint, integrations band, blossom footer), `how-it-works.html`, `pricing.html`, `marketing.css`. The **pricing page must reflect \$49 / \$99** with the free Audit as the wedge. Centered, max-width ~1024–1152px.

### 19.7 Brand reconciliation (decision flag for Satya)
This warm system — **cream / signal-blue / clay, Instrument Serif + Inter + Manrope** — is the canonical **product-UI** brand and **supersedes the investor deck's navy/teal + Cambria** for the app and marketing site. The bundle even ships updated warm-style deck slides (`slides/`). **Decide:** either re-skin the investor deck to this warm system (one coherent brand) or knowingly keep two aesthetics (deck = navy/teal artifact; product = warm editorial). Don't let the build silently fork the brand without that call.

---

*Build it the way a disciplined operator would: smallest honest slice, proven before the next, every number earned from real data, every decision written down. Ship.*
