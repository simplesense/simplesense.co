import type { VerticalConfig } from '../types'

/**
 * "Ember & Ash Candle Co." — synthetic. Params anchored to cited benchmarks. Spot-
 * verified via WebFetch 2026-07-25: Eightx (repeat purchase rate) matches exactly;
 * Grand View Research (home fragrance market) returned HTTP 403 to automated fetch —
 * could not independently re-verify, flagged in PARKING_LOT.md (low-stakes claim, not
 * load-bearing for any computed number on this page).
 */
export const candleBrandsConfig: VerticalConfig = {
  slug: 'candle-brands',
  displayName: 'Candle & home-fragrance brands',
  urlPath: '/for/candle-brands',
  shipped: true,
  hero: {
    headline: 'Q4 carries your year. Do you know which 200 customers carry Q4?',
    subhead:
      'SimpleSense reads your full order history and hands you a short, ranked list of moves — the VIPs to over-serve, the geo pockets to own, the discounts quietly eating your margin — before the season, not after it.',
    proofLine:
      'Built for candle and home-fragrance brands that graduated from markets to a real store. Free audit first; upgrade only if it makes you money.',
  },
  painPoints: [
    {
      claim:
        'Home fragrance is a $13.2B market headed to $26.5B by 2033, with scented candles growing ~10%/yr — the graduating class from maker to $1–5M brand is large, and almost none of it has an analyst.',
      cite: {
        sourceUrl: 'https://www.grandviewresearch.com/industry-analysis/home-fragrance-market',
        sourceName: 'Grand View Research',
      },
    },
    {
      claim:
        'Home-goods repeat rates run 18–25% — in a gift-heavy category, the difference between the top and bottom of that range is whether gift recipients ever become buyers.',
      cite: {
        sourceUrl: 'https://eightx.co/blog/average-repeat-purchase-rate-by-vertical',
        sourceName: 'Eightx',
      },
    },
    {
      claim:
        'Gift-season revenue concentration means one mis-planned Q4 ad budget or one blanket sitewide discount can erase the year’s margin.',
      cite: 'editorial',
    },
  ],
  demoStore: {
    storeName: 'Ember & Ash Candle Co.',
    annualRevenue: 2_800_000,
    ordersPerYear: 67_000, // AOV ≈ $42
    historyYears: 4,
    locations: [{ city: 'Austin', region: 'TX', lat: 30.2672, lng: -97.7431, shareOfRevenue: 1 }],
    hasPhysicalLocations: true, // one studio-storefront, farmers-market heritage
    subscriptionRevenueShare: 0.06,
    repeatPurchaseRate: 0.22, // anchor: home décor 18-25% (Eightx)
    returnRate: 0.03,
    discountedRevenueShare: 0.34,
    avgDiscountRate: 0.2,
    q4RevenueShare: 0.4, // editorial — gift-driven curve
    vipFlowCoveragePct: 0.5,
    skuTree: [
      { name: 'Signature Soy Candle', category: 'core', unitPrice: 32 },
      { name: 'Seasonal Drop Candle', category: 'seasonal', unitPrice: 36 },
      { name: 'Holiday Gift Set', category: 'gift-sets', unitPrice: 68 },
      { name: 'Reed Diffuser', category: 'core', unitPrice: 44 },
      { name: 'Wholesale Case (6-pack)', category: 'wholesale', unitPrice: 150 },
    ],
  },
  exampleMoves: [
    {
      title: 'Gift-buyers → repeat buyers',
      narrativeTemplate:
        '{{computed.giftBuyerOneTimePct}}% of last Q4’s buyers purchased exactly once → capture the recipient, not just the giver: insert-card flow + a January "for you this time" campaign to {{computed.q4OneTimeBuyerCount}} customers.',
    },
    {
      title: 'The discount treadmill',
      narrativeTemplate:
        '{{computed.discountedRevenuePct}}% of revenue transacted with a code at an average {{computed.avgDiscountPct}}% discount → kill the always-on code, gate discounts behind email/SMS opt-in before Q4 spend starts.',
    },
    {
      title: 'Own your metro',
      narrativeTemplate:
        '{{computed.localRevenuePct}}% of geocoded revenue is within {{computed.localRadiusMiles}} miles of the studio → local-gift positioning + pickup for December procrastinators beats national shipping-deadline panic.',
    },
  ],
  faq: [
    {
      q: 'We sell wholesale too — does that mess up the analysis?',
      a: 'No — wholesale orders are included in the same computed metrics as any other channel; nothing is excluded or double-counted.',
    },
    {
      q: 'Our Q4 is everything — when’s the right time to run this?',
      a: 'Now. Moves need runway before the season — the earlier you see the gaps, the more time you have to close them before Q4 spend starts.',
    },
    {
      q: 'We’re small ($1–2M) — is this overkill?',
      a: 'No — the free audit works from your existing order history regardless of size, and shows your top 3 moves at no cost.',
    },
    {
      q: 'What exactly connects, and can you break our store?',
      a: 'Access is read-only. We never write to your Shopify store, and your token is encrypted at rest.',
    },
    {
      q: 'Do you tell us what AI assistants say when people ask for candle recommendations?',
      a: 'Yes — that’s AnswerShelf, our paired audit: share of voice, first-mention rate, sentiment, and the exact pages models cite when they recommend a candle brand.',
    },
  ],
  benchmarks: [
    {
      stat: 'Home fragrance market: $13.2B, projected $26.5B by 2033',
      sourceName: 'Grand View Research',
      sourceUrl: 'https://www.grandviewresearch.com/industry-analysis/home-fragrance-market',
    },
    {
      stat: 'Home-goods category repeat-purchase rate: 18–25%',
      sourceName: 'Eightx',
      sourceUrl: 'https://eightx.co/blog/average-repeat-purchase-rate-by-vertical',
    },
  ],
  spearhead: { module: 'answer-shelf', auditPath: '/audits/answer-shelf', price: '$500' },
  promptBattery: [
    'best non-toxic candles',
    'best soy candle brands',
    'luxury candle brands that aren’t $80',
    'best candle gift sets for the holidays',
    'candles like Diptyque but affordable',
    'best long-lasting scented candles',
    'clean-burning candle brands',
    'best fall candle scents',
    'best candle subscription box',
    'wedding favor candles in bulk',
    'best wood-wick candles',
    'candle brands with refill programs',
  ],
  seo: {
    title: 'Candle brand analytics that tells you what to do next — Simple Sense',
    description:
      'A free, grounded audit for candle and home-fragrance brands — find your gift-buyer gap, your discount leak, and the exact moves to make before Q4.',
    ogHeadline: 'Q4 carries your year. Do you know which 200 customers carry Q4?',
  },
  founderLine: 'Built by an operator who has run stores like SelectBlinds, Art Van, and Conn’s.',
}
