import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { shopifyConfig } from '@ss/config'
import {
  validateCallbackHmac,
  createShopifyClient,
  encryptSecret,
  normalizeShop,
  isValidShopDomain,
  DEFAULT_WEBHOOK_TOPICS,
} from '@ss/integrations'
import { prisma } from '@ss/db'
import { getSession } from '@/lib/auth'

/**
 * Shopify OAuth callback: verify HMAC + state, exchange the code for a token, store it
 * ENCRYPTED, register webhooks, set syncStatus PENDING. (Backfill is enqueued in Slice 3.)
 */
export async function GET(req: Request): Promise<Response> {
  const cfg = shopifyConfig()
  if (!cfg.apiSecret) return NextResponse.json({ error: 'Shopify not configured' }, { status: 503 })

  const query = Object.fromEntries(new URL(req.url).searchParams.entries())
  if (!validateCallbackHmac(query, cfg.apiSecret)) {
    return NextResponse.json({ error: 'invalid HMAC' }, { status: 401 })
  }
  const jar = await cookies()
  if (!jar.get('ss_oauth_state')?.value || jar.get('ss_oauth_state')?.value !== query.state) {
    return NextResponse.json({ error: 'invalid state' }, { status: 401 })
  }
  const shop = normalizeShop(query.shop ?? '')
  const code = query.code
  if (!shop || !code) return NextResponse.json({ error: 'missing shop/code' }, { status: 400 })
  // Even though the HMAC authenticates the callback, only persist a well-formed *.myshopify.com
  // domain — matches the start route and keeps anything odd out of the stored shopDomain.
  if (!isValidShopDomain(shop)) {
    return NextResponse.json({ error: 'invalid shop domain' }, { status: 400 })
  }

  const client = createShopifyClient()
  const token = await client.exchangeCodeForToken(shop, code)

  const { orgId } = await getSession()
  await prisma.store.upsert({
    where: { shopDomain: shop },
    update: { accessTokenEnc: encryptSecret(token), syncStatus: 'PENDING' },
    create: {
      orgId,
      shopDomain: shop,
      accessTokenEnc: encryptSecret(token),
      syncStatus: 'PENDING',
    },
  })

  await client.registerWebhooks(
    shop,
    token,
    DEFAULT_WEBHOOK_TOPICS,
    `${cfg.appUrl}/api/webhooks/shopify`,
  )
  jar.delete('ss_oauth_state')

  // Backfill (Slice 3, built + tested): backfillStore(prisma, store.id, new RealShopifyReader(),
  // { shop, token }) — idempotent, SYNCING→READY — once RealShopifyReader's GraphQL mapping is
  // implemented. Run it durably via Inngest (not inline) so this request returns fast.

  return NextResponse.redirect(`${cfg.appUrl}/connections?connected=${encodeURIComponent(shop)}`)
}
