import { normalizeShop } from './oauth'

const API_VERSION = '2024-10'

/** Typed Shopify client — real (fetch) + mock for tests. */
export interface ShopifyClient {
  /**
   * Exchange an OAuth `code` for a permanent access token. `scope` is the comma-separated
   * list Shopify reports as actually GRANTED — persisted per store so honesty labeling
   * (historyLimited) reflects reality, not what the deployment requested.
   */
  exchangeCodeForToken(shop: string, code: string): Promise<{ token: string; scope: string }>
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

  async exchangeCodeForToken(
    shop: string,
    code: string,
  ): Promise<{ token: string; scope: string }> {
    const res = await fetch(`https://${normalizeShop(shop)}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: this.cfg.apiKey, client_secret: this.cfg.apiSecret, code }),
    })
    if (!res.ok) throw new Error(`Shopify token exchange failed: ${res.status}`)
    const data = (await res.json()) as { access_token?: string; scope?: string }
    if (!data.access_token) throw new Error('Shopify token exchange returned no access_token')
    return { token: data.access_token, scope: data.scope ?? '' }
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
  exchangeCodeForToken(_shop: string, _code: string): Promise<{ token: string; scope: string }> {
    // Mock scope MUST NOT include read_all_orders: the mock serves all local dev, and claiming
    // that grant would silently drop the partial-history notice (the exact grounding bug this
    // tracking exists to prevent). Mirrors the default requested scopes in env.ts.
    return Promise.resolve({
      token: 'mock_shpat_access_token',
      scope: 'read_orders,read_customers,read_products,read_locations,read_inventory',
    })
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
