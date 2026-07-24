import type { Rule } from '../../types'
import type { KlaviyoAccountSnapshot } from '../types'

const HIGH_INACTIVE_THRESHOLD = 0.3 // 30%+ of the subscribed list inactive in 90d

/** Founding rule #4: missing sunset policy and/or a high inactive-subscriber share. */
export const listHealthRule: Rule<KlaviyoAccountSnapshot> = {
  id: 'retention.list_health',
  title: 'List health & sunset policy',
  severity: 'medium',
  citation: { label: 'SimpleSense retention benchmark — list hygiene' },
  remediationTemplate: 'Add a sunset/re-engagement flow and monitor inactive-subscriber share.',
  version: '1.0.0',
  addedBecause:
    'Founding rule — an unmanaged inactive list drags deliverability for the whole account.',
  detect(snapshot) {
    const lh = snapshot.listHealth
    if (lh.hasSunsetFlow == null && lh.inactiveSharePct == null) {
      return { status: 'insufficient', insufficientReason: 'No list-health data available.' }
    }
    const noSunset = lh.hasSunsetFlow === false
    const highInactive =
      lh.inactiveSharePct != null && lh.inactiveSharePct >= HIGH_INACTIVE_THRESHOLD
    const metrics = {
      hasSunsetFlow: lh.hasSunsetFlow,
      inactiveSharePct: lh.inactiveSharePct,
      subscribedGrowth90d: lh.subscribedGrowth90d,
      subscribedChurn90d: lh.subscribedChurn90d,
    }
    if (!noSunset && !highInactive) {
      return {
        status: 'triggered',
        evidence: {
          summary:
            'A sunset policy is in place and the inactive-subscriber share is within a healthy range.',
          metrics,
        },
        action: 'No gap here — list hygiene looks healthy.',
      }
    }
    const issues: string[] = []
    if (noSunset) issues.push('no sunset/re-engagement flow found')
    if (highInactive) {
      issues.push(
        `${((lh.inactiveSharePct as number) * 100).toFixed(0)}% of the subscribed list shows no engagement in 90 days`,
      )
    }
    const actions: string[] = []
    if (noSunset)
      actions.push('Build a sunset flow to re-engage or suppress chronically inactive profiles.')
    if (highInactive)
      actions.push(
        'Segment out the inactive share before your next major send to protect deliverability.',
      )
    return {
      status: 'triggered',
      evidence: { summary: issues.join('; '), metrics },
      action: actions.join(' '),
    }
  },
}
