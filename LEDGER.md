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

### 2026-07-25 — Niche pages (/for/*): 3 vertical landing pages, spearheading M8/M1/M5

**Scope:** built the full `SIMPLESENSE_NICHE_PAGES_CE_ADDENDUM_2026-07-25.md` — three
public marketing pages (`/for/pet-brands`, `/for/candle-brands`, `/for/apparel-brands`),
each pairing a free-audit funnel with one of the paid concierge modules (retention-x-ray,
answer-shelf, return-lens respectively). Ran overnight, autonomously, per the "complete
everything — GET IT DONE" instruction; no further questions asked, decisions logged below
and in PARKING_LOT.md.

**Architecture decision (not in the addendum, made to keep this session's own Prime
Directives intact):** the addendum's literal ask was 3 *persisted* demo stores through
the real DB+LLM pipeline. That would have meant extending core tenant isolation
(`packages/db/src/demo-ids.ts`'s singleton `DEMO` org) and spending real LLM budget
autonomously overnight, plus this sandbox's Supabase route was already known-broken this
session. Built instead as a pure, computed, statically-baked pipeline: a new `@ss/verticals`
package generates a synthetic `NormalizedStore` per vertical, runs it through `@ss/core`'s
*real* analyzers (`runAnalyzers`) — for apparel, also through M5 ReturnLens's real
`analyzeReturns()` — and interpolates the addendum's own pre-written move copy with
`{{computed.x}}` tokens. Zero hand-written numbers; zero DB writes; zero LLM calls. Pages
are fully statically prerendered at `next build` time from a fixed reference date.

**Honesty rails, built as real enforced code, not just review discipline:** banned-claims
lint (vitest, greps for fake social proof), cite-or-omit enforced at the TypeScript type
level (`CitedClaim`/`Benchmark` require `cite: {sourceUrl, sourceName} | 'editorial'` —
literally impossible to construct without one), the computed-token rule (no literal `$`/`%`
outside `{{computed.x}}`, caught and fixed one instance transcribed verbatim from the
addendum's own draft copy — see below), and a ≥60% page-uniqueness/anti-doorway check
across all 3 shipped configs. 86 tests in `@ss/verticals`, all passing.

**Citations verified this session** (WebFetch/WebSearch, not trusted from the addendum
sight-unseen): Eightx repeat-purchase-by-vertical, Richpanel return-rate benchmarks, APPA
pet industry sizing — all match the addendum's figures exactly. Grand View Research (home
fragrance market size) blocked automated fetch with HTTP 403; used as-is, flagged
unverified-but-low-stakes in PARKING_LOT.md.

**Bugs caught by my own tests before anything shipped:** (1) `hasPhysicalLocations` was
being inferred from location data instead of read from config — caught by a dedicated
test, fixed. (2) Generated return dates could land after "now" for 3 of the synthetic
cohorts — caught by a determinism test, fixed by widening the date-floor headroom. (3) The
pet-brands move template had a literal "top 20%" transcribed verbatim from the addendum's
own draft — caught by the banned-literal-percent lint; fixed by routing it through
`{{computed.topTierPct}}` (documented as the Pareto analyzer's own fixed tier definition,
not an editorial number).

**Real bug caught only by browser verification, not by typecheck/test/build:** none of
Clerk's public-route allowlist (`apps/web/middleware.ts`) included `/for/*` — all three
pages 302'd anonymous visitors to `/sign-in`, silently defeating the entire point of a
public funnel page. Caught by actually loading the page in a browser after a clean build;
fixed by adding `/for(.*)` and `/sitemap.xml` to the middleware's public matcher. This is
the second time this compound-engineering pass that build-green ≠ working (see M2
AgentReady's "use server" bug) — browser verification stays mandatory before "done."

**Also shipped:** `app/sitemap.ts` (lists all public routes + the 3 shipped vertical
pages), per-vertical OG images (`next/og`, mirrors the root's existing pattern), inline
`FAQPage` JSON-LD on each page, a footer "Who it's for" column, and a minimal
`trackEvent()` analytics stub (no vendor wired in this repo yet — see PARKING_LOT.md)
verified firing correctly on the hero/spearhead CTAs via a debug click-intercept in the
browser (real navigation would otherwise clear the console before it could be read).

**Full gate:** `pnpm --filter @ss/verticals typecheck`, `pnpm --filter @ss/web typecheck`,
`pnpm test` (581 tests, all packages), `pnpm lint` (2 unused-import errors found and
fixed), `pnpm --filter @ss/web build` (all 3 pages + OG images + sitemap prerendered
static) — all green.

### 2026-07-24 — M3 ReviewProof v0: one real signal, honestly scoped as such

**Scope:** revisited the earlier call to skip M3 entirely. On reflection, "1 of 5
signals real, rest need S1" doesn't mean nothing should ship — it means the *rulebook*
should honestly contain 1 rule today, not 6 rules where 5 always return `insufficient`
forever (which would be padding, not honesty). Built exactly that: a single rule,
`incentivizedReviewDisclosureRule`, operating on review-request emails a client
forwards (no crawler needed).

**What's real and tested (8 tests, no fixture — the rule has no separate aggregation
step to prove, unlike the 6-rule modules):** detects incentive language ("10% off,"
"free gift," etc.) conditioned specifically on a *positive* review outcome ("5-star,"
"great review"), citing 16 CFR Part 465 (the FTC's real final rule, effective Oct 21,
2024). Got the actual legal nuance right, not a naive heuristic: a dedicated test
confirms the rule does **not** flag an incentive offered for *any* review regardless of
sentiment ("leave a review, get 10% off — good or bad") — that's explicitly legal under
the FTC rule; only sentiment-contingent incentives are prohibited. Every finding carries
the plan's required "risk surfacing, not legal advice; judgment calls go to counsel"
framing verbatim.

**Deliberately not built:** a `/audits/review-proof` landing page. The plan's $750
price point assumes the full 5-signal audit; pitching that price against 1 signal is a
positioning call for you, not a default I should make. See PARKING_LOT.md.

### 2026-07-24 — M1 AnswerShelf v0: full chassis (mock battery, real battery deferred)

**Scope:** fourth module this pass. Detoured through M3 first and found it doesn't have
enough standalone-buildable surface for a real chassis this session (see
PARKING_LOT.md) — researched the actual FTC rule before concluding that, not before
building on top of a guess. M1 turned out to be the better next module: its data
source (LLM battery responses) is exactly as mockable as M8's Klaviyo data was, so the
full 6-rule chassis is provably exercisable end-to-end today, with the *real*
multi-provider battery cleanly deferred (needs OpenAI/Gemini/Perplexity keys, already
parked from earlier this session).

**What's real and tested (66 new tests):**
- `@ss/rulebooks/answer-shelf`: `analyzeAnswerShelf()` pre-aggregation (share of voice,
  first-mention rate, sentiment breakdown, cited-domain ranking, per-competitor share,
  baseline trend delta — 9 tests) + all 6 rules the plan names, each enforcing its own
  sampling floor per the plan's own "statistical honesty" requirement (small samples
  render `insufficient`, never a shaky percentage) — 17 tests.
- `@ss/integrations/answer-shelf`: `MockAnswerShelfBattery`, deterministic, matching
  `MockKlaviyoClient`'s precedent — 4 tests. No `RealAnswerShelfBattery` yet (see
  parking lot: needs provider keys not configured, and a real LLM call has a real
  dollar cost this session shouldn't spend without a go-ahead).
- End-to-end fixture (`fixtures/answer-shelf/case-01`, "Cascade Trailwear vs.
  TrailForge," 25 current + 25 baseline responses) with a deliberately planted
  *declining* trend (32% → 20%) and a *concerning* sentiment share (20% negative), not
  just the clean-path numbers — every figure hand-derived before running the test, all
  10 assertions matched on the first run.
- `/audits/answer-shelf` landing page, mirroring the established S5 pattern; verified
  in-browser (correct render, no console/server errors).

**Not done — real founder decisions, not silently dropped:** the real multi-provider
battery (OpenAI/Gemini/Perplexity keys); no real prompt-set/niche selection has been
made yet (plan says "pick 3 niches + 15 target brands" is a founder Track F action);
sentiment classification in the mock is hand-labeled, not computed — a real battery
will need either an LLM-based classifier call or a cheaper heuristic, an open design
question for whoever builds `RealAnswerShelfBattery`.

### 2026-07-24 — `@ss/safe-fetch` + M2 AgentReady v0: full chassis + free scanner

**Scope:** third module built this pass, per "finish the rest" — M2's free public
scanner (plan §4: "URL -> score + top 5 gaps... as lead magnet") plus the paid
fix-sprint intake. Unlike M8/M5, M2's data source is arbitrary internet URLs a stranger
submits, not data the founder/customer hands over — a materially different risk
profile, handled as its own piece of work before any rule code:

**`@ss/safe-fetch` (new package) — SSRF-safe fetcher, built and independently
red-teamed before anything was built on top of it.** IP blocklist covering IANA
special-purpose ranges (loopback/private/link-local/CGNAT/multicast/reserved, IPv6
loopback/link-local/unique-local/multicast, cloud-metadata 169.254.169.254 explicitly)
+ scheme/port allowlisting + per-hop redirect re-validation + response size/time caps.
Ran a dedicated adversarial-review workflow (2 independent reviewers × independent
verification passes, each reproducing findings against the real code, not just
inspecting it) before trusting this — it found and this session fixed **3 confirmed
bugs**, one critical:
1. **Critical, confirmed live via local reproduction:** the IPv4-mapped-IPv6 blocklist
   check only matched the dotted-decimal textual form (`::ffff:169.254.169.254`), but
   `url.hostname` always serializes IPv6 as hex groups (`::ffff:a9fe:a9fe`) — so the one
   check meant to catch this never fired for real traffic, and the cloud-metadata
   endpoint plus the entire IPv4 blocklist was reachable via `http://[::ffff:<hex>]/`.
   Fixed by unifying the mapped/compatible/NAT64 address detection onto the expanded
   hex-group representation regardless of input form.
2. DNS resolution had no timeout, so a slow/adversarial DNS response could blow the
   configured request budget by 8x in the reviewer's reproduction. Fixed by racing the
   lookup against the remaining time budget.
3. A response body-stream error (mid-read connection reset) wasn't caught, so it
   propagated as an unhandled promise rejection instead of `{ok:false}`. Fixed with a
   try/catch around the read loop.
All three now have regression tests reproducing the exact confirmed bypass/failure
mode, not just the fix's happy path. 38 tests total.

**M2 rulebook — all 6 rules the plan names**, operating on static-fetch-only data
(schema.org validity, policy-text presence, robots.txt agent access, login walls,
CAPTCHA detection, and a render-transparency proxy for the plan's "JS-only price
rendering" check that's honest about what a non-JS-executing scanner can and can't
verify). Verified against real sources this session: Google Search Central's actual
Product/Offer/AggregateRating structured-data requirements and
schema.org's real `ItemAvailability` enum (WebFetch), plus OpenAI's published crawler
user-agent tokens (GPTBot/ChatGPT-User/OAI-SearchBot/OAI-AdsBot verified;
ClaudeBot/Google-Extended/PerplexityBot/CCBot are well-established industry tokens not
individually re-verified this session — see PARKING_LOT.md). Added an optional
`passed?: boolean` field to the shared `DetectionResult`/`Finding` type (additive,
M8/M5 unaffected) so the free scanner's score computation reads an explicit signal
instead of fragile-string-matching rule action text.

**Free scanner UI** (`/audits/agent-ready`) — different shape from M8/M5's "submit
info, we follow up" intake: runs the scan live and renders score + findings inline,
no DB write for the scan itself; a separate fix-sprint intake form (same AuditIntake
pattern, `module: 'agent-ready'`) captures leads who want the paid fix. Per-IP rate
limited (5/hour) since every submission triggers real outbound HTTP, unlike a DB-write
form. **A real bug caught by actual browser testing, not just typecheck**: the first
version exported a plain constant from the `'use server'` actions file (Next.js's
"use server" files may only export async functions) — build passed, typecheck passed,
but the live page 500'd. Fixed by moving the constant to the client component that
already needed it locally. Verified end-to-end against a real live URL
(`example.com`) after the fix: correct 50/100 score, accurate per-check findings.

**Golden fixture** (`fixtures/agent-ready/case-01`, "Trail Runner Jacket," one planted
CAPTCHA gap among 6 otherwise-clean checks) proves the full chassis deterministically —
5/6 passed = 83/100, asserted per-rule, not just snapshot-matched. 90 new tests across
the whole M2 slice (safe-fetch 38 + integrations agent-ready 33 + rulebooks agent-ready
27 — some overlap in shared coverage, see individual test runs).

**Not done — real founder decisions, not silently dropped:** the DNS-rebinding TOCTOU
gap in `@ss/safe-fetch` (documented, accepted for v0 — closing it needs a
connect-time-pinning dispatcher API judged not worth the complexity yet); M2's rubric
still can't execute JavaScript (needs S1/Playwright, and per this session's parking-lot
note, doesn't actually need to for most checks — only the JS-rendering signal is
weakened); no real fix-sprint delivered yet to prove the paid side.

### 2026-07-24 — `/audits/return-lens` landing page

Closes the M5 "not done" item flagged in the entry below: a real page to pitch
ReturnLens prospects to, mirroring `/audits/retention-x-ray` (S5) exactly —
`$1,000/audit` price band (plan §4), the 6 rules as read categories, an illustrative
sample finding, the same intake form/action wired to `module: 'return-lens'`. Verified
in-browser (no console/server errors, form fields render correctly); gate green
(typecheck 11/11, 342 tests, lint 0/0, build compiled with the new route).

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
