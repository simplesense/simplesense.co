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
