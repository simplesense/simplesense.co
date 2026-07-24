# case-01 — typical mid-market account, multiple real gaps

A crafted (not live-pulled) Klaviyo account snapshot representing a realistic $2-20M
DTC brand with gaps across all 6 rulebook categories, used as the eval-gate fixture
for M8 Retention X-Ray v0 (COMPOUND_ENGINEERING_PLAN.md §2.3, §4):

- Abandoned-browse flow in draft (missing), winback live but dormant (0 sends/30d).
- Welcome flow revenue-per-recipient down 25% vs. its 90-day-ago baseline.
- Spam complaints up 50%, unsubscribes up 25% vs. 90 days ago.
- No sunset flow; 35% of the list inactive in 90 days.
- Has a VIP segment but no at-risk segment.
- 61.5% of campaign revenue is discount-driven.

The golden report render is a vitest snapshot at
`packages/reports/test/__snapshots__/e2e-retention-x-ray.test.ts.snap`. Per
COMPOUND_ENGINEERING_PLAN.md §2.2/§2.3: any real mis-parse or wrong figure becomes a
NEW case here with its own golden, before the fix is written — never edit an existing
golden to make a test pass; regenerate deliberately (`vitest -u`) after review.
