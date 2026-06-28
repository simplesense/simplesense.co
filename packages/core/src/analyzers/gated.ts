import type { Analyzer } from '../types'
import { windowLabel } from '../window'
import { insufficient } from '../metrics'

/**
 * Fast-follow analyzers that require EXTERNAL data Shopify alone cannot provide.
 * They are NAMED (so the catalog is honest and the dependency is explicit) but never
 * fabricate a number — each emits an insufficient/flagged Metric until the inbound
 * integration is wired. See §8.1 "Connected-data analyzers".
 */

/** Channel profitability / LTV:CAC — needs ad spend (Meta/Google read scope). */
export const channelProfitabilityAnalyzer: Analyzer = (ctx) => [
  insufficient(
    'channel_profitability.ltv_cac',
    'requires ad-spend from Meta/Google joined to cohort LTV; not computable from Shopify alone',
    {
      unit: 'ratio',
      window: windowLabel(ctx),
      valueJson: { fast_follow: true, requires: ['meta_ad_spend', 'google_ad_spend'] },
    },
  ),
]

/** Owned-channel share & flow coverage — needs Klaviyo read data. */
export const ownedChannelAnalyzer: Analyzer = (ctx) => [
  insufficient(
    'owned_channel.email_revenue_share',
    'requires Klaviyo email/SMS revenue + flow inventory; not computable from Shopify alone',
    {
      unit: 'ratio',
      window: windowLabel(ctx),
      valueJson: { fast_follow: true, requires: ['klaviyo'] },
    },
  ),
]
