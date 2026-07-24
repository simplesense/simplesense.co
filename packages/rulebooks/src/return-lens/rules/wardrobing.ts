import type { Rule } from '../../types'
import type { ReturnsSnapshot } from '../types'

/**
 * v0 methodology threshold, not an external research figure — the share of returns
 * filed within a plausible "wore it, then returned it" window (5-21 days after the
 * order date, per `derive.ts`) above which it's worth a closer look. Order date is a
 * proxy for delivery date (not available in v0) — documented, not silently assumed.
 */
const ELEVATED_SHARE_PCT = 40

/** Founding rule #4: return-timing patterns consistent with "wear it, then return it." */
export const wardrobingRule: Rule<ReturnsSnapshot> = {
  id: 'return_lens.wardrobing',
  title: 'Wardrobing (wear-then-return) timing signal',
  severity: 'medium',
  citation: { label: 'SimpleSense returns-integrity benchmark v0 — order-to-return timing' },
  remediationTemplate:
    'Consider tightening the return window or adding a condition-on-return check for categories with an elevated wear-window share.',
  version: '0.1.0',
  addedBecause:
    "Founding rule — one of the plan's five named ReturnLens signals; timing alone is not proof, hence 'signal,' never an auto-deny basis.",
  detect(snapshot) {
    const { wardrobing } = snapshot
    if (wardrobing.totalReturns === 0 || wardrobing.wearWindowSharePct === null) {
      return {
        status: 'insufficient',
        insufficientReason: 'No returns in this window to assess timing patterns.',
      }
    }
    const share = wardrobing.wearWindowSharePct
    if (share < ELEVATED_SHARE_PCT) {
      return {
        status: 'triggered',
        evidence: {
          summary: `${share}% of returns fall in the 5-21 day "wear window" after order date — below the ${ELEVATED_SHARE_PCT}% v0 watch threshold.`,
          metrics: { wearWindowSharePct: share, totalReturns: wardrobing.totalReturns },
        },
        action: 'No gap here — return timing does not show an elevated wear-window concentration.',
      }
    }
    return {
      status: 'triggered',
      evidence: {
        summary: `${share}% of returns (${wardrobing.wearWindowReturns} of ${wardrobing.totalReturns}) fall in the 5-21 day "wear window" after order date — above the ${ELEVATED_SHARE_PCT}% v0 watch threshold. Order date is used as a proxy for delivery date; not proof of wear on its own.`,
        metrics: {
          wearWindowSharePct: share,
          wearWindowReturns: wardrobing.wearWindowReturns,
          totalReturns: wardrobing.totalReturns,
        },
      },
      action:
        'Cross-check a sample of these returns manually (condition notes, photos if collected) before changing policy — timing alone is a signal, not proof.',
    }
  },
}
