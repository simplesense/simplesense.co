import type { Rule } from '../../types'
import type { ReturnsSnapshot } from '../types'

const MIN_ORDERS_TO_SCORE = 3
const COHORT_MULTIPLIER = 3

/** Founding rule #2: customers whose return rate is a multiple of the cohort average. */
export const serialRefunderRule: Rule<ReturnsSnapshot> = {
  id: 'return_lens.serial_refunder',
  title: 'Serial-refunder scoring vs. cohort baseline',
  severity: 'high',
  citation: { label: 'SimpleSense returns-integrity benchmark v0 — cohort-relative return rate' },
  remediationTemplate:
    'Move flagged customers to a review/inspection refund tier rather than instant refund; do not auto-deny future orders.',
  version: '0.1.0',
  addedBecause:
    "Founding rule — the core ReturnLens premise: a spreadsheet and a hunch can't compute a cohort baseline, so serial refunders blend into 'normal' return noise.",
  detect(snapshot) {
    if (snapshot.cohortAvgReturnRate === null) {
      return {
        status: 'insufficient',
        insufficientReason:
          'Not enough repeat customers (2+ orders) in this data window to establish a cohort return-rate baseline.',
      }
    }
    const cohortAvg = snapshot.cohortAvgReturnRate
    const flagged = snapshot.entities.filter(
      (e) => e.orderCount >= MIN_ORDERS_TO_SCORE && e.returnRate >= cohortAvg * COHORT_MULTIPLIER,
    )
    if (flagged.length === 0) {
      return {
        status: 'triggered',
        evidence: {
          summary: `No customer returns at ${COHORT_MULTIPLIER}x+ the cohort average return rate (${(cohortAvg * 100).toFixed(0)}%).`,
          metrics: { flaggedCount: 0, cohortAvgReturnRatePct: Math.round(cohortAvg * 1000) / 10 },
        },
        action: 'No gap here — no outsized serial-refunder pattern detected.',
      }
    }
    const combinedRefund = flagged.reduce((s, e) => s + e.refundTotal, 0)
    const topRate = Math.max(...flagged.map((e) => e.returnRate))
    return {
      status: 'triggered',
      evidence: {
        summary: `${flagged.length} customer(s) return at ${COHORT_MULTIPLIER}x+ the cohort average (${(cohortAvg * 100).toFixed(0)}%) — the highest returns ${(topRate * 100).toFixed(0)}% of their orders.`,
        metrics: {
          flaggedCount: flagged.length,
          cohortAvgReturnRatePct: Math.round(cohortAvg * 1000) / 10,
          topReturnRatePct: Math.round(topRate * 1000) / 10,
          combinedRefund,
        },
      },
      action: `Move ${flagged.length} flagged customer(s) to an inspection-required refund tier for their next order; re-score after 90 days.`,
    }
  },
}
