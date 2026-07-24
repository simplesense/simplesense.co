import type {
  CadenceStats,
  CampaignSummary,
  FlowSummary,
  KlaviyoAccountSnapshot,
  ListHealth,
  SegmentArchitecture,
} from '../../src/retention-x-ray/types'
import type { Finding } from '../../src/types'

let flowSeq = 0
export function flow(over: Partial<FlowSummary> = {}): FlowSummary {
  return {
    id: over.id ?? `f${++flowSeq}`,
    name: over.name ?? 'Flow',
    canonicalType: null,
    status: 'live',
    sends30d: 100,
    revenuePerRecipient: 1,
    revenuePerRecipient90dAgo: 1,
    ...over,
  }
}

let campaignSeq = 0
export function campaign(over: Partial<CampaignSummary> = {}): CampaignSummary {
  return {
    id: over.id ?? `c${++campaignSeq}`,
    name: over.name ?? 'Campaign',
    sentAt: '2026-06-01T00:00:00.000Z',
    revenue: 1000,
    recipientCount: 1000,
    usedDiscountCode: false,
    ...over,
  }
}

export function listHealth(over: Partial<ListHealth> = {}): ListHealth {
  return {
    hasSunsetFlow: true,
    inactiveSharePct: 0.1,
    subscribedGrowth90d: 100,
    subscribedChurn90d: 20,
    ...over,
  }
}

export function cadence(over: Partial<CadenceStats> = {}): CadenceStats {
  return {
    sendsPerSubscriberPerWeek: 2,
    spamComplaintRatePct: 0.02,
    spamComplaintRatePct90dAgo: 0.02,
    unsubscribeRatePct: 0.3,
    unsubscribeRatePct90dAgo: 0.3,
    quietHoursViolationCount: 0,
    ...over,
  }
}

export function segments(over: Partial<SegmentArchitecture> = {}): SegmentArchitecture {
  return {
    hasVipSegment: true,
    hasAtRiskSegment: true,
    usesPredictedLtv: false,
    ...over,
  }
}

/** A fully "healthy" account by default — tests override only what they're probing. */
export function snapshot(over: Partial<KlaviyoAccountSnapshot> = {}): KlaviyoAccountSnapshot {
  const canonicalTypes: FlowSummary['canonicalType'][] = [
    'welcome',
    'abandoned_checkout',
    'abandoned_browse',
    'post_purchase',
    'winback',
    'sunset',
  ]
  return {
    accountName: 'Acme Co.',
    windowDays: 90,
    flows: canonicalTypes.map((canonicalType) =>
      flow({ canonicalType, name: `${canonicalType} flow` }),
    ),
    campaigns: [campaign({ revenue: 1000, usedDiscountCode: false })],
    listHealth: listHealth(),
    cadence: cadence(),
    segments: segments(),
    ...over,
  }
}

/** Find a finding by rule id or throw (keeps tests honest about which rule they assert). */
export function findFinding(findings: Finding[], ruleId: string): Finding {
  const f = findings.find((x) => x.ruleId === ruleId)
  if (!f)
    throw new Error(
      `finding not found: ${ruleId}. present: ${findings.map((x) => x.ruleId).join(', ')}`,
    )
  return f
}
