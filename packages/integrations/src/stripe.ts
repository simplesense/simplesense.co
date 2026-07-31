import { createHmac, timingSafeEqual } from 'node:crypto'
import { stripeConfig } from '@ss/config'

export interface CheckoutParams {
  priceId: string
  orgId: string
  tier: 'BASIC' | 'PRO'
  successUrl: string
  cancelUrl: string
}

export interface StripeEvent {
  type: string
  orgId: string | null
  tier: 'BASIC' | 'PRO' | null
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | null
  /** Stripe customer id (cus_...) when the event carries one as a plain string. */
  customerId: string | null
  /** End of the paid period, when the event carries current_period_end (unix seconds). */
  currentPeriodEnd: Date | null
}

export interface StripeClient {
  createCheckoutSession(p: CheckoutParams): Promise<string>
  /** Verify the Stripe-Signature header over the raw body, then parse to our event shape. */
  parseWebhook(rawBody: string, signature: string | null): StripeEvent | null
  createPortalSession(p: { customerId: string; returnUrl: string }): Promise<string>
}

/** Max age of a signed webhook before it's considered a replay (Stripe's own default). */
const SIGNATURE_TOLERANCE_SECONDS = 300

/**
 * Verify a Stripe webhook signature (scheme: `t=<ts>,v1=<hmac of "ts.body">`).
 * - Accepts if ANY v1 entry matches (Stripe sends multiple v1s during secret rotation).
 * - Rejects timestamps older than the tolerance window: the t= value is HMAC'd, so without
 *   this check any captured signed payload would stay valid forever (replay).
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowMs = Date.now(),
): boolean {
  if (!header) return false
  const pairs = header.split(',').map((kv) => kv.split('=') as [string, string])
  const t = pairs.find(([k]) => k === 't')?.[1]
  const v1s = pairs.filter(([k]) => k === 'v1').map(([, v]) => v ?? '')
  if (!t || v1s.length === 0) return false
  const ts = Number(t)
  if (!Number.isFinite(ts) || Math.abs(nowMs / 1000 - ts) > SIGNATURE_TOLERANCE_SECONDS) {
    return false
  }
  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex')
  const a = Buffer.from(expected)
  return v1s.some((v1) => {
    const b = Buffer.from(v1)
    return a.length === b.length && timingSafeEqual(a, b)
  })
}

export class RealStripeClient implements StripeClient {
  constructor(private readonly cfg: { secretKey: string; webhookSecret: string | null }) {}

  async createCheckoutSession(p: CheckoutParams): Promise<string> {
    const body = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': p.priceId,
      'line_items[0][quantity]': '1',
      success_url: p.successUrl,
      cancel_url: p.cancelUrl,
      client_reference_id: p.orgId,
      'metadata[orgId]': p.orgId,
      'metadata[tier]': p.tier,
      // ALSO stamp the Subscription object: lifecycle webhooks (customer.subscription.updated/
      // deleted — cancellations, payment failures, downgrades) carry the SUBSCRIPTION's
      // metadata, not the checkout session's. Without this they arrive with no orgId and are
      // dropped, so a canceled subscription would keep its tier forever.
      'subscription_data[metadata][orgId]': p.orgId,
      'subscription_data[metadata][tier]': p.tier,
    })
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.cfg.secretKey}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    })
    if (!res.ok) {
      const errorBody = (await res.json().catch(() => null)) as {
        error?: { message?: string }
      } | null
      throw new Error(
        `Stripe checkout failed: ${res.status}${errorBody?.error?.message ? ` — ${errorBody.error.message}` : ''}`,
      )
    }
    const data = (await res.json()) as { url?: string }
    if (!data.url) throw new Error('Stripe returned no checkout url')
    return data.url
  }

  parseWebhook(rawBody: string, signature: string | null): StripeEvent | null {
    // FAIL CLOSED: with no webhook secret configured we cannot authenticate the payload —
    // reject rather than trust it (an unauthenticated body could upsert any org's tier).
    if (!this.cfg.webhookSecret) return null
    if (!verifyStripeSignature(rawBody, signature, this.cfg.webhookSecret)) return null
    const evt = JSON.parse(rawBody) as {
      type: string
      data?: {
        object?: {
          metadata?: { orgId?: string; tier?: string }
          status?: string
          payment_status?: string
          customer?: unknown
          current_period_end?: unknown
          items?: { data?: Array<{ current_period_end?: unknown }> }
        }
      }
    }
    const obj = evt.data?.object
    // customer may arrive expanded as an object; we only trust a plain string id.
    const customerId =
      typeof obj?.customer === 'string' && obj.customer !== '' ? obj.customer : null
    // Stripe API >= 2025-03-31 (Basil) moved current_period_end from the Subscription top
    // level onto items.data[]. Accept either location; validate it's a positive finite number
    // that also produces a representable Date (an in-range-but-absurd value would otherwise
    // become an Invalid Date that subscriptionLapsed silently treats as "never lapses").
    const rawPeriodEnd = obj?.current_period_end ?? obj?.items?.data?.[0]?.current_period_end
    const parsedPeriodEnd =
      typeof rawPeriodEnd === 'number' && Number.isFinite(rawPeriodEnd) && rawPeriodEnd > 0
        ? new Date(rawPeriodEnd * 1000)
        : null
    const currentPeriodEnd =
      parsedPeriodEnd && !Number.isNaN(parsedPeriodEnd.getTime()) ? parsedPeriodEnd : null
    // FAIL CLOSED on revocation-shaped statuses: an unmapped status must never silently keep
    // paid entitlements. unpaid/incomplete_expired = dunning gave up → revoke; paused/
    // incomplete = limbo → PAST_DUE; and any FUTURE status Stripe adds on a subscription
    // lifecycle event resolves to CANCELED rather than a no-op that leaves ACTIVE forever.
    const statusMap: Record<string, StripeEvent['status']> = {
      active: 'ACTIVE',
      trialing: 'ACTIVE',
      past_due: 'PAST_DUE',
      paused: 'PAST_DUE',
      incomplete: 'PAST_DUE',
      canceled: 'CANCELED',
      unpaid: 'CANCELED',
      incomplete_expired: 'CANCELED',
    }
    const isSubscriptionLifecycle = evt.type.startsWith('customer.subscription.')
    const isCheckoutSession = evt.type.startsWith('checkout.session.')
    const tier = obj?.metadata?.tier
    // A Checkout Session's `status` is the SESSION's own lifecycle
    // (open | complete | expired) — NOT a subscription status — and must never be run
    // through `statusMap`. Two real bugs came from conflating them (found 2026-07-31):
    //   * `checkout.session.expired` resolved to status null while still carrying our
    //     `metadata.tier`, and the route's `?? 'ACTIVE'` create-default then granted
    //     permanent paid entitlement for an ABANDONED, unpaid checkout.
    //   * `checkout.session.completed` never reached its intended 'ACTIVE' branch,
    //     because a session's `status` is always truthy, so a returning customer who
    //     paid stayed CANCELED (i.e. on free) unless a separate subscription event
    //     happened to arrive.
    // Entitlement is granted only on a completed session that Stripe says is actually
    // paid (or legitimately needs no payment, e.g. a 100%-off coupon or trial).
    const status: StripeEvent['status'] = isCheckoutSession
      ? evt.type === 'checkout.session.completed' &&
        (obj?.payment_status === 'paid' || obj?.payment_status === 'no_payment_required')
        ? 'ACTIVE'
        : null
      : obj?.status
        ? (statusMap[obj.status] ?? (isSubscriptionLifecycle ? 'CANCELED' : null))
        : null
    return {
      type: evt.type,
      orgId: obj?.metadata?.orgId ?? null,
      tier: tier === 'PRO' || tier === 'BASIC' ? tier : null,
      status,
      customerId,
      currentPeriodEnd,
    }
  }

  /** Create a Stripe customer-portal session; returns the URL to redirect the merchant to. */
  async createPortalSession(p: { customerId: string; returnUrl: string }): Promise<string> {
    const body = new URLSearchParams({ customer: p.customerId, return_url: p.returnUrl })
    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.cfg.secretKey}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    })
    if (!res.ok) throw new Error(`Stripe portal failed: ${res.status}`)
    const data = (await res.json()) as { url?: string }
    if (!data.url) throw new Error('Stripe returned no portal url')
    return data.url
  }
}

export class MockStripeClient implements StripeClient {
  createCheckoutSession(p: CheckoutParams): Promise<string> {
    return Promise.resolve(`${p.successUrl}?mock_checkout=1`)
  }
  parseWebhook(rawBody: string): StripeEvent | null {
    const evt = JSON.parse(rawBody) as {
      type: string
      orgId?: string
      tier?: StripeEvent['tier']
      status?: StripeEvent['status']
      customerId?: string
      currentPeriodEnd?: number
    }
    return {
      type: evt.type,
      orgId: evt.orgId ?? null,
      tier: evt.tier ?? null,
      status: evt.status ?? null,
      customerId: evt.customerId ?? null,
      currentPeriodEnd:
        typeof evt.currentPeriodEnd === 'number' ? new Date(evt.currentPeriodEnd * 1000) : null,
    }
  }
  createPortalSession(p: { customerId: string; returnUrl: string }): Promise<string> {
    return Promise.resolve(`${p.returnUrl}?mock_portal=1`)
  }
}

export function createStripeClient(env: NodeJS.ProcessEnv = process.env): StripeClient {
  const cfg = stripeConfig(env)
  return cfg.hasCredentials && cfg.secretKey
    ? new RealStripeClient({ secretKey: cfg.secretKey, webhookSecret: cfg.webhookSecret })
    : new MockStripeClient()
}

/** Grace window after a paid period ends before access is revoked (missed-webhook safety). */
export const BILLING_GRACE_DAYS = 7

/**
 * True when the paid period ended more than the grace window ago. A null periodEnd never
 * lapses: legacy rows and mock/dev flows have no period end and must keep current behavior.
 */
export function subscriptionLapsed(
  currentPeriodEnd: Date | null,
  nowMs = Date.now(),
  graceDays = BILLING_GRACE_DAYS,
): boolean {
  if (!currentPeriodEnd) return false
  return currentPeriodEnd.getTime() + graceDays * 86_400_000 < nowMs
}

/**
 * Stripe does not guarantee webhook delivery order (retries especially can arrive after a
 * newer event already landed). Returns the incoming period end only when it actually moves
 * the paid period forward — a stale/out-of-order event must never regress it, since
 * `subscriptionLapsed` would then wrongly revoke a paying customer's access. Returns null
 * (meaning "leave the stored value alone") when there's nothing to advance.
 */
export function resolvePeriodEndUpdate(existing: Date | null, incoming: Date | null): Date | null {
  if (!incoming) return null
  if (!existing || incoming.getTime() > existing.getTime()) return incoming
  return null
}
