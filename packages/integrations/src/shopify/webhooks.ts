import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verify an inbound Shopify webhook: base64 HMAC-SHA256 of the RAW request body using the
 * app's API secret, compared against the `X-Shopify-Hmac-Sha256` header (constant-time).
 * The raw body (not re-serialized JSON) must be used.
 */
export function verifyWebhookHmac(
  rawBody: string,
  hmacHeader: string | null,
  apiSecret: string,
): boolean {
  if (!hmacHeader) return false
  const digest = createHmac('sha256', apiSecret).update(rawBody, 'utf8').digest('base64')
  const a = Buffer.from(digest)
  const b = Buffer.from(hmacHeader)
  return a.length === b.length && timingSafeEqual(a, b)
}
