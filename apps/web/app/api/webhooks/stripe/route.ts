import { NextResponse } from 'next/server'
import { stripeConfig } from '@ss/config'
import { createStripeClient } from '@ss/integrations'
import { prisma } from '@ss/db'

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

  if (evt.orgId && (evt.tier || evt.status)) {
    await prisma.subscription.upsert({
      where: { orgId: evt.orgId },
      update: {
        ...(evt.tier ? { tier: evt.tier } : {}),
        ...(evt.status ? { status: evt.status } : {}),
      },
      create: {
        orgId: evt.orgId,
        tier: evt.tier ?? 'BASIC',
        status: evt.status ?? 'ACTIVE',
      },
    })
  }
  return NextResponse.json({ ok: true })
}
