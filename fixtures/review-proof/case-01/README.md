# case-01 — "Cedarwood Candle," two review-widget captures with two planted gaps

Hand-crafted (not a real merchant's page) product-page review widget, captured twice
(`review-widget-early.html`, `review-widget-late.html`) — the golden-path fixture for
M3 ReviewProof's crawler-dependent signals (COMPOUND_ENGINEERING_PLAN.md M3, v0.2.0):

- **Planted gap 1 — review-count regression:** the aggregate review count drops from
  120 (early) to 95 (late) — a real store's review count should only grow; `reviewCountRegressionRule` fails.
- **Planted gap 2 — review-timing burst:** the late capture's individual `Review` nodes
  contain 10 organically-spaced 3-star reviews (15 days apart, Sept 2025–Jan 2026) plus
  a cluster of 6 five-star reviews landing within a single 6-day window
  (Feb 1–6, 2026) — `reviewTimingBurstRule` fails, correctly using only the LATEST
  capture (the early capture has no individual `Review` nodes at all, only an aggregate).

Expected: both new rules `triggered` with `passed: false`; the pre-existing
`incentivized_review_disclosure` rule is `insufficient` (no emails provided in this
case — it has its own fixture-free unit tests). Asserted by hand (not just
snapshot-matched) in
`packages/integrations/test/review-proof/e2e-fixture.test.ts`. Per
COMPOUND_ENGINEERING_PLAN.md §2.2/§2.3: any real mis-detection becomes a NEW case here
with its own expected values, before the fix is written.
