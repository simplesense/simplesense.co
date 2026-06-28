/**
 * Subscription tiers (§1.3, OPEN_QUESTIONS §9). Business config, NOT hardcoded logic:
 * gating reads these entitlements. The free "Simple Sense Audit" is the front door and
 * is available without a paid tier.
 */
export type TierId = 'basic' | 'pro'

export type CohortDepth = 'basic' | 'full'
export type IntegrationMode = 'export' | 'one_click'
export type OutcomeDepth = 'summary' | 'full'
export type ReanalysisCadence = 'standard' | 'frequent'

export interface TierEntitlements {
  /** ranked Moves (core engine) + free Audit are in every tier. */
  rankedMoves: boolean
  freeAudit: boolean
  multiStore: boolean
  cohortDepth: CohortDepth
  integrationMode: IntegrationMode
  outcomeDepth: OutcomeDepth
  reanalysis: ReanalysisCadence
  apiAccess: boolean
  prioritySupport: boolean
}

export interface Tier {
  id: TierId
  name: string
  priceMonthly: number
  /** env key holding the Stripe price id for this tier. */
  stripePriceEnv: string
  entitlements: TierEntitlements
}

export const TIERS: Record<TierId, Tier> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    priceMonthly: 49,
    stripePriceEnv: 'STRIPE_PRICE_BASIC',
    entitlements: {
      rankedMoves: true,
      freeAudit: true,
      multiStore: false,
      cohortDepth: 'basic',
      integrationMode: 'export',
      outcomeDepth: 'summary',
      reanalysis: 'standard',
      apiAccess: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 99,
    stripePriceEnv: 'STRIPE_PRICE_PRO',
    entitlements: {
      rankedMoves: true,
      freeAudit: true,
      multiStore: true,
      cohortDepth: 'full',
      integrationMode: 'one_click',
      outcomeDepth: 'full',
      reanalysis: 'frequent',
      apiAccess: true,
      prioritySupport: true,
    },
  },
}

/** Boolean entitlement check used by feature gating (Slice 10). */
export function tierAllows(tier: TierId, key: keyof TierEntitlements): boolean {
  return TIERS[tier].entitlements[key] === true
}
