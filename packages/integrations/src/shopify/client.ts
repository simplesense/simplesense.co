import { normalizeShop } from './oauth'

const API_VERSION = '2024-10'

/** Typed Shopify client — real (fetch) + mock for tests. */
export interface ShopifyClient {
  /** Exchange an OAuth `code` for a permanent access token. */
  exchangeCodeForToken(shop: string, code: string): Promise<string>
  /** Register webhook subscriptions for the given topics. */
  registerWebhooks(
    shop: string,
    accessToken: string,
    topics: string[],
    callbackUrl: string,
  ): Promise<void>
}

export interface ShopifyClientConfig {
  apiKey: string
  apiSecret: string
}

export class RealShopifyClient implements ShopifyClient {
  constructor(private readonly cfg: ShopifyClientConfig) {}

  async exchangeCodeForToken(shop: string, code: string): Promise<string> {
    const res = await fetch(`https://${normalizeShop(shop)}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: this.cfg.apiKey, client_secret: this.cfg.apiSecret, code }),
    })
    if (!res.ok) throw new Error(`Shopify token exchange failed: ${res.status}`)
    const data = (await res.json()) as { access_token?: string }
    if (!data.access_token) throw new Error('Shopify token exchange returned no access_token')
    return data.access_token
  }

  async registerWebhooks(
    shop: string,
    accessToken: string,
    topics: string[],
    callbackUrl: string,
  ): Promise<void> {
    for (const topic of topics) {
      const res = await fetch(
        `https://${normalizeShop(shop)}/admin/api/${API_VERSION}/webhooks.json`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': accessToken },
          body: JSON.stringify({ webhook: { topic, address: callbackUrl, format: 'json' } }),
        },
      )
      // 422 = "already exists" (idempotent re-register), fine. Anything else is logged (topic +
      // status only, no token/PII) so a silently-unregistered webhook is observable.
      if (!res.ok && res.status !== 422) {
        console.error('[shopify] webhook registration failed topic=%s status=%s', topic, res.status)
      }
    }
  }
}

/** Deterministic mock used in tests and until live Shopify creds are supplied. */
export class MockShopifyClient implements ShopifyClient {
  public readonly registered: { shop: string; topic: string }[] = []
  exchangeCodeForToken(_shop: string, _code: string): Promise<string> {
    return Promise.resolve('mock_shpat_access_token')
  }
  registerWebhooks(
    shop: string,
    _accessToken: string,
    topics: string[],
    _callbackUrl: string,
  ): Promise<void> {
    for (const topic of topics) this.registered.push({ shop, topic })
    return Promise.resolve()
  }
}
