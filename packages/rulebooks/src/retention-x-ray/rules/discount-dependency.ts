import type { Rule } from '../../types'
import type { KlaviyoAccountSnapshot } from '../types'

const HIGH_DISCOUNT_SHARE = 0.5 // 50%+ of campaign revenue discount-driven

/** Founding rule #6: share of campaign revenue tied to a discount code — a margin-risk signal. */
export const discountDependencyRule: Rule<KlaviyoAccountSnapshot> = {
  id: 'retention.discount_dependency',
  title: 'Campaign discount dependency',
  severity: 'medium',
  citation: {
    label: 'SimpleSense retention benchmark — margin-risk via discount-driven campaign revenue',
  },
  remediationTemplate:
    "Shift a share of discount-driven campaigns to value-led or early-access campaigns that don't erode margin.",
  version: '1.0.0',
  addedBecause:
    'Founding rule — discount-dependent revenue is a margin risk that compounds silently.',
  detect(snapshot) {
    if (!snapshot.campaigns || snapshot.campaigns.length === 0) {
      return { status: 'insufficient', insufficientReason: 'No campaign data available.' }
    }
    const totalRevenue = snapshot.campaigns.reduce((s, c) => s + c.revenue, 0)
    if (totalRevenue <= 0) {
      return {
        status: 'insufficient',
        insufficientReason: 'No campaign revenue recorded in the window.',
      }
    }
    const discountedRevenue = snapshot.campaigns
      .filter((c) => c.usedDiscountCode)
      .reduce((s, c) => s + c.revenue, 0)
    const share = discountedRevenue / totalRevenue
    const sharePct = Math.round(share * 1000) / 10
    if (share < HIGH_DISCOUNT_SHARE) {
      return {
        status: 'triggered',
        evidence: {
          summary: `${sharePct}% of campaign revenue is discount-driven — within a healthy range.`,
          metrics: { discountedRevenueSharePct: sharePct, totalRevenue, discountedRevenue },
        },
        action: 'No gap here — discount dependency is not a material margin risk right now.',
      }
    }
    return {
      status: 'triggered',
      evidence: {
        summary: `${sharePct}% of campaign revenue (${discountedRevenue.toLocaleString()} of ${totalRevenue.toLocaleString()}) was sent with a discount code.`,
        metrics: { discountedRevenueSharePct: sharePct, totalRevenue, discountedRevenue },
      },
      // Editorial estimate, explicitly labeled as such — actual discount depth per order isn't
      // available from this pull, so this is NOT presented as a measured figure.
      dollarFrame: {
        low: Math.round(discountedRevenue * 0.15),
        high: Math.round(discountedRevenue * 0.25),
        basis: `Editorial estimate: 15–25% average discount depth applied to ${discountedRevenue.toLocaleString()} in discount-driven campaign revenue — not measured from actual per-order discount amounts (not available in this pull).`,
      },
      action:
        'Run your next 2–3 campaigns as value-led (no discount) and compare revenue-per-recipient before deciding how much discount-driven revenue is actually incremental.',
    }
  },
}
