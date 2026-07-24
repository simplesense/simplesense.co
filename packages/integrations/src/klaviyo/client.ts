import type { CanonicalFlowType, FlowSummary, KlaviyoAccountSnapshot } from '@ss/rulebooks'

/**
 * Klaviyo REST API — verified 2026-07-23 against developers.klaviyo.com:
 *   base URL      https://a.klaviyo.com/api/
 *   auth header   Authorization: Klaviyo-API-Key <key>
 *   revision      revision: <YYYY-MM-DD> (required on every request)
 *   GET /flows            — JSON:API, filter/fields/sort/page[cursor]/page[size] (max 50/page)
 *   POST /metric-aggregates — revenue/count aggregation, grouped by $flow_id etc.
 * NOT verified this session (return null in the snapshot; corresponding rules render
 * "insufficient" rather than a guess — grounding invariant): campaigns list, list/segment
 * growth stats, spam-complaint/unsubscribe metric names, quiet-hours config, sunset-policy
 * detection. Complete once a real API key is available to test against (plan Decision 3).
 */
const API_BASE = 'https://a.klaviyo.com/api'
const REVISION = '2026-07-15'

export interface KlaviyoClientConfig {
  apiKey: string
}

/** Read-only Klaviyo client — pulls raw account data and normalizes it for the rulebook. */
export interface KlaviyoClient {
  getAccountSnapshot(accountName: string): Promise<KlaviyoAccountSnapshot>
}

interface RawFlowAttributes {
  name: string
  status: string
  archived: boolean
  trigger_type?: string
}
interface RawFlowNode {
  id: string
  attributes: RawFlowAttributes
}
interface FlowsResponse {
  data: RawFlowNode[]
}

/**
 * Heuristic-only: Klaviyo's `trigger_type` field doesn't map 1:1 to our 6 canonical
 * categories, so we match on the flow's own name. This is what a human auditor would
 * eyeball too — flag it, don't claim it's authoritative. Reviewed at "approve golden
 * report" (COMPOUND_ENGINEERING_PLAN.md §2.3).
 */
const CANONICAL_NAME_HINTS: [CanonicalFlowType, RegExp][] = [
  ['welcome', /welcome/i],
  ['abandoned_checkout', /abandon(ed)?\s*(checkout|cart)/i],
  ['abandoned_browse', /abandon(ed)?\s*(browse|browsing|site)/i],
  ['post_purchase', /post[\s-]?purchase|thank\s*you/i],
  ['winback', /win[\s-]?back|re-?engag/i],
  ['sunset', /sunset|list\s*clean|re-?permission/i],
]

function guessCanonicalType(name: string): CanonicalFlowType | null {
  for (const [type, pattern] of CANONICAL_NAME_HINTS) {
    if (pattern.test(name)) return type
  }
  return null
}

export class RealKlaviyoClient implements KlaviyoClient {
  constructor(private readonly cfg: KlaviyoClientConfig) {}

  private headers(): Record<string, string> {
    return {
      Authorization: `Klaviyo-API-Key ${this.cfg.apiKey}`,
      revision: REVISION,
      accept: 'application/json',
    }
  }

  private async getFlows(): Promise<FlowSummary[]> {
    const res = await fetch(
      `${API_BASE}/flows?fields[flow]=name,status,archived,trigger_type&page[size]=50`,
      {
        headers: this.headers(),
      },
    )
    if (!res.ok) throw new Error(`Klaviyo flows request failed: ${res.status}`)
    const body = (await res.json()) as FlowsResponse
    return body.data.map((node) => ({
      id: node.id,
      name: node.attributes.name,
      canonicalType: guessCanonicalType(node.attributes.name),
      status: node.attributes.archived
        ? 'archived'
        : node.attributes.status === 'live'
          ? 'live'
          : 'draft',
      // Not verified this session — needs a metric-aggregates call against this flow's
      // "Placed Order" attribution, which needs a prior GET /metrics lookup to resolve the
      // metric id. Left insufficient rather than guessed.
      sends30d: 0,
      revenuePerRecipient: null,
      revenuePerRecipient90dAgo: null,
    }))
  }

  async getAccountSnapshot(accountName: string): Promise<KlaviyoAccountSnapshot> {
    const flows = await this.getFlows()
    return {
      accountName,
      windowDays: 90,
      flows,
      campaigns: [],
      listHealth: {
        hasSunsetFlow:
          flows.some((f) => f.canonicalType === 'sunset' && f.status === 'live') || null,
        inactiveSharePct: null,
        subscribedGrowth90d: null,
        subscribedChurn90d: null,
      },
      cadence: {
        sendsPerSubscriberPerWeek: null,
        spamComplaintRatePct: null,
        spamComplaintRatePct90dAgo: null,
        unsubscribeRatePct: null,
        unsubscribeRatePct90dAgo: null,
        quietHoursViolationCount: null,
      },
      segments: {
        hasVipSegment: null,
        hasAtRiskSegment: null,
        usesPredictedLtv: null,
      },
    }
  }
}

/** Deterministic mock — a fully-populated "typical mid-size DTC account" snapshot, used in
 *  tests and for building/reviewing golden reports before a real client key is on hand. */
export class MockKlaviyoClient implements KlaviyoClient {
  async getAccountSnapshot(accountName: string): Promise<KlaviyoAccountSnapshot> {
    return Promise.resolve({
      accountName,
      windowDays: 90,
      flows: [
        {
          id: 'flow_welcome',
          name: 'Welcome Series',
          canonicalType: 'welcome',
          status: 'live',
          sends30d: 1200,
          revenuePerRecipient: 2.1,
          revenuePerRecipient90dAgo: 2.4,
        },
        {
          id: 'flow_abandoned_checkout',
          name: 'Abandoned Checkout',
          canonicalType: 'abandoned_checkout',
          status: 'live',
          sends30d: 800,
          revenuePerRecipient: 4.5,
          revenuePerRecipient90dAgo: 4.6,
        },
        {
          id: 'flow_abandoned_browse',
          name: 'Abandoned Browse',
          canonicalType: 'abandoned_browse',
          status: 'draft',
          sends30d: 0,
          revenuePerRecipient: null,
          revenuePerRecipient90dAgo: null,
        },
        {
          id: 'flow_post_purchase',
          name: 'Post-Purchase Thank You',
          canonicalType: 'post_purchase',
          status: 'live',
          sends30d: 900,
          revenuePerRecipient: 0.8,
          revenuePerRecipient90dAgo: 0.85,
        },
        {
          id: 'flow_winback',
          name: 'Winback 90-day',
          canonicalType: 'winback',
          status: 'live',
          sends30d: 0,
          revenuePerRecipient: 1.2,
          revenuePerRecipient90dAgo: 1.2,
        },
        {
          id: 'flow_sunset',
          name: 'Sunset',
          canonicalType: 'sunset',
          status: 'archived',
          sends30d: 0,
          revenuePerRecipient: null,
          revenuePerRecipient90dAgo: null,
        },
      ],
      campaigns: [
        {
          id: 'camp_1',
          name: 'July Sale',
          sentAt: '2026-07-10',
          revenue: 18000,
          recipientCount: 40000,
          usedDiscountCode: true,
        },
        {
          id: 'camp_2',
          name: 'New Arrivals',
          sentAt: '2026-07-03',
          revenue: 6000,
          recipientCount: 38000,
          usedDiscountCode: false,
        },
        {
          id: 'camp_3',
          name: 'VIP Early Access',
          sentAt: '2026-06-28',
          revenue: 9000,
          recipientCount: 5000,
          usedDiscountCode: true,
        },
      ],
      listHealth: {
        hasSunsetFlow: false, // the flow above is archived, not live
        inactiveSharePct: 0.38,
        subscribedGrowth90d: 3200,
        subscribedChurn90d: 900,
      },
      cadence: {
        sendsPerSubscriberPerWeek: 2.8,
        spamComplaintRatePct: 0.06,
        spamComplaintRatePct90dAgo: 0.04,
        unsubscribeRatePct: 0.35,
        unsubscribeRatePct90dAgo: 0.3,
        quietHoursViolationCount: 2,
      },
      segments: {
        hasVipSegment: true,
        hasAtRiskSegment: false,
        usesPredictedLtv: false,
      },
    })
  }
}

/** Real client when a customer API key is supplied for this audit; mock otherwise. */
export function createKlaviyoClient(apiKey: string | null): KlaviyoClient {
  if (apiKey) return new RealKlaviyoClient({ apiKey })
  return new MockKlaviyoClient()
}
