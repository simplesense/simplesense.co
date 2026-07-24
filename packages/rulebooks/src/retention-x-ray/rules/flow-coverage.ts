import type { Rule } from '../../types'
import type { CanonicalFlowType, KlaviyoAccountSnapshot } from '../types'

const CANONICAL_FLOWS: CanonicalFlowType[] = [
  'welcome',
  'abandoned_checkout',
  'abandoned_browse',
  'post_purchase',
  'winback',
  'sunset',
]

const LABELS: Record<CanonicalFlowType, string> = {
  welcome: 'Welcome series',
  abandoned_checkout: 'Abandoned checkout',
  abandoned_browse: 'Abandoned browse',
  post_purchase: 'Post-purchase',
  winback: 'Winback',
  sunset: 'Sunset / list-cleaning',
}

/** Founding rule #1: how many of the 6 canonical Klaviyo flows are missing or dormant. */
export const flowCoverageRule: Rule<KlaviyoAccountSnapshot> = {
  id: 'retention.flow_coverage',
  title: 'Canonical flow coverage',
  severity: 'high',
  citation: { label: 'SimpleSense retention benchmark — 6-flow canonical set' },
  remediationTemplate:
    'Build and activate the missing flow(s) from the canonical set; reactivate any dormant flow that has stopped sending.',
  version: '1.0.0',
  addedBecause: 'Founding rule — the single most common gap seen across retention audits.',
  detect(snapshot) {
    if (!snapshot.flows) {
      return {
        status: 'insufficient',
        insufficientReason: 'No flow data available from Klaviyo for this account.',
      }
    }
    const byType = new Map(snapshot.flows.map((f) => [f.canonicalType, f]))
    const missing: CanonicalFlowType[] = []
    const dormant: CanonicalFlowType[] = []
    for (const type of CANONICAL_FLOWS) {
      const flow = byType.get(type)
      if (!flow || flow.status !== 'live') missing.push(type)
      else if (flow.sends30d === 0) dormant.push(type)
    }
    const gapCount = missing.length + dormant.length
    if (gapCount === 0) {
      return {
        status: 'triggered',
        evidence: {
          summary: 'All 6 canonical flows are live and actively sending.',
          metrics: { missingCount: 0, dormantCount: 0 },
        },
        action: 'No gap here — maintain the current flow set and revisit this checklist quarterly.',
      }
    }
    const missingLabels = missing.map((t) => LABELS[t])
    const dormantLabels = dormant.map((t) => LABELS[t])
    const summaryParts = [
      missing.length ? `${missing.length} missing` : null,
      dormant.length ? `${dormant.length} dormant` : null,
    ].filter(Boolean)
    return {
      status: 'triggered',
      evidence: {
        summary: `${summaryParts.join(', ')} of 6 canonical flows: ${[...missingLabels, ...dormantLabels].join(', ')}.`,
        metrics: {
          missingCount: missing.length,
          dormantCount: dormant.length,
          missing: missingLabels.join(', '),
          dormant: dormantLabels.join(', '),
        },
      },
      action: missing.length
        ? `Build the missing flow(s): ${missingLabels.join(', ')}.${dormant.length ? ` Also reactivate the dormant flow(s): ${dormantLabels.join(', ')}.` : ''}`
        : `Reactivate the dormant flow(s): ${dormantLabels.join(', ')} — live but zero sends in the last 30 days.`,
    }
  },
}
