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

### Supabase connectivity (2026-06-27)

The direct host `db.<ref>.supabase.co` is **IPv6-only** (AAAA only). This machine has IPv6,
so the direct `:5432` connection works for both `DATABASE_URL` and `DIRECT_URL` — no IPv4
pooler/region needed. If a future host is IPv4-only, switch to the pooler
(`aws-0-<region>.pooler.supabase.com`, user `postgres.<ref>`) from the Connect dialog.
