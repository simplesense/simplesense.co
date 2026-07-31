import { NextResponse } from 'next/server'
import { stripeConfig } from '@ss/config'
import { createStripeClient } from '@ss/integrations'
import { DEMO, prisma } from '@ss/db'
import { getSession } from '@/lib/auth'
import { priceIdForTier } from '@/lib/billing'
import { rateLimit, redactSecrets } from '@/lib/security'

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

  const origin = new URL(req.url).origin
  const { orgId } = await getSession()
  // The shared demo org is a read-only showcase — never let it start a real Stripe checkout
  // (would otherwise let ANY unauthenticated/no-Clerk-session visitor become the customer of
  // record for the demo org's Subscription row, which every other DEMO-collapsed visitor
  // then shares). This is a browser form POST from a prospect evaluating the demo, so send
  // them back to /plans with an explanation rather than raw JSON.
  if (orgId === DEMO.orgId) {
    return NextResponse.redirect(`${origin}/plans?demo=1`, { status: 303 })
  }

  // A merchant who ALREADY pays must never be sent through Checkout again: Stripe would
  // open a second subscription under a second customer id, bill them for both, and the
  // webhook would overwrite stripeCustomerId with the newer one — leaving the original
  // charge invisible and uncancellable from inside the product (found 2026-07-31).
  // Plan changes belong in the customer portal, which does a proration-aware swap.
  const existing = await prisma.subscription.findUnique({
    where: { orgId },
    select: { status: true, stripeCustomerId: true },
  })
  const alreadySubscribed =
    existing && (existing.status === 'ACTIVE' || existing.status === 'PAST_DUE')
  if (alreadySubscribed && existing.stripeCustomerId) {
    try {
      const portalUrl = await createStripeClient().createPortalSession({
        customerId: existing.stripeCustomerId,
        returnUrl: `${origin}/plans`,
      })
      return NextResponse.redirect(portalUrl, { status: 303 })
    } catch (err) {
      console.error(
        '[checkout] portal redirect for existing subscriber failed:',
        redactSecrets(err instanceof Error ? err.message : String(err)),
      )
      return NextResponse.redirect(`${origin}/plans?failed=1`, { status: 303 })
    }
  }
  if (alreadySubscribed) {
    // Subscribed but we never captured a customer id — cannot safely open Checkout
    // (double-bill risk) and cannot open the portal either. Surface it rather than charge.
    return NextResponse.redirect(`${origin}/plans?manage=1`, { status: 303 })
  }
  let url: string
  try {
    url = await createStripeClient().createCheckoutSession({
      priceId,
      orgId,
      tier,
      successUrl: `${origin}/plans?upgraded=1`,
      cancelUrl: `${origin}/plans?canceled=1`,
    })
  } catch (err) {
    // A Stripe outage or misconfigured price must not dead-end the merchant on a raw
    // 500 page with no way back (observed 2026-07-31). The real cause — which includes
    // Stripe's own error text — goes to the server log; the merchant gets a plain-language
    // message and stays on /plans. Never surface the provider's message to the client:
    // it can name internal price/account ids.
    console.error(
      '[checkout] Stripe session creation failed:',
      redactSecrets(err instanceof Error ? err.message : String(err)),
    )
    return NextResponse.redirect(`${origin}/plans?failed=1`, { status: 303 })
  }
  return NextResponse.redirect(url, { status: 303 })
}
