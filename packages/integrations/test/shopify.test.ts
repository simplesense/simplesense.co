import { describe, it, expect, vi, afterEach } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  buildAuthorizeUrl,
  isValidShopDomain,
  validateCallbackHmac,
  normalizeShop,
} from '../src/shopify/oauth'
import { verifyWebhookHmac } from '../src/shopify/webhooks'
import { MockShopifyClient, RealShopifyClient } from '../src/shopify/client'
import { RealShopifyReader } from '../src/shopify/reader'

const SECRET = 'test_api_secret'

describe('shopify oauth', () => {
  it('builds an authorize URL with all params', () => {
    const url = new URL(
      buildAuthorizeUrl({
        shop: 'wildflower.myshopify.com',
        apiKey: 'key123',
        scopes: 'read_orders,read_products',
        redirectUri: 'https://app.example/api/stores/connect/callback',
        state: 'nonce42',
      }),
    )
    expect(url.host).toBe('wildflower.myshopify.com')
    expect(url.pathname).toBe('/admin/oauth/authorize')
    expect(url.searchParams.get('client_id')).toBe('key123')
    expect(url.searchParams.get('scope')).toBe('read_orders,read_products')
    expect(url.searchParams.get('state')).toBe('nonce42')
  })

  it('validates/normalizes shop domains (only *.myshopify.com)', () => {
    expect(isValidShopDomain('wildflower.myshopify.com')).toBe(true)
    expect(isValidShopDomain('https://wildflower.myshopify.com/admin')).toBe(true)
    expect(isValidShopDomain('evil.com')).toBe(false)
    expect(normalizeShop('HTTPS://Foo.myshopify.com/x')).toBe('foo.myshopify.com')
  })

  it('accepts a correctly-signed callback HMAC and rejects tampering', () => {
    const params: Record<string, string> = {
      code: 'abc',
      shop: 'wildflower.myshopify.com',
      state: 'nonce42',
      timestamp: '1700000000',
    }
    const message = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&')
    const hmac = createHmac('sha256', SECRET).update(message).digest('hex')

    expect(validateCallbackHmac({ ...params, hmac }, SECRET)).toBe(true)
    expect(validateCallbackHmac({ ...params, code: 'tampered', hmac }, SECRET)).toBe(false)
    expect(validateCallbackHmac({ ...params }, SECRET)).toBe(false) // missing hmac
  })
})

describe('shopify webhook verification', () => {
  it('accepts a correct body HMAC and rejects wrong/missing', () => {
    const body = JSON.stringify({ id: 1, total_price: '10.00' })
    const header = createHmac('sha256', SECRET).update(body, 'utf8').digest('base64')
    expect(verifyWebhookHmac(body, header, SECRET)).toBe(true)
    expect(verifyWebhookHmac(body, 'wrong', SECRET)).toBe(false)
    expect(verifyWebhookHmac(body, null, SECRET)).toBe(false)
  })
})

describe('mock shopify client', () => {
  it('exchanges a token and records webhook registrations', async () => {
    const c = new MockShopifyClient()
    expect((await c.exchangeCodeForToken('wildflower.myshopify.com', 'code')).token).toMatch(/mock/)
    await c.registerWebhooks(
      'wildflower.myshopify.com',
      'tok',
      ['orders/create', 'app/uninstalled'],
      'https://cb',
    )
    expect(c.registered.map((r) => r.topic)).toEqual(['orders/create', 'app/uninstalled'])
  })
})

describe('RealShopifyClient token exchange', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('returns the token AND the granted scope list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ access_token: 'shpat_x', scope: 'read_orders,read_all_orders' }),
      }),
    )
    const c = new RealShopifyClient({ apiKey: 'k', apiSecret: 's' })
    expect(await c.exchangeCodeForToken('wildflower.myshopify.com', 'code')).toEqual({
      token: 'shpat_x',
      scope: 'read_orders,read_all_orders',
    })
  })
  it('defaults scope to empty string when the response omits it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'shpat_x' }),
      }),
    )
    const c = new RealShopifyClient({ apiKey: 'k', apiSecret: 's' })
    expect((await c.exchangeCodeForToken('s.myshopify.com', 'code')).scope).toBe('')
  })
})

const gqlOk = (data: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: () => null },
  json: () => Promise.resolve({ data }),
  text: () => Promise.resolve(''),
})

describe('RealShopifyReader live mapping', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('maps GROSS totalPriceSet to totalPrice with refunds separate (no double-count)', async () => {
    const page = gqlOk({
      orders: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [
          {
            id: 'gid://shopify/Order/1',
            createdAt: '2026-01-01T00:00:00Z',
            totalPriceSet: { shopMoney: { amount: '100.00', currencyCode: 'USD' } },
            totalDiscountsSet: { shopMoney: { amount: '0' } },
            totalRefundedSet: { shopMoney: { amount: '30.00' } },
            customer: { id: 'gid://shopify/Customer/9' },
            shippingAddress: {
              city: 'Austin',
              provinceCode: 'TX',
              countryCodeV2: 'US',
              zip: '78701',
              latitude: 30.2,
              longitude: -97.7,
            },
            lineItems: {
              nodes: [
                {
                  quantity: 2,
                  product: { id: 'gid://shopify/Product/5' },
                  originalUnitPriceSet: { shopMoney: { amount: '50' } },
                  discountedUnitPriceSet: { shopMoney: { amount: '45' } },
                },
              ],
            },
          },
        ],
      },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(page))

    const reader = new RealShopifyReader()
    const orders = []
    for await (const p of reader.orders('shop.myshopify.com', 'tok')) orders.push(...p)

    expect(orders).toHaveLength(1)
    const o = orders[0]!
    expect(o.totalPrice).toBe(100) // gross — NOT currentTotalPriceSet (net of returns)
    expect(o.refundedAmount).toBe(30)
    expect(o.totalPrice - (o.refundedAmount ?? 0)).toBe(70) // netRevenue contract holds
    expect(o.currency).toBe('USD')
    expect(o.customerId).toBe('gid://shopify/Customer/9')
    expect(o.shippingAddress?.region).toBe('TX')
    expect(o.lineItems[0]).toMatchObject({ quantity: 2, price: 50, discount: 10 }) // (50−45)*2
  })

  it('retries on a THROTTLED GraphQL error then succeeds', async () => {
    vi.useFakeTimers()
    const throttled = {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve({ errors: [{ extensions: { code: 'THROTTLED' } }] }),
      text: () => Promise.resolve(''),
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(throttled)
      .mockResolvedValueOnce(
        gqlOk({ orders: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const reader = new RealShopifyReader()
    const run = (async () => {
      const out = []
      for await (const p of reader.orders('s.myshopify.com', 'tok')) out.push(...p)
      return out
    })()
    await vi.runAllTimersAsync()
    const out = await run

    expect(out).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('paginates line items past 20 via per-order nested fetch', async () => {
    const twentyItems = Array.from({ length: 20 }, () => ({
      quantity: 1,
      product: { id: 'gid://shopify/Product/1' },
      originalUnitPriceSet: { shopMoney: { amount: '10' } },
      discountedUnitPriceSet: { shopMoney: { amount: '10' } },
    }))
    const fiveMoreItems = Array.from({ length: 5 }, () => ({
      quantity: 1,
      product: { id: 'gid://shopify/Product/2' },
      originalUnitPriceSet: { shopMoney: { amount: '8' } },
      discountedUnitPriceSet: { shopMoney: { amount: '8' } },
    }))
    const ordersPage = gqlOk({
      orders: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [
          {
            id: 'gid://shopify/Order/1',
            createdAt: '2026-01-01T00:00:00Z',
            totalPriceSet: { shopMoney: { amount: '250.00', currencyCode: 'USD' } },
            totalDiscountsSet: { shopMoney: { amount: '0' } },
            totalRefundedSet: { shopMoney: { amount: '0' } },
            customer: { id: 'gid://shopify/Customer/9' },
            shippingAddress: null,
            lineItems: {
              pageInfo: { hasNextPage: true, endCursor: 'li20' },
              nodes: twentyItems,
            },
          },
        ],
      },
    })
    const lineItemsPage = {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: () =>
        Promise.resolve({
          data: {
            order: {
              lineItems: {
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: fiveMoreItems,
              },
            },
          },
        }),
      text: () => Promise.resolve(''),
    }
    const fetchMock = vi.fn().mockResolvedValueOnce(ordersPage).mockResolvedValueOnce(lineItemsPage)
    vi.stubGlobal('fetch', fetchMock)

    const reader = new RealShopifyReader()
    const orders = []
    for await (const p of reader.orders('shop.myshopify.com', 'tok')) orders.push(...p)

    expect(orders).toHaveLength(1)
    expect(orders[0]!.lineItems).toHaveLength(25)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const secondCallBody = JSON.parse(fetchMock.mock.calls[1]![1].body as string) as {
      variables: { id: string; cursor: string }
    }
    expect(secondCallBody.variables).toEqual({ id: 'gid://shopify/Order/1', cursor: 'li20' })
  })

  it('does not fetch extra pages for an order with <=20 line items', async () => {
    const page = gqlOk({
      orders: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [
          {
            id: 'gid://shopify/Order/2',
            createdAt: '2026-01-01T00:00:00Z',
            totalPriceSet: { shopMoney: { amount: '30.00', currencyCode: 'USD' } },
            totalDiscountsSet: { shopMoney: { amount: '0' } },
            totalRefundedSet: { shopMoney: { amount: '0' } },
            customer: null,
            shippingAddress: null,
            lineItems: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [
                {
                  quantity: 3,
                  product: { id: 'gid://shopify/Product/1' },
                  originalUnitPriceSet: { shopMoney: { amount: '10' } },
                  discountedUnitPriceSet: { shopMoney: { amount: '10' } },
                },
              ],
            },
          },
        ],
      },
    })
    const fetchMock = vi.fn().mockResolvedValueOnce(page)
    vi.stubGlobal('fetch', fetchMock)

    const reader = new RealShopifyReader()
    const orders = []
    for await (const p of reader.orders('shop.myshopify.com', 'tok')) orders.push(...p)

    expect(orders).toHaveLength(1)
    expect(orders[0]!.lineItems).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
