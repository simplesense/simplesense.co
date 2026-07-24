import type { Rule } from '../../types'
import type { KlaviyoAccountSnapshot } from '../types'

const DECLINE_THRESHOLD = 0.2 // 20%+ decline vs. 90-day-ago baseline

/** Founding rule #2: flows whose revenue-per-recipient has decayed vs. their own trend. */
export const revenuePerFlowRule: Rule<KlaviyoAccountSnapshot> = {
  id: 'retention.revenue_per_flow_trend',
  title: 'Flow revenue-per-recipient trend',
  severity: 'high',
  citation: { label: 'SimpleSense retention benchmark — 90-day flow trend comparison' },
  remediationTemplate:
    'Refresh creative/copy on flows whose revenue-per-recipient has declined materially from their own 90-day-ago baseline.',
  version: '1.0.0',
  addedBecause:
    'Founding rule — flows decay silently (subject-line/creative fatigue) with no built-in alert.',
  detect(snapshot) {
    if (!snapshot.flows) {
      return {
        status: 'insufficient',
        insufficientReason: 'No flow data available from Klaviyo for this account.',
      }
    }
    const withTrend = snapshot.flows.filter(
      (f) =>
        f.revenuePerRecipient != null &&
        f.revenuePerRecipient90dAgo != null &&
        f.revenuePerRecipient90dAgo > 0,
    )
    if (withTrend.length === 0) {
      return {
        status: 'insufficient',
        insufficientReason: 'No 90-day-ago revenue-per-recipient baseline available for any flow.',
      }
    }
    const declining = withTrend.filter((f) => {
      const current = f.revenuePerRecipient as number
      const baseline = f.revenuePerRecipient90dAgo as number
      // Round to avoid floating-point boundary misses (e.g. (2.0-1.6)/2.0 computing as
      // 0.19999999999999998, just under a 0.2 threshold that should include it).
      const decline = Math.round(((baseline - current) / baseline) * 1000) / 1000
      return decline >= DECLINE_THRESHOLD
    })
    if (declining.length === 0) {
      return {
        status: 'triggered',
        evidence: {
          summary:
            'No flow shows a 20%+ decline in revenue-per-recipient vs. its 90-day-ago baseline.',
          metrics: { decliningCount: 0 },
        },
        action: 'No gap here — flow performance is holding steady against its own trend.',
      }
    }
    // Grounded dollar estimate: (baseline - current) revenue/recipient x last-30-day send volume,
    // used as a conservative recipient-count proxy (we don't have true per-flow recipient counts
    // in v0). Low bound halves the gap to stay conservative; both bounds trace to snapshot numbers.
    let low = 0
    let high = 0
    for (const f of declining) {
      const current = f.revenuePerRecipient as number
      const baseline = f.revenuePerRecipient90dAgo as number
      const perRecipientGap = baseline - current
      const recipientsProxy = Math.max(f.sends30d, 1)
      low += perRecipientGap * recipientsProxy * 0.5
      high += perRecipientGap * recipientsProxy
    }
    const names = declining.map((f) => f.name).join(', ')
    return {
      status: 'triggered',
      evidence: {
        summary: `${declining.length} flow(s) down 20%+ in revenue-per-recipient vs. 90 days ago: ${names}.`,
        metrics: { decliningCount: declining.length, flows: names },
      },
      dollarFrame: {
        low: Math.round(low),
        high: Math.round(high),
        basis:
          '(90-day-ago revenue/recipient − current revenue/recipient) × last-30-day send volume, summed across declining flows; low bound conservatively halves the gap.',
      },
      action: `Refresh creative/copy on: ${names}. Re-check revenue-per-recipient in 30 days.`,
    }
  },
}
