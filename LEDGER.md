# LEDGER.md — the compound log

Per `COMPOUND_ENGINEERING_PLAN.md` §2.4. One entry per delivery (or per meaningful
build session before the first delivery). Tracks what was delivered, hours, findings
that landed/flopped with the buyer, rules added/retired, fixtures added, price/pitch
adjustments. **The compounding metric is delivery hours per audit** — target ≤4h/audit
by the 3rd delivery per module. If hours aren't falling, stop and fix the system, not
the audit.

---

## Scoreboard (per §7 — update weekly)

| Module | Pitches sent | Audits sold | Delivery hours (last) | Findings-$ surfaced | Buyer reaction | Refunds/complaints |
|---|---|---|---|---|---|---|
| M8 Retention X-Ray | 0 | 0 | — | — | — | 0 |
| M1 AnswerShelf | 0 | 0 | — | — | — | 0 |
| M2 AgentReady | 0 | 0 | — | — | — | 0 |
| M3 ReviewProof | 0 | 0 | — | — | — | 0 |
| M5 ReturnLens | 0 | 0 | — | — | — | 0 |

---

## Build log (newest first)

### 2026-07-23/24 — S2 CSV ingest kit + M5 ReturnLens v0: full chassis

**Scope:** the next Track C priority after M8+S5, re-prioritized ahead of S7 (entity
registry has no consumer yet with only one module built, and would add another
DB-schema change on top of the migration this session already can't apply live — see
PARKING_LOT.md). S2 and M5 share M8's exact profile: deterministic, fixture-driven, no
new dependencies, no API/credential approvals needed — works entirely from CSV exports
a founder can get from any merchant today.

**What's real and tested (112 new tests, all fixture-driven):**
- `@ss/csv-ingest` (new package, S2): a dependency-free RFC4180 CSV parser (41 tests
  covering quoted fields, embedded commas/newlines/escaped-quotes, CRLF, BOM — the
  default call to hand-write this instead of adding a library is parked in
  PARKING_LOT.md) + `parseOrdersCsv`/`parseReturnsCsv`, both schema-sniffed (header
  alias matching, not one hardcoded column set) with quarantine-on-drift for
  unparseable rows. Order-CSV column names verified against
  help.shopify.com/en/manual/orders/export-orders (WebFetch, this session); return
  status/reason modeling verified against Shopify's real `Return`/`ReturnLineItem`
  GraphQL schema (shopify.dev) — documented finding: Shopify has no single
  standardized "export returns to CSV" format the way orders have one, so the parser
  alias-sniffs rather than assuming one shape.
- `@ss/rulebooks/return-lens` (M5): `analyzeReturns()` pre-aggregation (union-find
  entity resolution across email+shipping-address, cohort-relative return-rate
  baseline, per-SKU return stats, bracketing-candidate detection, wardrobing timing
  stats — 11 tests) + all 6 rules the plan names (entity resolution, serial-refunder
  scoring, bracketing, wardrobing, high-return SKU, policy-tier recommendation — 20
  tests), reusing `@ss/rulebooks`' existing generic engine and `@ss/reports`' existing
  renderer completely unchanged (both were already module-agnostic — confirmed by
  reading, not assumed).
- End-to-end grounding proof: `fixtures/return-lens/case-01` ("Cascade Trailwear," 32
  orders / 13 returns crafted to hit all 6 rules), with every dollar/count/percentage
  in the finding evidence hand-derived independently *before* running the test — every
  hand-derived number matched the code's output on the first run (9 tests + 1 golden
  snapshot).

**A real design gap the fixture math surfaced, fixed before shipping:** a customer with
exactly one order that gets returned is a "100% return rate" indistinguishable on paper
from a repeat serial refunder. The policy-tier rule initially had no order-count floor,
so building the fixture showed it would sweep every first-time returner into the
"inspection required" tier. Added the same `MIN_ORDERS_FOR_REVIEW` floor the
serial-refunder rule already used — a genuine correctness fix the hand-verification
step caught, not a fixture-fitting hack.

**Not done — real founder decisions/follow-ups, not silently dropped:**
`/audits/return-lens` public landing page + intake wiring (near-mechanical copy of the
M8/S5 page — cheap, deferred to keep this slice reviewable); no real merchant CSV ever
tested against; the DB-connectivity gap from the S5 slice is still unresolved (this
slice was deliberately kept DB-free, same posture as M8).

### 2026-07-23 — S5 Audit intake: landing page + lead capture

**Scope:** the "nowhere to send a pitch yet" gap flagged at the end of the M8 build.
Public `/audits/retention-x-ray` page (price band, 6 rulebook categories mirrored from
the real rulebook, one illustrative sample finding clearly labeled as such, intake
form) + a rate-limited server action that validates and persists a lead + a
Clerk-gated `/internal/audit-intakes` list for the founder to work leads from. New
`AuditIntake` Prisma model, deliberately **not** org-scoped (pre-auth leads, not
tenant data) — matches the plan's Decision 2 ("no new entitlement/billing code").

**What's real and tested (11 new tests):** `validateIntake()` pure-logic module (8
tests: required fields, email format, whitespace trim, length caps, empty-notes→null)
+ `auditPaymentLink()` config helper (3 tests) that reads a per-module Stripe Payment
Link env var and returns `null` — not a fabricated URL — when unset, so the page's
"pay for your audit" CTA only renders once a real link is configured. Full gate green:
typecheck 10/10 packages, 39 test files / 261 tests, lint 0/0, `@ss/web` build clean
with both new routes present.

**Not done / blocking:** migration `20260723000001_audit_intake` has **not** been
applied to the live Supabase DB — this session lost its route to the IPv6-only
direct-connect host (confirmed via `dig`/`nc`/`prisma migrate status`, all consistent
with a routing problem, not a code problem). The form will 500 in production exactly
as it did in local verification until someone runs `prisma migrate deploy` from a
machine that can reach it. Full detail + exact repro in LEARNINGS.md and PARKING_LOT.md
(marked BLOCKING there). Also parked, non-blocking: no email notification on new
leads (needs `RESEND_API_KEY`), internal list page's auth gate is "any signed-in
Clerk user," not a real admin-role check, no Stripe payment link configured yet.

**Delivery hours:** n/a (infra build, not a delivery).

### 2026-07-23 — M8 Retention X-Ray v0: full chassis, deterministic-only

**Scope:** end-to-end proof of the Klaviyo-pull → rulebook → report chassis for M8,
per the Day1-3 build order. Deliberately NOT built this session (honest scope
boundary, not silently dropped): S1 crawler/Playwright, S2 CSV kit, S3 LLM battery,
S5 intake page, S6 capture archive, S7 entity registry — none of these block M8's
core value and each needs its own dependency/founder decision (see below). None of
the plan's §3 Wave-0 checkboxes are marked `[x]` yet — S4 is real but partial
(HTML only, no PDF), so it stays unchecked rather than overclaimed.

**What's real and tested (79 new-package tests, all fixture/mock-driven — no live
Klaviyo key used):**
- `@ss/rulebooks` (new package): generic rule/rulebook/finding engine + M8's 6 rules
  (flow coverage, revenue-per-flow trend, cadence/fatigue, list health, segment
  architecture, discount dependency), each carrying `citation`/`addedBecause`/
  `version` as the plan requires. 20 tests.
- Klaviyo adapter (`packages/integrations/src/klaviyo/client.ts`): real endpoints
  verified via WebFetch against developers.klaviyo.com this session (base URL, auth
  header, `revision` header, `GET /flows`, `POST /metric-aggregates`).
  `RealKlaviyoClient` implements flow-coverage data for real (rule #1, the highest-
  severity rule); the other 5 snapshot sections return `null` with an explicit
  code-comment TODO rather than a fabricated endpoint call — they render
  `insufficient` until a real account is available to verify campaigns/list-health/
  cadence/segment endpoints against. `MockKlaviyoClient` is fully populated for
  testing. 6 tests.
- `@ss/reports` (new package): shared report schema + a pure, self-contained
  HTML renderer (cover/methodology/ranked findings/dollar frames/citations/
  disclaimer footer) — ready to open as a file or email as an attachment; PDF
  conversion deferred to when Playwright lands for S1 (avoids a second heavy
  dependency). 8 tests.
- End-to-end grounding proof: `fixtures/retention-x-ray/case-01` (a crafted
  multi-gap account) run through the real rulebook + renderer, with hand-verified
  math for every dollar figure (not just golden-snapshot matching) plus a vitest
  golden-snapshot of the full rendered report. 6 tests.

**Bugs the tests caught before they shipped (not narrated as clean the first time):**
`revenuePerFlowRule` crashed on `flows: null` (missing the null-guard the rule
contract requires); a floating-point boundary miss in the 20%-decline threshold
((2.0−1.6)/2.0 computes as 0.19999999999999998, just under 0.2); a `toLocaleDateString`
timezone bug that could roll a UTC-midnight report date back a day depending on the
server's local timezone; a module-export bug (`@ss/rulebooks` only exposed
retention-x-ray types under a namespace, not top-level, breaking the Klaviyo
adapter's import). One copy nit (grammar mismatch on a singular/plural action
string) was caught by the golden-snapshot diff and fixed + deliberately
re-approved, not silently absorbed.

**Not done — real founder decisions before this can be sold, per plan §2.3:**
founder has not yet reviewed/approved a golden report end-to-end ("would I put my
name on this?"); no real Klaviyo API key has been tested against; PDF export not
built; S5 intake page/Stripe payment link not built (so there's nowhere to send a
pitch yet — highest-leverage next step alongside founder review).

**Delivery hours this build:** not tracked (build session, no delivery yet —
scoreboard above starts once M8 audits are actually pitched/sold).
