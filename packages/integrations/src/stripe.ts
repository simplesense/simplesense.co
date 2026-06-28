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

/** Verify a Stripe webhook signature (scheme: `t=<ts>,v1=<hmac of "ts.body">`). */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
): boolean {
  if (!header) return false
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=')))
  const t = parts.t
  const v1 = parts.v1
  if (!t || !v1) return false
  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(v1)
  return a.length === b.length && timingSafeEqual(a, b)
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
    if (
      this.cfg.webhookSecret &&
      !verifyStripeSignature(rawBody, signature, this.cfg.webhookSecret)
    ) {
      return null
    }
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
