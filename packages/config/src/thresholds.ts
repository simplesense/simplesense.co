import type { Thresholds } from '@ss/core'

/**
 * Canonical Stage-2 signal thresholds (§8.2). Tune here, not in the detector.
 * Each value is the boundary at which a metric becomes "noteworthy" enough to
 * become a prescription. Severity bands are derived from these in @ss/core.
 */
export const SIGNAL_THRESHOLDS: Thresholds = {
  vipTop20Share: 0.65, // top 20% of customers driving >65% of revenue → VIP play
  geoSingleRegionShare: 0.5, // one region >50% of revenue → geo focus
  bopisWithinRadiusShare: 0.6, // >60% of geocoded revenue within 5mi → BOPIS (physical)
  regionalTopZipShare: 0.5, // top zip clusters >50% → regional inventory (online)
  discountRevenueShare: 0.4, // >40% of revenue discounted → margin risk
  retentionRepeatRate: 0.3, // repeat rate <30% → retention gap
}
