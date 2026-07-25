/**
 * The normalized input to the AgentReady rulebook (COMPOUND_ENGINEERING_PLAN.md M2).
 * Built by `packages/integrations/src/agent-ready/build-snapshot.ts` from a handful of
 * `@ss/safe-fetch` calls (product page, its policy page if found, robots.txt) — v0
 * scope is static-fetch only, no JS rendering (that needs S1/Playwright, deferred).
 */

export interface ProductOfferSummary {
  hasPrice: boolean
  priceCurrency: string | null
  /** Raw availability value as found in the JSON-LD (schema.org URL or bare name). */
  availability: string | null
  /** null when `availability` itself is null — nothing to validate. */
  validAvailability: boolean | null
}

export interface ProductSchemaSummary {
  /** A JSON-LD node with @type Product (or including Product) was found at all. */
  found: boolean
  hasName: boolean
  hasOffers: boolean
  hasAggregateRating: boolean
  hasReview: boolean
  offer: ProductOfferSummary | null
}

export interface PolicyPageSummary {
  /** A link matching a known shipping/returns policy pattern was found on the product page. */
  found: boolean
  /** null when not found/attempted. */
  fetchedOk: boolean | null
  visibleTextLength: number | null
}

export interface RobotsTxtSummary {
  fetchedOk: boolean
  /** `Disallow: /` under `User-agent: *` — blocks everything, agents included. */
  disallowsAll: boolean
  /** Named AI-agent bot tokens explicitly disallowed (see rule file for the verified list). */
  blockedAgentBots: string[]
}

export interface ProductPageSummary {
  url: string
  fetchedOk: boolean
  status: number | null
  looksLoginWalled: boolean
  hasCaptcha: boolean
  visibleTextLength: number | null
  productSchema: ProductSchemaSummary
}

export interface AgentReadySnapshot {
  storeUrl: string
  productPage: ProductPageSummary
  policyPage: PolicyPageSummary
  robotsTxt: RobotsTxtSummary
}
