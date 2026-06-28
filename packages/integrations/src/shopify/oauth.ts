import { createHmac, timingSafeEqual } from 'node:crypto'

/** Normalize a shop input to its `*.myshopify.com` domain (strip protocol/path). */
export function normalizeShop(shop: string): string {
  return shop
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
}

export function isValidShopDomain(shop: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalizeShop(shop))
}

export interface OAuthStartParams {
  shop: string
  apiKey: string
  scopes: string
  redirectUri: string
  /** Anti-CSRF nonce; echoed back on the callback and verified. */
  state: string
}

/** Build the Shopify OAuth authorize URL the merchant is redirected to. */
export function buildAuthorizeUrl(p: OAuthStartParams): string {
  const u = new URL(`https://${normalizeShop(p.shop)}/admin/oauth/authorize`)
  u.searchParams.set('client_id', p.apiKey)
  u.searchParams.set('scope', p.scopes)
  u.searchParams.set('redirect_uri', p.redirectUri)
  u.searchParams.set('state', p.state)
  return u.toString()
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/**
 * Verify the OAuth callback HMAC: hex HMAC-SHA256 over the query params (excluding `hmac`
 * and `signature`), keys sorted and joined `k=v&…`, using the app's API secret.
 */
export function validateCallbackHmac(query: Record<string, string>, apiSecret: string): boolean {
  const { hmac, signature: _signature, ...rest } = query
  if (!hmac) return false
  const message = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('&')
  const digest = createHmac('sha256', apiSecret).update(message).digest('hex')
  return safeEqualHex(digest, hmac)
}
