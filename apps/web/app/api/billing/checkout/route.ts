import { NextResponse } from 'next/server'
import { stripeConfig } from '@ss/config'
import { createStripeClient } from '@ss/integrations'
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
  const origin = new URL(req.url).origin
  const url = await createStripeClient().createCheckoutSession({
    priceId,
    orgId,
    tier,
    successUrl: `${origin}/plans?upgraded=1`,
    cancelUrl: `${origin}/plans`,
  })
  return NextResponse.redirect(url, { status: 303 })
}
