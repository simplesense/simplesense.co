import type { Rule } from '../../types'
import type { ReturnsSnapshot } from '../types'

/** v0 flat fallback cutoff when there aren't enough repeat customers for a cohort baseline. */
const FLAT_FALLBACK_CUTOFF = 0.3
const COHORT_MULTIPLIER = 2
/**
 * A customer with exactly one order that gets returned is mathematically a "100%
 * return rate" — identical on paper to a repeat serial refunder, but it's just one
 * data point. Without this floor every first-time-returner would land in the review
 * tier, which isn't what "inspection required" should mean. Matches the same floor
 * `serial-refunder.ts` uses for its own scoring.
 */
const MIN_ORDERS_FOR_REVIEW = 2

/** Founding rule #6: who keeps instant refunds vs. who moves to an inspection tier. */
export const policyTierRule: Rule<ReturnsSnapshot> = {
  id: 'return_lens.policy_tier',
  title: 'Policy-tier recommendation',
  severity: 'low',
  citation: { label: 'SimpleSense returns-integrity benchmark v0 — return-rate policy cutoff' },
  remediationTemplate:
    'Segment refund handling: instant refunds for customers below the cutoff, inspection-required for customers at or above it.',
  version: '0.1.0',
  addedBecause:
    "Founding rule — the plan's explicit synthesis step: turn the other five signals into one operational recommendation, rather than leaving the founder to eyeball a table.",
  detect(snapshot) {
    if (snapshot.entities.length === 0) {
      return {
        status: 'insufficient',
        insufficientReason: 'No customer entities available to segment.',
      }
    }
    const cutoff =
      snapshot.cohortAvgReturnRate !== null
        ? snapshot.cohortAvgReturnRate * COHORT_MULTIPLIER
        : FLAT_FALLBACK_CUTOFF
    const basis =
      snapshot.cohortAvgReturnRate !== null
        ? `${COHORT_MULTIPLIER}x this store's own cohort average return rate (${(snapshot.cohortAvgReturnRate * 100).toFixed(0)}%)`
        : `a flat ${(FLAT_FALLBACK_CUTOFF * 100).toFixed(0)}% v0 fallback (too few repeat customers this window to compute a cohort average)`
    const reviewTier = snapshot.entities.filter(
      (e) => e.orderCount >= MIN_ORDERS_FOR_REVIEW && e.returnRate >= cutoff,
    )
    const instantTier = snapshot.entities.length - reviewTier.length
    const reviewPct = Math.round((reviewTier.length / snapshot.entities.length) * 1000) / 10
    return {
      status: 'triggered',
      evidence: {
        summary: `At a ${(cutoff * 100).toFixed(0)}% return-rate cutoff (${basis}), ${reviewTier.length} of ${snapshot.entities.length} customers (${reviewPct}%) would move to an inspection-required tier; ${instantTier} keep instant refunds.`,
        metrics: {
          cutoffPct: Math.round(cutoff * 1000) / 10,
          reviewTierCount: reviewTier.length,
          instantTierCount: instantTier,
          reviewTierPct: reviewPct,
        },
      },
      action: `Move the ${reviewTier.length} flagged customer(s) to inspection-required refunds; keep instant refunds for everyone else. Re-run this scoring quarterly as the cohort baseline shifts.`,
    }
  },
}
