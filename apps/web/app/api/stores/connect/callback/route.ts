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
import { prisma, DEMO } from '@ss/db'
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

  // Fail closed: never attach a live store + access token to the shared DEMO org. The merchant
  // must be signed into SimpleSense so getSession() resolves to THEIR org. (getSession falls back
  // to DEMO when there's no Clerk session — that must not silently capture a real connection.)
  const { orgId, userId } = await getSession()
  if (!userId || orgId === DEMO.orgId) {
    return NextResponse.json(
      { error: 'Sign in to SimpleSense before connecting a store.' },
      { status: 401 },
    )
  }

  const client = createShopifyClient()
  const token = await client.exchangeCodeForToken(shop, code)

  // Re-home on update too: whoever can complete this HMAC-verified OAuth controls the Shopify
  // store, so the store belongs to the connecting org even if a prior org (or DEMO) held it.
  await prisma.store.upsert({
    where: { shopDomain: shop },
    update: { orgId, accessTokenEnc: encryptSecret(token), syncStatus: 'PENDING' },
    create: {
      orgId,
      shopDomain: shop,
      accessTokenEnc: encryptSecret(token),
      syncStatus: 'PENDING',
    },
  })

  // Webhook registration is best-effort: a transient failure here must not 500 an otherwise
  // successful connect (the token is already stored; webhooks can be re-registered on sync).
  try {
    await client.registerWebhooks(
      shop,
      token,
      DEFAULT_WEBHOOK_TOPICS,
      `${cfg.appUrl}/api/webhooks/shopify`,
    )
  } catch (err) {
    console.error('[connect] webhook registration failed (continuing):', (err as Error).message)
  }
  jar.delete('ss_oauth_state')

  // The merchant lands on /connections and clicks "Sync now", which runs the backfill
  // (RealShopifyReader) + grounded analysis via syncStoreAction. Kept off this request so the
  // OAuth redirect returns immediately.
  return NextResponse.redirect(`${cfg.appUrl}/connections?connected=${encodeURIComponent(shop)}`)
}
