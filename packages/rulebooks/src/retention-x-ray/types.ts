/**
 * The normalized input to the Retention X-Ray rulebook (COMPOUND_ENGINEERING_PLAN.md
 * M8). This is the "Normalize" chassis stage — raw Klaviyo API responses are mapped
 * into this shape by the adapter (packages/integrations/src/klaviyo/client.ts), never
 * consumed raw by a rule. Every field is nullable: when the adapter can't verify a
 * piece of data, it's null here, and the corresponding rule renders `insufficient`
 * rather than guessing (grounding invariant).
 */

export type CanonicalFlowType =
  'welcome' | 'abandoned_checkout' | 'abandoned_browse' | 'post_purchase' | 'winback' | 'sunset'

export interface FlowSummary {
  id: string
  name: string
  /** null when the flow doesn't map to one of the 6 canonical types. */
  canonicalType: CanonicalFlowType | null
  status: 'live' | 'draft' | 'archived'
  /** Sends in the trailing 30 days — distinguishes "live but dormant" from actually active. */
  sends30d: number
  revenuePerRecipient: number | null
  /** Same metric measured ~90 days earlier, for trend comparison. */
  revenuePerRecipient90dAgo: number | null
}

export interface CampaignSummary {
  id: string
  name: string
  sentAt: string
  revenue: number
  recipientCount: number
  usedDiscountCode: boolean
}

export interface ListHealth {
  hasSunsetFlow: boolean | null
  /** Share of subscribed profiles with no open/click in the trailing 90 days. */
  inactiveSharePct: number | null
  subscribedGrowth90d: number | null
  subscribedChurn90d: number | null
}

export interface CadenceStats {
  sendsPerSubscriberPerWeek: number | null
  spamComplaintRatePct: number | null
  spamComplaintRatePct90dAgo: number | null
  unsubscribeRatePct: number | null
  unsubscribeRatePct90dAgo: number | null
  quietHoursViolationCount: number | null
}

export interface SegmentArchitecture {
  hasVipSegment: boolean | null
  hasAtRiskSegment: boolean | null
  usesPredictedLtv: boolean | null
}

export interface KlaviyoAccountSnapshot {
  accountName: string
  /** The trailing window this snapshot's flow/campaign data covers, in days. */
  windowDays: number
  flows: FlowSummary[]
  campaigns: CampaignSummary[]
  listHealth: ListHealth
  cadence: CadenceStats
  segments: SegmentArchitecture
}
