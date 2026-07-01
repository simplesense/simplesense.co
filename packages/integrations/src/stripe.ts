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
}

export interface StripeClient {
  createCheckoutSession(p: CheckoutParams): Promise<string>
  /** Verify the Stripe-Signature header over the raw body, then parse to our event shape. */
  parseWebhook(rawBody: string, signature: string | null): StripeEvent | null
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
    if (!res.ok) throw new Error(`Stripe checkout failed: ${res.status}`)
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
      data?: { object?: { metadata?: { orgId?: string; tier?: string }; status?: string } }
    }
    const obj = evt.data?.object
    const statusMap: Record<string, StripeEvent['status']> = {
      active: 'ACTIVE',
      trialing: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
    }
    const tier = obj?.metadata?.tier
    return {
      type: evt.type,
      orgId: obj?.metadata?.orgId ?? null,
      tier: tier === 'PRO' || tier === 'BASIC' ? tier : null,
      status: obj?.status
        ? (statusMap[obj.status] ?? null)
        : evt.type === 'checkout.session.completed'
          ? 'ACTIVE'
          : null,
    }
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
    }
    return {
      type: evt.type,
      orgId: evt.orgId ?? null,
      tier: evt.tier ?? null,
      status: evt.status ?? null,
    }
  }
}

export function createStripeClient(env: NodeJS.ProcessEnv = process.env): StripeClient {
  const cfg = stripeConfig(env)
  return cfg.hasCredentials && cfg.secretKey
    ? new RealStripeClient({ secretKey: cfg.secretKey, webhookSecret: cfg.webhookSecret })
    : new MockStripeClient()
}
