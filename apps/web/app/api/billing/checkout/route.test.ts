import { describe, it, expect, vi, beforeEach } from 'vitest'

const createCheckoutSession = vi.fn()
const createPortalSession = vi.fn()

/** Mutable per-test state — avoids vi.resetModules(), which drops the hoisted mocks. */
const state: {
  orgId: string
  subscription: { status: string; stripeCustomerId: string | null } | null
} = { orgId: 'org_real', subscription: null }

vi.mock('@ss/config', () => ({ stripeConfig: () => ({ hasCredentials: true }) }))
vi.mock('@ss/integrations', () => ({
  createStripeClient: () => ({ createCheckoutSession, createPortalSession }),
}))
vi.mock('@ss/db', () => ({
  DEMO: { orgId: 'demo_org' },
  prisma: { subscription: { findUnique: async () => state.subscription } },
}))
vi.mock('@/lib/auth', () => ({ getSession: async () => ({ orgId: state.orgId }) }))
vi.mock('@/lib/billing', () => ({ priceIdForTier: () => 'price_test' }))
vi.mock('@/lib/security', () => ({
  rateLimit: () => ({ allowed: true }),
  redactSecrets: (s: string) => s,
}))

const { POST } = await import('./route')

function postTier(tier: string): Request {
  const form = new FormData()
  form.set('tier', tier)
  return new Request('http://localhost:3000/api/billing/checkout', { method: 'POST', body: form })
}

beforeEach(() => {
  createCheckoutSession.mockReset()
  createPortalSession.mockReset()
  state.orgId = 'org_real'
  state.subscription = null
})

describe('POST /api/billing/checkout', () => {
  it('redirects to the Stripe-provided checkout url on success', async () => {
    createCheckoutSession.mockResolvedValue('https://checkout.stripe.com/c/pay/cs_test_123')
    const res = await POST(postTier('basic'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('https://checkout.stripe.com/c/pay/cs_test_123')
  })

  it('redirects back to /plans?failed=1 when Stripe throws, instead of surfacing a raw 500 (regression: a Stripe failure dead-ended the merchant on a browser error page, 2026-07-31)', async () => {
    createCheckoutSession.mockRejectedValue(
      new Error('Stripe checkout failed: 400 — No such price'),
    )
    const res = await POST(postTier('basic'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('http://localhost:3000/plans?failed=1')
  })

  it('never leaks the provider error message to the client — it can name internal price/account ids', async () => {
    createCheckoutSession.mockRejectedValue(
      new Error('Stripe checkout failed: 400 — No such price: price_secret_internal_id'),
    )
    const res = await POST(postTier('basic'))
    expect(res.headers.get('location') ?? '').not.toContain('price_secret_internal_id')
    expect(await res.text()).not.toContain('price_secret_internal_id')
  })

  it('rejects an unknown tier before ever calling Stripe', async () => {
    const res = await POST(postTier('enterprise'))
    expect(res.status).toBe(400)
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it('never starts a real Stripe checkout for the shared demo org, and explains why instead of returning raw JSON', async () => {
    state.orgId = 'demo_org'
    const res = await POST(postTier('basic'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('http://localhost:3000/plans?demo=1')
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })
})

describe('POST /api/billing/checkout — an existing subscriber must never be double-billed', () => {
  // Regression (2026-07-31): a Basic customer clicking "Upgrade to Pro" opened a SECOND
  // subscription under a SECOND Stripe customer id — billed for both, with the original
  // charge invisible and uncancellable from inside the product.
  it('sends an ACTIVE subscriber to the billing portal instead of opening a second subscription', async () => {
    state.subscription = { status: 'ACTIVE', stripeCustomerId: 'cus_existing' }
    createPortalSession.mockResolvedValue('https://billing.stripe.com/p/session_1')
    const res = await POST(postTier('pro'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('https://billing.stripe.com/p/session_1')
    expect(createCheckoutSession).not.toHaveBeenCalled()
    expect(createPortalSession).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cus_existing' }),
    )
  })

  it('treats PAST_DUE the same way — still an open subscription, still must not be duplicated', async () => {
    state.subscription = { status: 'PAST_DUE', stripeCustomerId: 'cus_existing' }
    createPortalSession.mockResolvedValue('https://billing.stripe.com/p/session_2')
    await POST(postTier('pro'))
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it('refuses to charge — rather than risking a duplicate — when subscribed but no customer id was ever captured', async () => {
    state.subscription = { status: 'ACTIVE', stripeCustomerId: null }
    const res = await POST(postTier('pro'))
    expect(res.headers.get('location')).toBe('http://localhost:3000/plans?manage=1')
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it('still opens Checkout for a CANCELED subscriber re-subscribing', async () => {
    state.subscription = { status: 'CANCELED', stripeCustomerId: 'cus_old' }
    createCheckoutSession.mockResolvedValue('https://checkout.stripe.com/c/pay/cs_new')
    const res = await POST(postTier('basic'))
    expect(res.headers.get('location')).toBe('https://checkout.stripe.com/c/pay/cs_new')
    expect(createCheckoutSession).toHaveBeenCalled()
  })
})
