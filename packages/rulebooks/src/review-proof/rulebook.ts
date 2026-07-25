import type { Rulebook } from '../types'
import type { ReviewProofSnapshot } from './types'
import { incentivizedReviewDisclosureRule } from './rules/incentivized-review-disclosure'

/**
 * M3 ReviewProof, v0 — deliberately 1 of the plan's 5 named signals (see types.ts's
 * doc comment and LEDGER.md/PARKING_LOT.md for why). Expand this list once S1's
 * crawler lands and can supply review-suppression/insider-review/purchased-review-
 * timing data. Bump this version whenever a rule is added, removed, or its detection
 * logic/thresholds change.
 */
export const reviewProofRulebook: Rulebook<ReviewProofSnapshot> = {
  module: 'review-proof',
  version: '0.1.0',
  rules: [incentivizedReviewDisclosureRule],
}
