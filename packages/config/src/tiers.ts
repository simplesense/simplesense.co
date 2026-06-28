/**
 * Subscription tiers (OPEN_QUESTIONS §9, RESOLVED): Free Audit $0 / Basic $99 / Pro $299.
 * Geo + Pareto live in BASIC — geo is the omnichannel wedge, so it's the hook, not a
 * paywall. Pro earns its upgrade on one-click execution + depth + scale. Business config,
 * not hardcoded logic: gating reads these entitlements.
 *
 * Note: the DB `Subscription.tier` enum is BASIC|PRO (paid tiers); "free" = no subscription
 * row (the free Audit needs no billing). `TierId` here includes 'free' for entitlement logic.
 */
export type TierId = 'free' | 'basic' | 'pro'

export type MovesAccess = 'top' | 'full'
export type CohortDepth = 'none' | 'basic' | 'full'
export type OutcomeDepth = 'none' | 'summary' | 'full'
export type ReanalysisCadence = 'one_time' | 'standard' | 'frequent'

export interface TierEntitlements {
  /** free = top moves only; paid = the full ranked list. */
  moves: MovesAccess
  freeAudit: boolean
  /** geo + Pareto analysis (the omnichannel wedge) — entitled at Basic. */
  geoPareto: boolean
  /** Klaviyo / segment export. */
  segmentExport: boolean
  /** one-click execution (Klaviyo, Shopify Flow, ads) — Pro only. */
  oneClickExecution: boolean
  cohortDepth: CohortDepth
  outcomeDepth: OutcomeDepth
  reanalysis: ReanalysisCadence
  multiStore: boolean
  apiAccess: boolean
  prioritySupport: boolean
}

export interface Tier {
  id: TierId
  name: string
  priceMonthly: number
  /** env key holding the Stripe price id, or null for the free tier. */
  stripePriceEnv: string | null
  entitlements: TierEntitlements
}

export const TIERS: Record<TierId, Tier> = {
  free: {
    id: 'free',
    name: 'Free Audit',
    priceMonthly: 0,
    stripePriceEnv: null,
    entitlements: {
      moves: 'top',
      freeAudit: true,
      geoPareto: false, // teaser only in the audit
      segmentExport: false,
      oneClickExecution: false,
      cohortDepth: 'none',
      outcomeDepth: 'none',
      reanalysis: 'one_time',
      multiStore: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    priceMonthly: 99,
    stripePriceEnv: 'STRIPE_PRICE_BASIC',
    entitlements: {
      moves: 'full',
      freeAudit: true,
      geoPareto: true,
      segmentExport: true,
      oneClickExecution: false,
      cohortDepth: 'basic',
      outcomeDepth: 'summary',
      reanalysis: 'standard',
      multiStore: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 299,
    stripePriceEnv: 'STRIPE_PRICE_PRO',
    entitlements: {
      moves: 'full',
      freeAudit: true,
      geoPareto: true,
      segmentExport: true,
      oneClickExecution: true,
      cohortDepth: 'full',
      outcomeDepth: 'full',
      reanalysis: 'frequent',
      multiStore: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
}

/** Boolean entitlement check used by feature gating (Slice 10). */
export function tierAllows(tier: TierId, key: keyof TierEntitlements): boolean {
  return TIERS[tier].entitlements[key] === true
}
