import type { AgentReadySnapshot } from '../../src/agent-ready/types'
import type { Finding } from '../../src/types'

/** A "healthy" snapshot by default — tests override only what they're probing. */
export function snapshot(over: Partial<AgentReadySnapshot> = {}): AgentReadySnapshot {
  return {
    storeUrl: 'https://shop.example.com/products/tee',
    productPage: {
      url: 'https://shop.example.com/products/tee',
      fetchedOk: true,
      status: 200,
      looksLoginWalled: false,
      hasCaptcha: false,
      visibleTextLength: 1200,
      productSchema: {
        found: true,
        hasName: true,
        hasOffers: true,
        hasAggregateRating: true,
        hasReview: false,
        offer: {
          hasPrice: true,
          priceCurrency: 'USD',
          availability: 'InStock',
          validAvailability: true,
        },
      },
    },
    policyPage: { found: true, fetchedOk: true, visibleTextLength: 800 },
    robotsTxt: { fetchedOk: true, disallowsAll: false, blockedAgentBots: [] },
    ...over,
  }
}

export function findFinding(findings: Finding[], ruleId: string): Finding {
  const f = findings.find((x) => x.ruleId === ruleId)
  if (!f)
    throw new Error(
      `finding not found: ${ruleId}. present: ${findings.map((x) => x.ruleId).join(', ')}`,
    )
  return f
}
