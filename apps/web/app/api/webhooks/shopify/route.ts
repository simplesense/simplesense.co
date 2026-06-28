import { NextResponse } from 'next/server'
import { shopifyConfig } from '@ss/config'
import { verifyWebhookHmac } from '@ss/integrations'

/**
 * Inbound Shopify webhooks. Verify the HMAC over the RAW body before doing anything;
 * never log PII (topic + shop domain only). The per-topic sync is enqueued in Slice 3.
 */
export async function POST(req: Request): Promise<Response> {
  const cfg = shopifyConfig()
  if (!cfg.apiSecret) return new NextResponse('not configured', { status: 503 })

  const raw = await req.text()
  const hmac = req.headers.get('x-shopify-hmac-sha256')
  if (!verifyWebhookHmac(raw, hmac, cfg.apiSecret)) {
    return new NextResponse('unauthorized', { status: 401 })
  }

  const topic = req.headers.get('x-shopify-topic') ?? 'unknown'
  const shop = req.headers.get('x-shopify-shop-domain') ?? 'unknown'
  console.log('[webhook] topic=%s shop=%s', topic, shop) // PII-free
  // TODO(Slice 3): enqueue the durable sync job for this topic/shop.
  return NextResponse.json({ ok: true })
}
