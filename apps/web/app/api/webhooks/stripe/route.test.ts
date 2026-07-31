import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StripeEvent } from '@ss/integrations'

const upsert = vi.fn()
let parsed: StripeEvent | null = null

vi.mock('@ss/config', () => ({
  stripeConfig: () => ({ hasCredentials: true, webhookSecret: 'whsec_test' }),
}))
vi.mock('@ss/integrations', () => ({
  createStripeClient: () => ({ parseWebhook: () => parsed }),
  resolvePeriodEndUpdate: (_existing: Date | null, next: Date | null) => next,
}))
vi.mock('@ss/db', () => ({
  DEMO: { orgId: 'demo_org' },
  prisma: { subscription: { findUnique: async () => existing, upsert } },
}))

let existing: { currentPeriodEnd: Date | null } | null = null
const { POST } = await import('./route')

const evt = (over: Partial<StripeEvent>): StripeEvent =>
  ({
    type: 'customer.subscription.updated',
    orgId: 'org_1',
    tier: null,
    status: null,
    customerId: null,
    currentPeriodEnd: null,
    ...over,
  }) as StripeEvent

const post = () =>
  POST(new Request('http://localhost:3000/api/webhooks/stripe', { method: 'POST', body: '{}' }))

beforeEach(() => {
  upsert.mockReset()
  existing = null
  parsed = null
})

describe('POST /api/webhooks/stripe — entitlement can only be granted by a real payment', () => {
  it('grants NOTHING for an abandoned checkout.session.expired that still carries our metadata.tier (regression: this granted permanent free Pro, 2026-07-31)', async () => {
    parsed = evt({ type: 'checkout.session.expired', tier: 'PRO', status: null })
    const res = await post()
    expect(res.status).toBe(200) // acknowledged so Stripe stops retrying
    expect(upsert).not.toHaveBeenCalled()
  })

  it('ignores unrelated event types entirely', async () => {
    parsed = evt({ type: 'invoice.payment_succeeded', tier: 'PRO', status: 'ACTIVE' })
    await post()
    expect(upsert).not.toHaveBeenCalled()
  })

  it('refuses to CREATE a subscription row when no status could be resolved — never defaults to ACTIVE', async () => {
    existing = null
    parsed = evt({ type: 'checkout.session.completed', tier: 'PRO', status: null })
    await post()
    expect(upsert).not.toHaveBeenCalled()
  })

  it('creates an ACTIVE row for a genuinely completed+paid checkout', async () => {
    parsed = evt({ type: 'checkout.session.completed', tier: 'PRO', status: 'ACTIVE' })
    await post()
    expect(upsert).toHaveBeenCalledTimes(1)
    expect(upsert.mock.calls[0]![0].create).toMatchObject({ tier: 'PRO', status: 'ACTIVE' })
  })

  it('still processes subscription lifecycle events (cancellation must downgrade)', async () => {
    existing = { currentPeriodEnd: null }
    parsed = evt({ type: 'customer.subscription.deleted', status: 'CANCELED' })
    await post()
    expect(upsert).toHaveBeenCalledTimes(1)
    expect(upsert.mock.calls[0]![0].update).toMatchObject({ status: 'CANCELED' })
  })

  it('never writes entitlement for the shared demo org', async () => {
    parsed = evt({ type: 'checkout.session.completed', orgId: 'demo_org', status: 'ACTIVE' })
    await post()
    expect(upsert).not.toHaveBeenCalled()
  })
})
