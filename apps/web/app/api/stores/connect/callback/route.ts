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
import { startStoreSync } from '@/lib/sync-runner'

/**
 * Shopify OAuth callback: verify HMAC + state, exchange the code for a token, store it
 * ENCRYPTED, register webhooks, set syncStatus PENDING, then auto-start the first sync via the
 * shared runner (lib/sync-runner) so the merchant lands on /connections already syncing.
 */
export async function GET(req: Request): Promise<Response> {
  const cfg = shopifyConfig()
  // This callback is navigated by the merchant's BROWSER, so every failure redirects to a
  // friendly banner on /connections rather than dumping raw JSON at them mid-funnel.
  const fail = (code: string): Response =>
    NextResponse.redirect(`${cfg.appUrl}/connections?error=${code}`)

  if (!cfg.apiSecret) return fail('config')

  const query = Object.fromEntries(new URL(req.url).searchParams.entries())
  if (!validateCallbackHmac(query, cfg.apiSecret)) return fail('hmac')

  const jar = await cookies()
  if (!jar.get('ss_oauth_state')?.value || jar.get('ss_oauth_state')?.value !== query.state) {
    return fail('state')
  }
  const shop = normalizeShop(query.shop ?? '')
  const code = query.code
  if (!shop || !code) return fail('shop')
  // Even though the HMAC authenticates the callback, only persist a well-formed *.myshopify.com
  // domain — matches the start route and keeps anything odd out of the stored shopDomain.
  if (!isValidShopDomain(shop)) return fail('shop')

  // Fail closed: never attach a live store + access token to the shared DEMO org. The merchant
  // must be signed into SimpleSense so getSession() resolves to THEIR org. (getSession falls back
  // to DEMO when there's no Clerk session — that must not silently capture a real connection.)
  const { orgId, userId } = await getSession()
  if (!userId || orgId === DEMO.orgId) return fail('auth')

  const client = createShopifyClient()
  let token: string
  try {
    token = await client.exchangeCodeForToken(shop, code)
  } catch (err) {
    console.error('[connect] token exchange failed:', (err as Error).message)
    return fail('exchange')
  }

  // Re-home on update too: whoever can complete this HMAC-verified OAuth controls the Shopify
  // store, so the store belongs to the connecting org even if a prior org (or DEMO) held it.
  const store = await prisma.store.upsert({
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

  // Auto-start the first sync so the merchant lands on /connections already syncing.
  // Best-effort: a kickoff failure must not break an otherwise-successful connect — the
  // store stays PENDING and the merchant can click "Sync now". started:false means a sync
  // is ALREADY in flight, so the syncing banner is correct either way.
  let syncing = false
  try {
    await startStoreSync(store.id, shop, token)
    syncing = true
  } catch (err) {
    console.error('[connect] auto-sync kickoff failed (continuing):', (err as Error).message)
  }

  return NextResponse.redirect(
    `${cfg.appUrl}/connections?connected=${encodeURIComponent(shop)}${syncing ? '&syncing=1' : ''}`,
  )
}
