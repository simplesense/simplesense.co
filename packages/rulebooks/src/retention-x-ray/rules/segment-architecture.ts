import type { Rule } from '../../types'
import type { KlaviyoAccountSnapshot } from '../types'

/** Founding rule #5: whether a VIP and/or at-risk segment exists. */
export const segmentArchitectureRule: Rule<KlaviyoAccountSnapshot> = {
  id: 'retention.segment_architecture',
  title: 'VIP / at-risk segment architecture',
  severity: 'medium',
  citation: { label: 'SimpleSense retention benchmark — Pareto/VIP segment presence' },
  remediationTemplate:
    'Build the missing segment(s) — VIP (top 20% by spend) and/or at-risk (declining engagement, no recent purchase).',
  version: '1.0.0',
  addedBecause:
    'Founding rule — the top-20%-of-customers pattern is the highest-leverage segment most accounts never formalize.',
  detect(snapshot) {
    const seg = snapshot.segments
    if (seg.hasVipSegment == null && seg.hasAtRiskSegment == null) {
      return {
        status: 'insufficient',
        insufficientReason: 'No segment-architecture data available.',
      }
    }
    const missing: string[] = []
    if (seg.hasVipSegment === false) missing.push('a VIP / top-20%-by-spend segment')
    if (seg.hasAtRiskSegment === false) missing.push('an at-risk / win-back-eligible segment')
    const metrics = {
      hasVipSegment: seg.hasVipSegment,
      hasAtRiskSegment: seg.hasAtRiskSegment,
      usesPredictedLtv: seg.usesPredictedLtv,
    }
    if (missing.length === 0) {
      return {
        status: 'triggered',
        evidence: { summary: 'VIP and at-risk segments both exist.', metrics },
        action: 'No gap here — segment architecture covers the two highest-leverage groups.',
      }
    }
    const routing =
      missing.length === 2
        ? 'route each to a dedicated flow (VIP: early access/private sales; at-risk: a targeted win-back offer)'
        : seg.hasVipSegment === false
          ? 'route it to a VIP flow (early access, private sales)'
          : 'route it to a targeted win-back flow'
    return {
      status: 'triggered',
      evidence: { summary: `Missing: ${missing.join(' and ')}.`, metrics },
      action: `Build ${missing.join(' and ')}, then ${routing}.`,
    }
  },
}
