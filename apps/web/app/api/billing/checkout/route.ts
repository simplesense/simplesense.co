import { NextResponse } from 'next/server'
import { stripeConfig } from '@ss/config'
import { createStripeClient } from '@ss/integrations'
import { DEMO } from '@ss/db'
import { getSession } from '@/lib/auth'
import { priceIdForTier } from '@/lib/billing'
import { rateLimit } from '@/lib/security'

/** Start a Stripe Checkout for the chosen tier. POST form field `tier` = basic|pro. */
export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(`checkout:${ip}`, 10, 60_000).allowed) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  }
  const cfg = stripeConfig()
  if (!cfg.hasCredentials) {
    return NextResponse.json(
      { error: 'Billing not configured. Set STRIPE_SECRET_KEY + STRIPE_PRICE_BASIC/PRO.' },
      { status: 503 },
    )
  }
  const form = await req.formData()
  const tier = String(form.get('tier') ?? '').toUpperCase()
  if (tier !== 'BASIC' && tier !== 'PRO') {
    return NextResponse.json({ error: 'invalid tier' }, { status: 400 })
  }
  const priceId = priceIdForTier(tier)
  if (!priceId) return NextResponse.json({ error: `no Stripe price for ${tier}` }, { status: 503 })

  const { orgId } = await getSession()
  // The shared demo org is a read-only showcase — never let it start a real Stripe checkout
  // (would otherwise let ANY unauthenticated/no-Clerk-session visitor become the customer of
  // record for the demo org's Subscription row, which every other DEMO-collapsed visitor
  // then shares).
  if (orgId === DEMO.orgId) {
    return NextResponse.json({ error: 'not available for the demo org' }, { status: 403 })
  }
  const origin = new URL(req.url).origin
  const url = await createStripeClient().createCheckoutSession({
    priceId,
    orgId,
    tier,
    successUrl: `${origin}/plans?upgraded=1`,
    cancelUrl: `${origin}/plans?canceled=1`,
  })
  return NextResponse.redirect(url, { status: 303 })
}
