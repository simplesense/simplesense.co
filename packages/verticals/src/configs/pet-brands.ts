import type { VerticalConfig } from '../types'

/**
 * "Desert Paws Supply Co." — synthetic, Phoenix-flavored. Params anchored to cited
 * benchmarks (see each field's comment) — editorial choices inside a published range,
 * not claimed to be "the" number. Spot-verified via WebFetch 2026-07-25: Eightx (repeat
 * purchase rate) and APPA (pet industry size) both match the addendum's figures exactly.
 */
export const petBrandsConfig: VerticalConfig = {
  slug: 'pet-brands',
  displayName: 'Pet brands & boutiques',
  urlPath: '/for/pet-brands',
  shipped: true,
  hero: {
    headline: 'Your regulars keep the lights on. Do you know who they are?',
    subhead:
      'SimpleSense reads your whole store — online orders, local pickup, all of it — and tells you the few moves that grow repeat business this week. What to do, why, and the dollar impact.',
    proofLine:
      'Built for independent pet brands doing $1M–$15M. No dashboards to learn. No GMV tax.',
  },
  painPoints: [
    {
      claim:
        'Repeat purchase is the whole game in pet — category benchmarks run 28–35%, and subscription-strong stores reach 40–60% — but most $1–15M stores can’t name their top-20% customers or what they’d respond to.',
      cite: {
        sourceUrl: 'https://eightx.co/blog/average-repeat-purchase-rate-by-vertical',
        sourceName: 'Eightx',
      },
    },
    {
      claim:
        'U.S. pet spending reached $158B in 2025 and is projected to reach $165B in 2026 — the growth is real; the question is whether yours is coming from new one-time buyers or compounding regulars.',
      cite: {
        sourceUrl:
          'https://americanpetproducts.org/news/u.s.-pet-industry-reaches-158-billion-in-2025-poised-for-continued-growth-in-2026',
        sourceName: 'APPA',
      },
    },
    {
      claim:
        'Boutiques with physical locations rarely know what share of online buyers live within driving distance — the highest-margin marketing they could run is the one they can’t see.',
      cite: 'editorial',
    },
  ],
  demoStore: {
    storeName: 'Desert Paws Supply Co.',
    annualRevenue: 4_200_000,
    ordersPerYear: 62_000, // AOV ≈ $68
    historyYears: 3.5,
    locations: [
      { city: 'Phoenix', region: 'AZ', lat: 33.4484, lng: -112.074, shareOfRevenue: 0.55 },
      { city: 'Scottsdale', region: 'AZ', lat: 33.4942, lng: -111.9261, shareOfRevenue: 0.25 },
      { city: 'Tempe', region: 'AZ', lat: 33.4255, lng: -111.94, shareOfRevenue: 0.2 },
    ],
    hasPhysicalLocations: true,
    subscriptionRevenueShare: 0.28,
    repeatPurchaseRate: 0.32, // anchor: pet 28-35% (Eightx)
    returnRate: 0.04, // editorial — consumables-dominant category, no pet line in return-rate benchmarks
    discountedRevenueShare: 0.18,
    avgDiscountRate: 0.15,
    q4RevenueShare: 0.24,
    vipFlowCoveragePct: 0.45,
    skuTree: [
      { name: 'Grain-Free Dog Food 25lb', category: 'food', unitPrice: 62 },
      { name: 'Freeze-Dried Treats', category: 'treats', unitPrice: 18 },
      { name: 'Interactive Cat Toy', category: 'toys', unitPrice: 24 },
      { name: 'Salmon Oil Supplement', category: 'supplements', unitPrice: 32 },
      { name: 'Monthly Chew Box Subscription', category: 'subscription', unitPrice: 45 },
    ],
  },
  exampleMoves: [
    {
      title: 'The regulars you haven’t met',
      narrativeTemplate:
        '{{computed.top20SharePct}}% of your revenue comes from your top {{computed.topTierPct}}% of customers, and roughly {{computed.vipNoFlowCount}} of them aren’t in any retention flow → build the exact VIP segment (one-click export), launch a replenishment flow timed to your {{computed.medianReorderDays}}-day reorder cycle.',
    },
    {
      title: 'The 5-mile goldmine',
      narrativeTemplate:
        '{{computed.localRevenuePct}}% of your geocoded revenue sits within {{computed.localRadiusMiles}} miles of your stores → geo-fence Meta/Google to that radius, turn on local pickup, stop paying national CPMs for neighbors.',
    },
    {
      title: 'Subscription leak',
      narrativeTemplate:
        'An estimated {{computed.churnedSubscriberCount}} subscribers lapse every quarter, worth roughly {{computed.lapsedSubscriberValueUsd}}/yr → winback flow with a pickup-day incentive, not a blanket discount.',
    },
  ],
  faq: [
    {
      q: 'Do you work with stores that sell in-person and online?',
      a: 'Yes — SimpleSense reads local pickup and physical-location data alongside online orders, and the geography analysis is built specifically for omnichannel stores.',
    },
    {
      q: 'We’re on Klaviyo — what do you actually check?',
      a: 'Retention X-Ray (our paired audit) reads your flow coverage, revenue-per-flow trend, list health, cadence, segment architecture, and discount dependency — all computed from your own account.',
    },
    {
      q: 'What data do you read, and can you see customer payment details?',
      a: 'No. Access is read-only, your Shopify token is encrypted at rest, and the model only ever receives aggregate metrics — never raw customer or payment records.',
    },
    {
      q: 'What does the free audit include vs. the paid plan?',
      a: 'Free shows your fixed top-3 moves from your latest run. Basic ($99/mo) unlocks the full ranked move list, geo + Pareto analysis, and Klaviyo/segment/SKU exports.',
    },
    {
      q: 'How is this different from our Shopify analytics tab?',
      a: 'Shopify analytics shows you what happened. SimpleSense tells you what to do next — ranked, with the dollar impact and the exact action, computed from your own numbers.',
    },
  ],
  benchmarks: [
    {
      stat: 'Pet category repeat-purchase rate: 28–35%, up to 40–60% for subscription-strong brands',
      sourceName: 'Eightx',
      sourceUrl: 'https://eightx.co/blog/average-repeat-purchase-rate-by-vertical',
    },
    {
      stat: 'U.S. pet industry: $158B in 2025, projected $165B in 2026',
      sourceName: 'APPA',
      sourceUrl:
        'https://americanpetproducts.org/news/u.s.-pet-industry-reaches-158-billion-in-2025-poised-for-continued-growth-in-2026',
    },
  ],
  spearhead: {
    module: 'retention-x-ray',
    auditPath: '/audits/retention-x-ray',
    price: '$750–1,500',
  },
  promptBattery: [
    'best natural dog food brands',
    'healthiest dog treats made in the USA',
    'best cat litter for odor control',
    'best dog food subscription service',
    'premium dog food brands vets recommend',
    'best puppy starter kit',
    'best salmon oil for dogs',
    'non-prescription options for dog joint health',
    'best cat toys for indoor cats',
    'best pet store gift ideas',
    'durable dog toys for aggressive chewers',
    'best raw dog food brands',
  ],
  seo: {
    title: 'Pet brand analytics that tells you what to do next — Simple Sense',
    description:
      'A free, grounded audit for independent pet brands — find your top-20% customers, your local-pickup radius, and the exact moves to grow repeat business this week.',
    ogHeadline: 'Your regulars keep the lights on. Do you know who they are?',
  },
  founderLine: 'Built by an operator who has run the stores — 25 years in retail operations.',
}
