import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import { verifyStripeSignature, MockStripeClient, RealStripeClient } from '../src/stripe'

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
})
