import type { VerticalConfig } from '../types'

/**
 * "Meridian Standard Apparel" — synthetic. Params anchored to cited benchmarks. Spot-
 * verified via WebFetch 2026-07-25: Richpanel (return rates) and Eightx (repeat
 * purchase rate) both match the addendum's figures exactly.
 */
export const apparelBrandsConfig: VerticalConfig = {
  slug: 'apparel-brands',
  displayName: 'Apparel & footwear brands',
  urlPath: '/for/apparel-brands',
  shipped: true,
  hero: {
    headline: 'Returns are eating your growth. Find out exactly where — and who.',
    subhead:
      'SimpleSense reads 12 months of orders and returns and shows you the serial refunders, the bracketing patterns, and the three SKUs driving half your return bill — plus the ranked list of moves the data says to make this week.',
    proofLine:
      'Built for apparel and footwear brands doing $2–20M. Flat price. No % of your GMV, no % of "recovered revenue."',
  },
  painPoints: [
    {
      claim:
        'Apparel returns run 20–40% of online orders, footwear 17–30% — at a 25% return rate, a $6M brand is re-handling $1.5M of merchandise a year (illustrative math on the cited range).',
      cite: {
        sourceUrl: 'https://www.richpanel.com/learn/ecommerce-return-rates',
        sourceName: 'Richpanel',
      },
    },
    {
      claim:
        'Repeat rates in apparel run 20–26% — retention programs get built while the returns line quietly cancels them out.',
      cite: {
        sourceUrl: 'https://eightx.co/blog/average-repeat-purchase-rate-by-vertical',
        sourceName: 'Eightx',
      },
    },
    {
      claim:
        'Most $2–20M brands manage returns policy by anecdote — the serial-abuser cohort and the honest-sizing-confusion cohort get treated identically, which punishes good customers and subsidizes bad ones.',
      cite: 'editorial',
    },
  ],
  demoStore: {
    storeName: 'Meridian Standard Apparel',
    annualRevenue: 6_500_000,
    ordersPerYear: 68_000, // AOV ≈ $95
    historyYears: 3,
    locations: [
      { city: 'Denver', region: 'CO', lat: 39.7392, lng: -104.9903, shareOfRevenue: 0.7 },
      { city: 'Boulder', region: 'CO', lat: 40.015, lng: -105.2705, shareOfRevenue: 0.3 },
    ],
    hasPhysicalLocations: true, // flagship + outlet
    subscriptionRevenueShare: 0,
    repeatPurchaseRate: 0.24, // anchor: apparel 20-26% (Eightx)
    returnRate: 0.26, // anchor: apparel 20-40% (Richpanel)
    discountedRevenueShare: 0.15,
    avgDiscountRate: 0.2,
    q4RevenueShare: 0.28,
    vipFlowCoveragePct: 0.5,
    skuTree: [
      { name: 'Classic Denim', category: 'denim', unitPrice: 95 },
      { name: 'Everyday Knit Tee', category: 'knits', unitPrice: 38 },
      { name: 'Trail Runner Jacket - Small', category: 'outerwear', unitPrice: 128 },
      { name: 'Trail Runner Jacket - Medium', category: 'outerwear', unitPrice: 128 },
      { name: 'Trail Runner Jacket - Large', category: 'outerwear', unitPrice: 128 },
      { name: 'Trail Sneaker', category: 'footwear', unitPrice: 110 },
      { name: 'Leather Belt', category: 'accessories', unitPrice: 42 },
    ],
    abusePatternSeed: {
      abuseCustomerSharePct: 0.015,
      bracketingStyleSkuNames: [
        'Trail Runner Jacket - Small',
        'Trail Runner Jacket - Medium',
        'Trail Runner Jacket - Large',
      ],
    },
  },
  exampleMoves: [
    {
      title: 'The 2% eating the 98%',
      narrativeTemplate:
        '{{computed.abuseCohortPct}}% of customers generate {{computed.abuseReturnSharePct}}% of return dollars ({{computed.abuseReturnValue}}/yr) → move this named cohort to inspection-first refunds; leave instant refunds on for everyone else.',
    },
    {
      title: 'Bracketing tax',
      narrativeTemplate:
        '{{computed.bracketingOrdersPct}}% of jacket orders are multi-size same-style with systematic returns → size-guide intervention + "fit promise" exchange flow on {{computed.bracketingTopSku}} before you touch policy.',
    },
    {
      title: 'Three SKUs, half the bill',
      narrativeTemplate:
        '{{computed.top3ReturnSkuSharePct}}% of return dollars come from 3 SKUs, and the reason text clusters on {{computed.topReturnReason}} → fix the product page, not the customer.',
    },
  ],
  faq: [
    {
      q: 'Is this going to tell us to punish customers?',
      a: 'No — outputs are review cohorts, never an auto-deny list. False positives punish good customers, so every flagged cohort is for manual review, not automated action.',
    },
    {
      q: 'What exports do you need and how long does it take?',
      a: 'Two CSVs — 12 months of order and return exports. First pass is typically the same week.',
    },
    {
      q: 'We use Loop/Returnly — does this replace it?',
      a: 'No — those platforms process returns. SimpleSense tells you what your returns mean: who the serial refunders are, which SKUs are the real problem, and what policy change actually addresses it.',
    },
    {
      q: 'What about exchanges vs. refunds?',
      a: 'Both are read from your return export and reflected in the analysis — an exchange isn’t treated identically to a refund in the underlying data.',
    },
    {
      q: 'Flat price vs. a % of recovery — why?',
      a: 'A recovery-percentage fee creates an incentive to over-flag borderline customers. A flat price keeps the incentive aligned with getting the analysis right, not maximizing flags.',
    },
  ],
  benchmarks: [
    {
      stat: 'Apparel return rate: 20–40%; footwear: 17–30%',
      sourceName: 'Richpanel',
      sourceUrl: 'https://www.richpanel.com/learn/ecommerce-return-rates',
    },
    {
      stat: 'Apparel category repeat-purchase rate: 20–26%',
      sourceName: 'Eightx',
      sourceUrl: 'https://eightx.co/blog/average-repeat-purchase-rate-by-vertical',
    },
  ],
  spearhead: { module: 'return-lens', auditPath: '/audits/return-lens', price: '$1,000' },
  promptBattery: [
    'best quality basics brands',
    'best jeans for tall men',
    'sustainable activewear brands worth it',
    'best white t-shirt that lasts',
    'direct-to-consumer denim brands',
    'best women’s workwear brands',
    'shoes that run true to size',
    'best affordable cashmere',
    'ethical clothing brands made in USA',
    'best men’s chinos',
    'capsule wardrobe brands',
    'best-fitting women’s jeans for curves',
  ],
  seo: {
    title: 'Apparel brand analytics that tells you what to do next — Simple Sense',
    description:
      'A free, grounded audit for apparel and footwear brands — find your serial refunders, bracketing patterns, and the exact SKUs driving your return bill.',
    ogHeadline: 'Returns are eating your growth. Find out exactly where — and who.',
  },
  founderLine: 'Built by an operator who has run stores like Nike and JCPenney.',
}
