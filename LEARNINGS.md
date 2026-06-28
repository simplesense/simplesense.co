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
