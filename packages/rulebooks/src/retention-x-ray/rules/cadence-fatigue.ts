import type { Rule } from '../../types'
import type { KlaviyoAccountSnapshot } from '../types'

const RISE_THRESHOLD = 1.25 // 25%+ relative rise vs. 90-day-ago baseline

/** Founding rule #3: rising spam/unsubscribe trend or quiet-hours violations. */
export const cadenceFatigueRule: Rule<KlaviyoAccountSnapshot> = {
  id: 'retention.cadence_fatigue',
  title: 'Send cadence & subscriber fatigue',
  severity: 'medium',
  citation: { label: 'SimpleSense retention benchmark — cadence/fatigue thresholds' },
  remediationTemplate:
    'Reduce send frequency and/or improve targeting where spam-complaint or unsubscribe trends are rising.',
  version: '1.0.0',
  addedBecause:
    'Founding rule — a rising complaint/unsubscribe trend is an early-warning signal for deliverability damage.',
  detect(snapshot) {
    const { cadence } = snapshot
    if (cadence.spamComplaintRatePct == null && cadence.unsubscribeRatePct == null) {
      return {
        status: 'insufficient',
        insufficientReason: 'No spam-complaint or unsubscribe rate data available.',
      }
    }
    const spamRising =
      cadence.spamComplaintRatePct != null &&
      cadence.spamComplaintRatePct90dAgo != null &&
      cadence.spamComplaintRatePct90dAgo > 0 &&
      cadence.spamComplaintRatePct > cadence.spamComplaintRatePct90dAgo * RISE_THRESHOLD
    const unsubRising =
      cadence.unsubscribeRatePct != null &&
      cadence.unsubscribeRatePct90dAgo != null &&
      cadence.unsubscribeRatePct90dAgo > 0 &&
      cadence.unsubscribeRatePct > cadence.unsubscribeRatePct90dAgo * RISE_THRESHOLD
    const quietHoursIssue = (cadence.quietHoursViolationCount ?? 0) > 0

    const metrics = {
      spamComplaintRatePct: cadence.spamComplaintRatePct,
      spamComplaintRatePct90dAgo: cadence.spamComplaintRatePct90dAgo,
      unsubscribeRatePct: cadence.unsubscribeRatePct,
      unsubscribeRatePct90dAgo: cadence.unsubscribeRatePct90dAgo,
      quietHoursViolationCount: cadence.quietHoursViolationCount,
    }

    if (!spamRising && !unsubRising && !quietHoursIssue) {
      return {
        status: 'triggered',
        evidence: {
          summary:
            'Spam-complaint and unsubscribe rates are stable; no quiet-hours violations detected.',
          metrics,
        },
        action: 'No gap here — cadence and list-fatigue signals look stable.',
      }
    }
    const issues: string[] = []
    if (spamRising) {
      const pct = (
        ((cadence.spamComplaintRatePct as number) / (cadence.spamComplaintRatePct90dAgo as number) -
          1) *
        100
      ).toFixed(0)
      issues.push(`spam complaints up ${pct}% vs. 90 days ago`)
    }
    if (unsubRising) {
      const pct = (
        ((cadence.unsubscribeRatePct as number) / (cadence.unsubscribeRatePct90dAgo as number) -
          1) *
        100
      ).toFixed(0)
      issues.push(`unsubscribes up ${pct}% vs. 90 days ago`)
    }
    if (quietHoursIssue)
      issues.push(`${cadence.quietHoursViolationCount} quiet-hours violation(s) detected`)
    return {
      status: 'triggered',
      evidence: { summary: issues.join('; '), metrics },
      action: `Cut send frequency to the most-fatigued segments${quietHoursIssue ? ' and fix quiet-hours scheduling' : ''}; re-check in 30 days.`,
    }
  },
}
