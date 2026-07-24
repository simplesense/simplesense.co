import type { Rule } from '../../types'
import type { ReturnsSnapshot } from '../types'

const MIN_ORDERS_TO_FLAG = 2

/** Founding rule #1: identities hiding behind more than one email at the same address. */
export const entityResolutionRule: Rule<ReturnsSnapshot> = {
  id: 'return_lens.entity_resolution',
  title: 'Cross-email identity resolution',
  severity: 'high',
  citation: { label: 'SimpleSense returns-integrity benchmark v0 — email+address clustering' },
  remediationTemplate:
    'Review flagged multi-email identities manually before assuming abuse; corroborate with support notes or payment fingerprints where available.',
  version: '0.1.0',
  addedBecause:
    'Founding rule — per-account return-limit policies are trivially defeated by checking out under a second email at the same address.',
  detect(snapshot) {
    if (snapshot.orderCount === 0) {
      return {
        status: 'insufficient',
        insufficientReason: 'No order data available for this window.',
      }
    }
    const flagged = snapshot.entities.filter(
      (e) => e.spansMultipleEmails && e.orderCount >= MIN_ORDERS_TO_FLAG,
    )
    if (flagged.length === 0) {
      return {
        status: 'triggered',
        evidence: {
          summary:
            'No customer identity spanning multiple emails at the same shipping address was found.',
          metrics: { flaggedCount: 0 },
        },
        action: 'No gap here — no cross-email clustering detected in this window.',
      }
    }
    const totalOrders = flagged.reduce((s, e) => s + e.orderCount, 0)
    const totalReturns = flagged.reduce((s, e) => s + e.returnedOrderCount, 0)
    const combinedRefund = flagged.reduce((s, e) => s + e.refundTotal, 0)
    return {
      status: 'triggered',
      evidence: {
        summary: `${flagged.length} customer identit${flagged.length === 1 ? 'y spans' : 'ies span'} more than one email at the same shipping address, across ${totalOrders} combined orders, ${totalReturns} returns, and ${combinedRefund.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} in refunds.`,
        metrics: {
          flaggedCount: flagged.length,
          totalOrders,
          totalReturns,
          combinedRefund,
        },
      },
      // No dollarFrame here deliberately: what share of combinedRefund is actual policy
      // evasion vs. a legitimate shared household is unknowable without manual review —
      // a fabricated split would violate grounding. combinedRefund is reported as a real,
      // unadjusted reference figure in the evidence above, not as an estimated recovery.
      action:
        'Manually review the flagged identities before acting — this is a "review cohort," never an auto-deny list.',
    }
  },
}
