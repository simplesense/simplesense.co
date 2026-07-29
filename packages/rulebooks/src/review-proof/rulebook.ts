import type { Rulebook } from '../types'
import type { ReviewProofSnapshot } from './types'
import { incentivizedReviewDisclosureRule } from './rules/incentivized-review-disclosure'
import { reviewCountRegressionRule } from './rules/review-count-regression'
import { reviewTimingBurstRule } from './rules/review-timing-burst'

/**
 * M3 ReviewProof — 3 of the plan's 5 named signals now real (see types.ts's doc
 * comment and LEDGER.md/PARKING_LOT.md for the other 2, which stay permanently out of
 * scope rather than being faked). v0.1.0 shipped the email-based signal alone, before
 * S1 (`@ss/crawler`) and S6 (`@ss/capture-archive`) existed; v0.2.0 adds the 2 signals
 * they unlock. Bump this version whenever a rule is added, removed, or its detection
 * logic/thresholds change.
 */
export const reviewProofRulebook: Rulebook<ReviewProofSnapshot> = {
  module: 'review-proof',
  version: '0.2.0',
  rules: [incentivizedReviewDisclosureRule, reviewCountRegressionRule, reviewTimingBurstRule],
}
