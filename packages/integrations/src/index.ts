import { shopifyConfig } from '@ss/config'
import type { ShopifyClient } from './shopify/client'
import { RealShopifyClient, MockShopifyClient } from './shopify/client'

export { encryptSecret, decryptSecret } from './crypto'
export {
  normalizeShop,
  isValidShopDomain,
  buildAuthorizeUrl,
  validateCallbackHmac,
  type OAuthStartParams,
} from './shopify/oauth'
export { verifyWebhookHmac } from './shopify/webhooks'
export {
  MockShopifyReader,
  RealShopifyReader,
  type ShopifyReader,
  type ShopInfo,
} from './shopify/reader'
export {
  RealStripeClient,
  MockStripeClient,
  createStripeClient,
  verifyStripeSignature,
  subscriptionLapsed,
  resolvePeriodEndUpdate,
  BILLING_GRACE_DAYS,
  type StripeClient,
  type StripeEvent,
  type CheckoutParams,
} from './stripe'
export {
  RealShopifyClient,
  MockShopifyClient,
  type ShopifyClient,
  type ShopifyClientConfig,
} from './shopify/client'
export {
  RealKlaviyoClient,
  MockKlaviyoClient,
  createKlaviyoClient,
  type KlaviyoClient,
  type KlaviyoClientConfig,
} from './klaviyo/client'
export { buildAgentReadySnapshot } from './agent-ready/build-snapshot'
export { buildReviewWidgetSnapshot } from './review-proof/build-review-widget-snapshot'
export {
  MockAnswerShelfBattery,
  type AnswerShelfBatteryClient,
  type AnswerShelfBatteryResult,
} from './answer-shelf/battery-client'

/** Topics we subscribe to on connect (MVP: keep orders fresh + handle disconnect). */
export const DEFAULT_WEBHOOK_TOPICS = ['orders/create', 'orders/updated', 'app/uninstalled']

/** Real client when Shopify creds are set; mock otherwise (Prime Directive #6 cost-aware). */
export function createShopifyClient(env: NodeJS.ProcessEnv = process.env): ShopifyClient {
  const cfg = shopifyConfig(env)
  if (cfg.hasCredentials) {
    return new RealShopifyClient({
      apiKey: cfg.apiKey as string,
      apiSecret: cfg.apiSecret as string,
    })
  }
  return new MockShopifyClient()
}
