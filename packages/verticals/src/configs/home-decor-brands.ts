import type { VerticalConfig } from '../types'

/**
 * Config stub only — NOT shipped (addendum §0.3: "Page 4 exists as a config stub only
 * — not shipped"). `shipped: false` keeps it out of every page-generation loop
 * (sitemap, nav, route list). Minimal placeholder content since it's never rendered;
 * fill in real copy/benchmarks only if this vertical is promoted per §7's scale rule.
 */
export const homeDecorBrandsConfig: VerticalConfig = {
  slug: 'home-decor-brands',
  displayName: 'Home décor brands',
  urlPath: '/for/home-decor-brands',
  shipped: false,
  hero: { headline: '', subhead: '', proofLine: '' },
  painPoints: [],
  demoStore: {
    storeName: 'Stub — not shipped',
    annualRevenue: 0,
    ordersPerYear: 1,
    historyYears: 1,
    locations: [],
    hasPhysicalLocations: false,
    subscriptionRevenueShare: 0,
    repeatPurchaseRate: 0,
    returnRate: 0,
    discountedRevenueShare: 0,
    avgDiscountRate: 0,
    q4RevenueShare: 0,
    vipFlowCoveragePct: 0,
    skuTree: [],
  },
  exampleMoves: [],
  faq: [],
  benchmarks: [],
  spearhead: { module: '', auditPath: '', price: '' },
  promptBattery: [],
  seo: { title: '', description: '', ogHeadline: '' },
  founderLine: '',
}
