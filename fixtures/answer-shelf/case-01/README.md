# case-01 — "Cascade Trailwear" vs. "TrailForge," a crafted 30-day battery

Hand-crafted (not a real LLM battery run) 25-response current window + 25-response
baseline window, used as the golden-path fixture for M1 AnswerShelf v0
(COMPOUND_ENGINEERING_PLAN.md §4):

- **Share of voice:** 5 of 25 current-window responses mention Cascade Trailwear = 20%.
- **First-mention rate:** 2 of those 5 name it first = 40%.
- **Sentiment:** 3 positive, 1 neutral, 1 negative among the 5 mentions — the 20%
  negative share crosses the 15% "worth a look" threshold.
- **Cited domains:** cascadetrailwear.com (3), gearjunkie.com (2), outdoorgearlab.com
  (1), aggregated across the 5 mentioning responses.
- **Competitor delta:** TrailForge is mentioned in 10 of 25 responses = 40% share of
  voice, a 20-point gap vs. Cascade Trailwear's 20%.
- **Week-over-week trend:** the baseline window (`baseline-responses.json`) has 8 of 25
  mentions = 32% — a 12-point *decline* to the current window's 20%, deliberately
  planted to exercise the "investigate the decline" branch, not just the clean case.

Every number in `packages/rulebooks/test/answer-shelf/...` and the eventual e2e test is
hand-derived from these two files, not just asserted against a snapshot. Per
COMPOUND_ENGINEERING_PLAN.md §2.2/§2.3: any real mis-aggregation becomes a NEW case
here with its own expected values, before the fix is written.
