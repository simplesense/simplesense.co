import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  verifyStripeSignature,
  MockStripeClient,
  RealStripeClient,
  subscriptionLapsed,
  resolvePeriodEndUpdate,
} from '../src/stripe'

const SECRET = 'whsec_test'
const sign = (t: string, body: string, secret = SECRET): string =>
  createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')

describe('verifyStripeSignature', () => {
  it('accepts a correctly-signed, in-window payload and rejects tampering/missing', () => {
    const body = '{"type":"checkout.session.completed"}'
    const t = '1700000000'
    const now = Number(t) * 1000
    expect(verifyStripeSignature(body, `t=${t},v1=${sign(t, body)}`, SECRET, now)).toBe(true)
    expect(verifyStripeSignature(body, `t=${t},v1=deadbeef`, SECRET, now)).toBe(false)
    expect(verifyStripeSignature(body, null, SECRET, now)).toBe(false)
  })

  it('REJECTS a replayed payload outside the 5-minute tolerance window', () => {
    const body = '{"type":"x"}'
    const t = '1700000000'
    const header = `t=${t},v1=${sign(t, body)}`
    // signature is valid, but the timestamp is ~10 minutes in the past → replay → reject
    expect(verifyStripeSignature(body, header, SECRET, Number(t) * 1000 + 600_000)).toBe(false)
  })

  it('accepts if ANY v1 matches (multiple signatures during secret rotation)', () => {
    const body = '{"type":"x"}'
    const t = '1700000000'
    const now = Number(t) * 1000
    const header = `t=${t},v1=${sign(t, body, 'whsec_old')},v1=${sign(t, body)}`
    expect(verifyStripeSignature(body, header, SECRET, now)).toBe(true)
  })
})

describe('MockStripeClient', () => {
  it('returns a checkout url and parses events', async () => {
    const c = new MockStripeClient()
    const url = await c.createCheckoutSession({
      priceId: 'price_x',
      orgId: 'org1',
      tier: 'PRO',
      successUrl: 'https://app/plans',
      cancelUrl: 'https://app/plans',
    })
    expect(url).toContain('mock_checkout')
    const evt = c.parseWebhook(
      JSON.stringify({
        type: 'checkout.session.completed',
        orgId: 'org1',
        tier: 'PRO',
        status: 'ACTIVE',
      }),
    )
    expect(evt).toMatchObject({ orgId: 'org1', tier: 'PRO', status: 'ACTIVE' })
  })

  it('passes through customerId/currentPeriodEnd (unix seconds → Date) and nulls when absent', () => {
    const c = new MockStripeClient()
    const withFields = c.parseWebhook(
      JSON.stringify({
        type: 'customer.subscription.updated',
        orgId: 'org1',
        customerId: 'cus_123',
        currentPeriodEnd: 1700003600,
      }),
    )
    expect(withFields?.customerId).toBe('cus_123')
    expect(withFields?.currentPeriodEnd?.getTime()).toBe(1700003600 * 1000)

    const withoutFields = c.parseWebhook(JSON.stringify({ type: 'checkout.session.completed' }))
    expect(withoutFields?.customerId).toBeNull()
    expect(withoutFields?.currentPeriodEnd).toBeNull()
  })

  it('createPortalSession resolves to a url containing mock_portal=1', async () => {
    const c = new MockStripeClient()
    const url = await c.createPortalSession({
      customerId: 'cus_123',
      returnUrl: 'https://app/plans',
    })
    expect(url).toContain('mock_portal=1')
  })
})

describe('RealStripeClient.parseWebhook', () => {
  it('FAILS CLOSED when no webhook secret is configured (cannot authenticate the payload)', () => {
    const client = new RealStripeClient({ secretKey: 'sk', webhookSecret: null })
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { metadata: { orgId: 'org1', tier: 'PRO' }, status: 'active' } },
    })
    expect(client.parseWebhook(body, 'anything')).toBeNull()
  })

  it('rejects a bad signature when a webhook secret is set', () => {
    const client = new RealStripeClient({ secretKey: 'sk', webhookSecret: SECRET })
    expect(client.parseWebhook('{}', 'bad')).toBeNull()
  })

  it('fails closed on revocation-shaped subscription statuses (unpaid/paused/unknown)', () => {
    const client = new RealStripeClient({ secretKey: 'sk', webhookSecret: SECRET })
    const now = Date.now()
    const parse = (status: string) => {
      const body = JSON.stringify({
        type: 'customer.subscription.updated',
        data: { object: { metadata: { orgId: 'org1', tier: 'PRO' }, status } },
      })
      const t = String(Math.floor(now / 1000))
      return client.parseWebhook(body, `t=${t},v1=${sign(t, body)}`)
    }
    expect(parse('unpaid')?.status).toBe('CANCELED') // dunning gave up → revoke
    expect(parse('incomplete_expired')?.status).toBe('CANCELED')
    expect(parse('paused')?.status).toBe('PAST_DUE')
    expect(parse('some_future_status')?.status).toBe('CANCELED') // unknown → fail closed
    expect(parse('active')?.status).toBe('ACTIVE')
  })

  it('captures customer id + current_period_end from a signed customer.subscription.updated body', () => {
    const client = new RealStripeClient({ secretKey: 'sk', webhookSecret: SECRET })
    const now = Date.now()
    const body = JSON.stringify({
      type: 'customer.subscription.updated',
      data: {
        object: {
          metadata: { orgId: 'org1', tier: 'PRO' },
          status: 'active',
          customer: 'cus_123',
          current_period_end: 1700003600,
        },
      },
    })
    const t = String(Math.floor(now / 1000))
    const evt = client.parseWebhook(body, `t=${t},v1=${sign(t, body)}`)
    expect(evt?.customerId).toBe('cus_123')
    expect(evt?.currentPeriodEnd?.getTime()).toBe(1700003600 * 1000)
  })

  it('captures customer id on checkout.session.completed with no current_period_end (existing ACTIVE default preserved)', () => {
    const client = new RealStripeClient({ secretKey: 'sk', webhookSecret: SECRET })
    const now = Date.now()
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { metadata: { orgId: 'org1', tier: 'PRO' }, customer: 'cus_123' } },
    })
    const t = String(Math.floor(now / 1000))
    const evt = client.parseWebhook(body, `t=${t},v1=${sign(t, body)}`)
    expect(evt?.customerId).toBe('cus_123')
    expect(evt?.currentPeriodEnd).toBeNull()
    expect(evt?.status).toBe('ACTIVE')
  })

  it('falls back to items.data[0].current_period_end (Stripe Basil API shape)', () => {
    const client = new RealStripeClient({ secretKey: 'sk', webhookSecret: SECRET })
    const now = Date.now()
    const body = JSON.stringify({
      type: 'customer.subscription.updated',
      data: {
        object: {
          metadata: { orgId: 'org1', tier: 'PRO' },
          status: 'active',
          items: { data: [{ current_period_end: 1700003600 }] },
        },
      },
    })
    const t = String(Math.floor(now / 1000))
    const evt = client.parseWebhook(body, `t=${t},v1=${sign(t, body)}`)
    expect(evt?.currentPeriodEnd?.getTime()).toBe(1700003600 * 1000)
  })

  it('ignores an expanded customer object — only a plain string id is trusted', () => {
    const client = new RealStripeClient({ secretKey: 'sk', webhookSecret: SECRET })
    const now = Date.now()
    const body = JSON.stringify({
      type: 'customer.subscription.updated',
      data: {
        object: {
          metadata: { orgId: 'org1', tier: 'PRO' },
          status: 'active',
          customer: { id: 'cus_123' },
        },
      },
    })
    const t = String(Math.floor(now / 1000))
    const evt = client.parseWebhook(body, `t=${t},v1=${sign(t, body)}`)
    expect(evt?.customerId).toBeNull()
  })

  it('treats a non-numeric or negative current_period_end as absent', () => {
    const client = new RealStripeClient({ secretKey: 'sk', webhookSecret: SECRET })
    const now = Date.now()
    const t = String(Math.floor(now / 1000))
    const parse = (current_period_end: unknown) => {
      const body = JSON.stringify({
        type: 'customer.subscription.updated',
        data: {
          object: {
            metadata: { orgId: 'org1', tier: 'PRO' },
            status: 'active',
            current_period_end,
          },
        },
      })
      return client.parseWebhook(body, `t=${t},v1=${sign(t, body)}`)
    }
    expect(parse('soon')?.currentPeriodEnd).toBeNull()
    expect(parse(-1)?.currentPeriodEnd).toBeNull()
    // Type-valid (finite, positive) but out of Date's representable range → would otherwise
    // become an Invalid Date, which subscriptionLapsed would silently treat as "never lapses".
    expect(parse(9_000_000_000_000)?.currentPeriodEnd).toBeNull()
  })
})

describe('subscriptionLapsed', () => {
  const DAY_MS = 86_400_000
  const NOW = Date.now()

  it('a null period end never lapses (legacy rows / mock/dev flows)', () => {
    expect(subscriptionLapsed(null, NOW)).toBe(false)
  })

  it('does not lapse within the 7-day grace window', () => {
    expect(subscriptionLapsed(new Date(NOW - 6 * DAY_MS), NOW)).toBe(false)
  })

  it('lapses once the period has been over for more than the grace window', () => {
    expect(subscriptionLapsed(new Date(NOW - 8 * DAY_MS), NOW)).toBe(true)
  })

  it('does not lapse exactly at the boundary (strict less-than)', () => {
    expect(subscriptionLapsed(new Date(NOW - 7 * DAY_MS), NOW)).toBe(false)
  })
})

describe('resolvePeriodEndUpdate', () => {
  const DAY_MS = 86_400_000
  const NOW = Date.now()

  it('adopts the incoming value when nothing is stored yet', () => {
    const incoming = new Date(NOW)
    expect(resolvePeriodEndUpdate(null, incoming)).toBe(incoming)
  })

  it('adopts the incoming value when it moves the period forward (renewal)', () => {
    const existing = new Date(NOW)
    const incoming = new Date(NOW + 30 * DAY_MS)
    expect(resolvePeriodEndUpdate(existing, incoming)).toBe(incoming)
  })

  it('rejects a stale/out-of-order incoming value that would regress the stored period end', () => {
    const existing = new Date(NOW + 30 * DAY_MS)
    const incoming = new Date(NOW) // an older, since-superseded event
    expect(resolvePeriodEndUpdate(existing, incoming)).toBeNull()
  })

  it('rejects an incoming value equal to the stored one (no-op, not an update)', () => {
    const existing = new Date(NOW)
    expect(resolvePeriodEndUpdate(existing, new Date(NOW))).toBeNull()
  })

  it('returns null (leave the stored value alone) when the incoming value is null', () => {
    expect(resolvePeriodEndUpdate(new Date(NOW), null)).toBeNull()
    expect(resolvePeriodEndUpdate(null, null)).toBeNull()
  })
})
