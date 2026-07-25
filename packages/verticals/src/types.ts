/**
 * Vertical landing-page config schema (SIMPLESENSE_NICHE_PAGES_CE_ADDENDUM_2026-07-25
 * §1.1). One config file per vertical; adding a future vertical is config + copy, never
 * new code. Cite-or-omit is enforced at the type level here (§2.2): `PainPoint` and
 * `Benchmark` cannot be constructed without either a real `sourceUrl` or the explicit
 * `'editorial'` marker — there is no way to attach a bare, uncited number.
 */

export interface CitedClaim {
  claim: string
  /** A real source URL, or the literal 'editorial' for a labeled non-statistical claim. */
  cite: { sourceUrl: string; sourceName: string } | 'editorial'
}

export interface Benchmark {
  stat: string
  sourceName: string
  sourceUrl: string
}

export interface ExampleMoveTemplate {
  title: string
  /**
   * Numbers appear ONLY as {{computed.<metricId>}} tokens — enforced by a build-time
   * lint (packages/verticals/test/computed-token-lint.test.ts) that fails on any
   * literal `$` or `%` in this string. Resolved against a `ComputedMetrics` map at
   * render time (render-moves.ts), never hand-filled.
   */
  narrativeTemplate: string
}

export interface FaqItem {
  q: string
  a: string
}

/** Editorial demo-store parameters, anchored to the vertical's cited benchmarks (see configs/*.ts). */
export interface DemoStoreParams {
  storeName: string
  annualRevenue: number
  ordersPerYear: number
  historyYears: number
  locations: { city: string; region: string; lat: number; lng: number; shareOfRevenue: number }[]
  hasPhysicalLocations: boolean
  subscriptionRevenueShare: number
  repeatPurchaseRate: number
  returnRate: number
  discountedRevenueShare: number
  avgDiscountRate: number
  /** Share of Q4 revenue of annual revenue — used by the gift-buyer/seasonality moves. */
  q4RevenueShare: number
  /** Share of top-20% customers already covered by a retention flow — editorial synthetic marketing data, not from any real ESP (see LEDGER.md). */
  vipFlowCoveragePct: number
  skuTree: { name: string; category: string; unitPrice: number; returnRate?: number }[]
  /** Apparel-only: seeds the serial-refunder/bracketing pattern reusing @ss/rulebooks/return-lens. */
  abusePatternSeed?: {
    abuseCustomerSharePct: number
    bracketingStyleSkuNames: [string, string, string]
  }
}

export interface SpearheadOffer {
  module: string
  auditPath: string
  price: string
}

export interface VerticalConfig {
  slug: string
  displayName: string
  urlPath: string
  shipped: boolean
  hero: { headline: string; subhead: string; proofLine: string }
  painPoints: CitedClaim[]
  demoStore: DemoStoreParams
  exampleMoves: ExampleMoveTemplate[]
  faq: FaqItem[]
  benchmarks: Benchmark[]
  spearhead: SpearheadOffer
  promptBattery: string[]
  seo: { title: string; description: string; ogHeadline: string }
  founderLine: string
}
