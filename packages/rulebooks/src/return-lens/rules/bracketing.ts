import type { Rule } from '../../types'
import type { ReturnsSnapshot } from '../types'

/** Founding rule #3: buy-multiple-sizes-return-most-of-them ("bracketing"). */
export const bracketingRule: Rule<ReturnsSnapshot> = {
  id: 'return_lens.bracketing',
  title: 'Size-bracketing detection',
  severity: 'medium',
  citation: {
    label: 'SimpleSense returns-integrity benchmark v0 — same-style multi-variant orders',
  },
  remediationTemplate:
    'Consider a bracketing-aware policy: a restocking fee or a "keep one, return the rest" nudge at checkout for orders with 2+ sizes of the same style.',
  version: '0.1.0',
  addedBecause:
    "Founding rule — apparel/footwear DTC's single most common return-abuse pattern per the plan's own market research (NRF/Happy Returns, Appriss/Deloitte).",
  detect(snapshot) {
    if (snapshot.orderCount === 0) {
      return {
        status: 'insufficient',
        insufficientReason: 'No order data available for this window.',
      }
    }
    const candidates = snapshot.bracketingCandidates
    if (candidates.length === 0) {
      return {
        status: 'triggered',
        evidence: {
          summary: 'No orders show a same-style, multi-size bracketing pattern.',
          metrics: { candidateCount: 0 },
        },
        action: 'No gap here — no bracketing pattern detected in this window.',
      }
    }
    const byStyle = new Map<string, number>()
    for (const c of candidates) byStyle.set(c.baseStyle, (byStyle.get(c.baseStyle) ?? 0) + 1)
    const topStyle = [...byStyle.entries()].sort((a, b) => b[1] - a[1])[0]!
    return {
      status: 'triggered',
      evidence: {
        summary: `${candidates.length} order(s) show a bracketing pattern — 2+ size/variants of the same style ordered, most returned. Most common style: "${topStyle[0]}" (${topStyle[1]} order(s)).`,
        metrics: {
          candidateCount: candidates.length,
          distinctStyles: byStyle.size,
          topStyle: topStyle[0],
          topStyleCount: topStyle[1],
        },
      },
      action:
        'Introduce a bracketing-aware policy (restocking fee or size-confirmation nudge at checkout) for the flagged style(s) first.',
    }
  },
}
