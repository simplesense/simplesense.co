import { NextResponse } from 'next/server'
import { stripeConfig } from '@ss/config'
import { createStripeClient, resolvePeriodEndUpdate } from '@ss/integrations'
import { prisma, DEMO } from '@ss/db'

/** Stripe webhooks: verify signature, then sync the org's subscription tier/status. */
export async function POST(req: Request): Promise<Response> {
  const cfg = stripeConfig()
  if (!cfg.hasCredentials) return new NextResponse('not configured', { status: 503 })
  // No webhook secret → we can't authenticate Stripe's calls; refuse rather than fail open.
  if (!cfg.webhookSecret) {
    return new NextResponse('webhook secret not configured', { status: 503 })
  }

  const raw = await req.text()
  const evt = createStripeClient().parseWebhook(raw, req.headers.get('stripe-signature'))
  if (!evt) return new NextResponse('invalid signature', { status: 401 })

  // The shared demo org must never accumulate a real Stripe customer id — same invariant
  // enforced on every other mutating path (SECURITY.md: "mutating server actions refuse
  // writes to the demo store"). It can only arrive here if a checkout ever ran under an
  // unauthenticated/no-Clerk session that collapsed to DEMO.
  if (evt.orgId && evt.orgId !== DEMO.orgId && (evt.tier || evt.status)) {
    // Stripe does not guarantee webhook delivery order (retries especially can arrive after
    // a newer event already landed). A stale current_period_end would wrongly trip
    // subscriptionLapsed and demote a paying customer, so only ever move it forward.
    const existing = await prisma.subscription.findUnique({
      where: { orgId: evt.orgId },
      select: { currentPeriodEnd: true },
    })
    const nextPeriodEnd = resolvePeriodEndUpdate(
      existing?.currentPeriodEnd ?? null,
      evt.currentPeriodEnd,
    )
    await prisma.subscription.upsert({
      where: { orgId: evt.orgId },
      update: {
        ...(evt.tier ? { tier: evt.tier } : {}),
        ...(evt.status ? { status: evt.status } : {}),
        ...(evt.customerId ? { stripeCustomerId: evt.customerId } : {}),
        ...(nextPeriodEnd ? { currentPeriodEnd: nextPeriodEnd } : {}),
      },
      create: {
        orgId: evt.orgId,
        tier: evt.tier ?? 'BASIC',
        status: evt.status ?? 'ACTIVE',
        stripeCustomerId: evt.customerId,
        currentPeriodEnd: evt.currentPeriodEnd,
      },
    })
  }
  return NextResponse.json({ ok: true })
}
