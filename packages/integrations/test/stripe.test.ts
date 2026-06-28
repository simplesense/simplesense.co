import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import { verifyStripeSignature, MockStripeClient, RealStripeClient } from '../src/stripe'

const SECRET = 'whsec_test'

describe('verifyStripeSignature', () => {
  it('accepts a correctly-signed payload and rejects tampering/missing', () => {
    const body = '{"type":"checkout.session.completed"}'
    const t = '1700000000'
    const v1 = createHmac('sha256', SECRET).update(`${t}.${body}`).digest('hex')
    expect(verifyStripeSignature(body, `t=${t},v1=${v1}`, SECRET)).toBe(true)
    expect(verifyStripeSignature(body, `t=${t},v1=deadbeef`, SECRET)).toBe(false)
    expect(verifyStripeSignature(body, null, SECRET)).toBe(false)
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
  it('extracts org/tier/status from metadata (sig skipped when no secret)', () => {
    const client = new RealStripeClient({ secretKey: 'sk', webhookSecret: null })
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { metadata: { orgId: 'org1', tier: 'PRO' }, status: 'active' } },
    })
    expect(client.parseWebhook(body, null)).toMatchObject({
      orgId: 'org1',
      tier: 'PRO',
      status: 'ACTIVE',
    })
  })

  it('rejects a bad signature when a webhook secret is set', () => {
    const client = new RealStripeClient({ secretKey: 'sk', webhookSecret: SECRET })
    expect(client.parseWebhook('{}', 'bad')).toBeNull()
  })
})
