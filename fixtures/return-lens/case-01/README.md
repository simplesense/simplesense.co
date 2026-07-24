# case-01 — "Cascade Trailwear," a crafted apparel/footwear DTC returns dataset

Hand-crafted (not a real merchant's export) 12-customer, 32-order, 13-return CSV pair
covering all 6 M5 ReturnLens rules (COMPOUND_ENGINEERING_PLAN.md §4):

- **Entity resolution:** `dup1@x.com`/`dup2@x.com` share one shipping address across 4
  orders, 3 returned — the "same person, two emails" pattern.
- **Serial refunder:** `serial1@x.com` (4 orders, 3 returned) and the dup1/dup2 merged
  identity both return at 75%, well above the ~21% cohort average from the other 10
  customers.
- **Bracketing:** order `#4029` buys 3 sizes of "Trail Jacket," returns 2.
- **Wardrobing:** the serial-refunder/dup returns and the bracketing returns are all
  filed 6-15 days after their order (inside the 5-21 day "wear window"); the two normal
  returns and the three SKU-HOOD returns are filed within 1-4 days (outside it) — 8 of
  13 returns (61.5%) land in the window, above the 40% v0 watch threshold.
- **High-return SKU:** "Trail Hoodie" (`SKU-HOOD`) sold to 3 different one-time
  customers, 5 of 6 units returned (83%), all reason `SIZE_TOO_SMALL` — a sizing
  problem, not a customer-abuse one.
- **Policy tier:** at a 2x-cohort-average (~41.7%) cutoff, 4 of 16 customers (25%) move
  to an inspection-required tier; single-order customers are excluded from "review" by
  design even where their one return reads as literally 100%.

Every dollar/count/percentage in `e2e-return-lens.test.ts` is hand-derived from these
two CSVs, not just asserted against the golden snapshot — see that test's comments for
the full by-hand math. Per COMPOUND_ENGINEERING_PLAN.md §2.2/§2.3: any real mis-parse or
wrong figure becomes a NEW case here with its own golden, before the fix is written —
never edit an existing golden to make a test pass; regenerate deliberately (`vitest -u`)
after review.
