import { prisma } from '@ss/db'
import { TIERS, stripeConfig, type TierId, type TierEntitlements } from '@ss/config'
import { subscriptionLapsed } from '@ss/integrations'

/** The org's current tier (free when no active subscription). */
export async function currentTier(orgId: string): Promise<TierId> {
  const sub = await prisma.subscription.findUnique({
    where: { orgId },
    select: { tier: true, status: true, currentPeriodEnd: true },
  })
  if (!sub || sub.status === 'CANCELED') return 'free'
  // Missed-webhook safety: a paid period that ended > grace window ago no longer grants
  // paid access, regardless of a stale ACTIVE/PAST_DUE status row.
  if (subscriptionLapsed(sub.currentPeriodEnd)) return 'free'
  return sub.tier === 'PRO' ? 'pro' : 'basic'
}

/** Resolved entitlements for the org (used by feature gating). */
export async function entitlementsForOrg(orgId: string): Promise<TierEntitlements> {
  return TIERS[await currentTier(orgId)].entitlements
}

/** Stripe price id for a paid tier (null if not configured). */
export function priceIdForTier(tier: 'BASIC' | 'PRO'): string | null {
  const cfg = stripeConfig()
  return tier === 'PRO' ? cfg.pricePro : cfg.priceBasic
}
