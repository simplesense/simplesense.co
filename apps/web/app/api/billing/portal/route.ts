import { NextResponse } from 'next/server'
import { stripeConfig } from '@ss/config'
import { createStripeClient } from '@ss/integrations'
import { prisma, DEMO } from '@ss/db'
import { getSession } from '@/lib/auth'
import { rateLimit } from '@/lib/security'

/** Open the Stripe customer portal (manage payment method / cancel). POST, no body. */
export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(`portal:${ip}`, 10, 60_000).allowed) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  }
  const cfg = stripeConfig()
  if (!cfg.hasCredentials) {
    return NextResponse.json({ error: 'Billing not configured.' }, { status: 503 })
  }
  const { orgId } = await getSession()
  const origin = new URL(req.url).origin
  // The shared demo org must never be routed into a real Stripe customer portal — even if a
  // stripeCustomerId somehow landed on its row, it is never THIS visitor's own billing.
  if (orgId === DEMO.orgId) return NextResponse.redirect(`${origin}/plans`, { status: 303 })
  const sub = await prisma.subscription.findUnique({
    where: { orgId },
    select: { stripeCustomerId: true },
  })
  // No captured customer id (never checked out, or pre-capture subscriber): nothing to
  // manage — send them back to /plans instead of erroring.
  if (!sub?.stripeCustomerId) return NextResponse.redirect(`${origin}/plans`, { status: 303 })
  const url = await createStripeClient().createPortalSession({
    customerId: sub.stripeCustomerId,
    returnUrl: `${origin}/plans`,
  })
  return NextResponse.redirect(url, { status: 303 })
}
