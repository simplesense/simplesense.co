import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  buildAuthorizeUrl,
  isValidShopDomain,
  validateCallbackHmac,
  normalizeShop,
} from '../src/shopify/oauth'
import { verifyWebhookHmac } from '../src/shopify/webhooks'
import { MockShopifyClient } from '../src/shopify/client'

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
    expect(await c.exchangeCodeForToken('wildflower.myshopify.com', 'code')).toMatch(/mock/)
    await c.registerWebhooks(
      'wildflower.myshopify.com',
      'tok',
      ['orders/create', 'app/uninstalled'],
      'https://cb',
    )
    expect(c.registered.map((r) => r.topic)).toEqual(['orders/create', 'app/uninstalled'])
  })
})
