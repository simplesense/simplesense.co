# Learnings

Bugs found → tests added; gotchas; non-obvious fixes. Append newest at the bottom of
each section.

## Environment / host gotchas

- **No global `pnpm`** on the build host, and global npm install failed on perms.
  Fix: `corepack enable` / `corepack pnpm …` (pnpm@9.15.0 pinned via `packageManager`).
- **No Docker, no local Postgres, no `psql`.** Fix: PGlite for local/test DB (ADR-002);
  the pure engine needs no DB at all, so the analyzer test surface is unaffected.
- The working directory is nested inside the home-folder git repo; initialized a
  **dedicated** git repo at `/Users/satya/simplesense.co` so the project history is clean.

### Config gotchas that cost a full debugging session (2026-07-31)

All three of these are now caught in one command by `pnpm preflight`
(`scripts/doctor.mjs`) — added specifically so none of them can burn an hour twice.

- **A repo-root `.env` is invisible to Next.js.** Only env files inside `apps/web/`
  are auto-loaded. Vars set only at the root silently don't exist at runtime, and the
  failure looks like "the code ignores my config." `preflight` reports stranded
  root-only vars explicitly. (Four are stranded today: `NODE_ENV`, `APP_URL`,
  `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` — harmless only because nothing in
  `apps/web` reads them.)
- **One email can own several Stripe accounts, and keys/products don't warn you when
  they're from different ones.** Copying API keys from account A while creating
  products in account B produces `No such price: price_...` on checkout — an error
  that reads like a code bug and isn't. The account id is embedded in the secret key
  (right after `sk_test_5`/`sk_live_5`) and appears in Dashboard product URLs;
  compare them before debugging anything else. `preflight` now calls
  `GET /v1/account` + `GET /v1/prices/{id}` and reports the mismatch by name.
- **`pnpm doctor` is a pnpm builtin** and silently shadows a same-named `scripts`
  entry — it runs pnpm's own doctor and your script never executes, with no error.
  Hence the name `preflight`. Check for a builtin collision before naming any script.

Two more Stripe checkout preconditions worth knowing, both also covered by
`preflight`: the price must be **recurring** (checkout runs in `subscription` mode, so
a one-time price 400s) and **active** (an archived price 400s the same way).

### Self-audit findings (2026-07-31) — 16 candidates, 5 confirmed, all fixed

Ran a 4-lens adversarial audit (authz, product invariants, stubs/doc-drift, billing)
with 2 independent skeptics per finding; only unanimously-unrefuted findings below.
11 candidates were correctly refuted, which is the point of the verify pass.

- **A fabricated `0` shipped to a LIVE public page — the grounding invariant inverted.**
  `/for/pet-brands` rendered "launch a replenishment flow timed to your **0-day**
  reorder cycle", on a page whose own copy two elements above promises "every figure
  below is computed by SimpleSense's real analysis pipeline." Cause: `?? 0` on a
  legitimately-insufficient metric. Two root causes, both fixed: (a) the synthetic
  generator keyed each order's SKU off a GLOBAL counter, so a repeat customer never
  rebought the same product and `replenishment.median_reorder_interval_days` was
  correctly insufficient — repeat orders now reuse the customer's own first SKU, which
  is what a replenishment interval actually means, and the page now shows a real
  77-day cycle; (b) all three demo files defaulted missing metrics to 0. Added
  `demo/metric-access.ts` — `requiredMetric`/`requiredPct` THROW instead of
  defaulting. These pages are statically generated, so a throw fails the build rather
  than shipping a lie. **Lesson: `?? 0` on anything derived from a metric is a
  grounding violation waiting to happen; the guard belongs in a shared reader, not in
  each caller's discipline.**
- **An abandoned checkout granted permanent free Pro.** `checkout.session.expired`
  still carries the `metadata.tier` we stamp at checkout. Its `status` is the SESSION's
  (`expired`), which isn't in the subscription `statusMap`, so status resolved to null
  — and the webhook's `status: evt.status ?? 'ACTIVE'` create-default did the rest.
  Fixed with an event-type allowlist plus a hard refusal to CREATE an entitlement row
  without an explicitly resolved status. **Lesson: a Checkout Session's `status` is not
  a subscription status; never run one through the other's map.**
- **The `checkout.session.completed → ACTIVE` branch was unreachable.** Same root
  confusion: a session's `status` is always truthy, so the ternary never fell through
  to the intended branch. A returning customer could pay and stay on free. Now keyed
  explicitly off `payment_status` (`paid` / `no_payment_required`).
- **Upgrading an existing subscriber double-billed them.** Clicking "Upgrade to Pro"
  as a Basic customer opened a SECOND subscription under a SECOND Stripe customer id;
  the webhook then overwrote `stripeCustomerId`, making the original $99 charge
  invisible and uncancellable from inside the product. Existing ACTIVE/PAST_DUE
  subscribers are now routed to the billing portal (proration-aware plan swap) instead.
- **`updateStoreSettings` was the one mutating server action without a demo guard** —
  it could rewrite the shared showcase store and trigger an unbounded LLM re-analysis.
  **Lesson: a server action is a directly-invokable endpoint; being rendered on an
  authenticated page is not protection.**

Also fixed while reviewing my own diff: `redactSecrets` covered Anthropic and Shopify
credentials but **not Stripe** (`sk_`/`rk_`/`whsec_`) — the one configured provider it
missed, and precisely the one whose errors get logged verbatim during billing
debugging.

### Debugging-approach lesson (2026-07-31)

The Stripe misconfiguration above took ~15 conversational round-trips of single
`grep`s and one-at-a-time hypotheses. What actually resolved it was surfacing the
provider's own error message (`packages/integrations/src/stripe.ts` now includes
`error.message`, not just the HTTP status — it reaches server logs only, never an HTTP
response body) and then querying the provider for ground truth. **When a third-party
call fails, get the provider's real error text and query the provider's own state
first — before forming hypotheses about local config.** A status code alone is not a
diagnosis.

## Bugs → regression tests

### Analyzer adversarial audit (2026-06-27) — 14 findings, all fixed

Ran a 4-agent adversarial audit over the pure analyzers (`ss-analyzer-audit` workflow).
Every finding below now has a regression test in `packages/core/test/analyzers/edge.test.ts`
(or an updated existing test). Several were genuine Prime-Directive-#1 violations.

- **HIGH `window.ts` month-end overflow** — `Date.setMonth` overflowed on 31st (e.g.
  Jul 31 − 1mo → Jul 1), silently dropping days from the window. Also switched to UTC so
  it's TZ-independent. Fix: shift on day-1 then clamp to the target month's last day.
- **HIGH `geo.within_5mi_revenue_share`** — denominator was geocoded revenue only, so a
  store with many un-geocoded orders saw an inflated "within 5mi" share. Fix: emit
  `geo.geocoded_revenue_fraction` qualifier + order counts.
- **HIGH `cohort.second_to_third_conversion`** — `?? 0` turned `safeShare(0,0)` (no
  repeat buyers) into a fabricated 0. Fix: emit `insufficient` when `withTwo === 0`.
- **MED `geo.single_region_share`** — null ship-to pooled into an "unknown" region that
  could dominate (POS-heavy ICP). Fix: concentrate over located revenue only; emit
  `geo.unlocatable_revenue_fraction`.
- **MED `pareto` tier collapse** — for small n, top1/5/10 collapse to the same count but
  different keys → mislabeled percentile. Fix: record `effective_pct` + `effective_customer_count`.
- **MED `discount.revenue_share_discounted`** — fabricated 0 when net revenue is 0 (all
  refunded). Fix: `insufficient`. Same guard added to `returns.rate_overall`.
- **MED `cohort.new_customers_count`** misnamed (counted all in-window customers). Fix:
  renamed → `cohort.window_customer_count`; added true `cohort.new_customer_count`.
- **MED `mix` guest orders** classified as returning. Fix: exclude guests; classify "new"
  by first-order **id** (not timestamp, which ties on POS imports); add `mix.guest_revenue_share`.
- **LOW** `replenishment.reordered_pair_count` counted intervals not distinct pairs (added
  `reorder_interval_count`); `rfm` high-value tie inclusiveness (deterministic top-k by id);
  `sku_margin.worst_sku_margin` only emitted when actually negative.

**Lesson:** `safeShare(...) ?? 0` is a grounding trap — a null (undefined ratio) must
become `insufficient`, never a 0 that reads as a real measurement. Audited all `?? 0`
sites; the legitimate ones have a guaranteed-positive denominator.

### Live Claude over-rejection (2026-06-27) — grounding tuned against a real LLM

Wired the real Anthropic key and ran `claude-sonnet-4-6` through the pipeline on the seed
store. First pass: **3 of 5 recs quarantined** by the grounding validator. Diagnosed via
per-rejection logging — the rejected numbers were NOT hallucinations but benign context:
`24` ("trailing 24 months"), `40` (the discount threshold the signal carries), and
`200/225/199` (Claude's *suggested* new free-ship target — a prescriptive action).
Fix (two-pronged, keeps Prime Directive #1 strict):
- **Prompt** rules (8)/(9): don't state the window length or external benchmarks; express
  numeric targets RELATIVE to a provided metric instead of inventing a new number.
- **Validator** `extraAllowedNumbers`: `runEngine` passes the window length (parsed from
  `trailing_24m`) + signal thresholds — config context, not fabricated store data.
Result: **5 moves, 0 rejected** on the next live run, while the `$999,999` hallucination
and the uncontextualized-`24` tests still reject. Lesson: validate the grounded layer
against the *real* model early — synthetic mocks won't surface prompt/validator mismatch.

### Next env loading + persistence (2026-06-27)

- **Next loads `apps/web/.env.local`, NOT the repo-root `.env`.** The dashboard's Prisma
  client threw `Environment variable not found: DATABASE_URL` until DATABASE_URL/DIRECT_URL
  were added to `apps/web/.env.local` (root `.env` is for CLI tooling like Prisma migrate/seed).
- **Persistence replaces the in-memory demo cache.** `/app` now: load 68 orders from
  Supabase → analyze → live Claude → persist AnalysisRun+Metrics+Recommendations. First
  load ~54s; reload ~1s (reads the persisted run; no repeat Claude call). Verified rows in
  Supabase: 1 run, 5 recs, 47 metrics.
- **Honor persisted status on reload.** The dashboard must query OPEN moves
  (status NEW/VIEWED) — `openRecommendations` — or dismissed/applied moves reappear after a
  refresh. Verified: dismiss → 5→4 cards across reloads.

### Supabase connectivity (2026-06-27)

The direct host `db.<ref>.supabase.co` is **IPv6-only** (AAAA only). This machine has IPv6,
so the direct `:5432` connection works for both `DATABASE_URL` and `DIRECT_URL` — no IPv4
pooler/region needed. If a future host is IPv4-only, switch to the pooler
(`aws-0-<region>.pooler.supabase.com`, user `postgres.<ref>`) from the Connect dialog.

### Supabase connectivity regression, this session only (2026-07-23)

The above stopped holding in this Claude Code session/sandbox: `dig` shows the host is
still AAAA-only (no A record), and this box still carries global IPv6 addresses on `en0`,
but `nc -6` to the resolved address returns **"No route to host"** — no actual IPv6 uplink
from this sandbox, even though plain IPv4 internet egress (google.com, api.anthropic.com)
works fine. `prisma migrate status` against `apps/web/.env.local`'s `DATABASE_URL` fails
with P1001 for the same reason. Net effect: no live-DB verification or `prisma migrate
deploy` was possible from this session for the S5 (`AuditIntake`) migration — see
PARKING_LOT.md. This is very likely sandbox-specific (a different container/network path
than 2026-06-27's), not a Supabase-side change — verify from a normal terminal before
assuming the pooler is now required.
