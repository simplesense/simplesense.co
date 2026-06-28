import { NextResponse } from 'next/server'
import { shopifyConfig } from '@ss/config'
import { verifyWebhookHmac } from '@ss/integrations'
import { rateLimit } from '@/lib/security'

/**
 * Inbound Shopify webhooks. Rate-limit per shop, verify the HMAC over the RAW body before
 * doing anything; never log PII (topic + shop domain only). Per-topic sync = Slice 3 job.
 */
export async function POST(req: Request): Promise<Response> {
  const cfg = shopifyConfig()
  if (!cfg.apiSecret) return new NextResponse('not configured', { status: 503 })

  const shop = req.headers.get('x-shopify-shop-domain') ?? 'unknown'
  if (!rateLimit(`webhook:${shop}`, 120, 60_000).allowed) {
    return new NextResponse('rate limited', { status: 429 })
  }

  const raw = await req.text()
  const hmac = req.headers.get('x-shopify-hmac-sha256')
  if (!verifyWebhookHmac(raw, hmac, cfg.apiSecret)) {
    return new NextResponse('unauthorized', { status: 401 })
  }

  const topic = req.headers.get('x-shopify-topic') ?? 'unknown'
  console.log('[webhook] topic=%s shop=%s', topic, shop) // PII-free
  // TODO(Slice 3): enqueue the durable sync job for this topic/shop.
  return NextResponse.json({ ok: true })
}
