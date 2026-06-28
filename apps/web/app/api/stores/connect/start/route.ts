import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'node:crypto'
import { shopifyConfig } from '@ss/config'
import { buildAuthorizeUrl, isValidShopDomain, normalizeShop } from '@ss/integrations'

/** Begin Shopify OAuth: validate the shop, set an anti-CSRF state cookie, redirect to authorize. */
export async function GET(req: Request): Promise<Response> {
  const cfg = shopifyConfig()
  if (!cfg.hasCredentials || !cfg.apiKey) {
    return NextResponse.json(
      {
        error:
          'Shopify is not configured. Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET to enable live connect.',
      },
      { status: 503 },
    )
  }
  const shop = new URL(req.url).searchParams.get('shop') ?? ''
  if (!isValidShopDomain(shop)) {
    return NextResponse.json(
      { error: 'Provide a valid shop, e.g. your-store.myshopify.com' },
      { status: 400 },
    )
  }

  const state = randomBytes(16).toString('hex')
  const authorize = buildAuthorizeUrl({
    shop: normalizeShop(shop),
    apiKey: cfg.apiKey,
    scopes: cfg.scopes,
    redirectUri: `${cfg.appUrl}/api/stores/connect/callback`,
    state,
  })

  const jar = await cookies()
  const opts = { httpOnly: true, secure: true, sameSite: 'lax' as const, maxAge: 600, path: '/' }
  jar.set('ss_oauth_state', state, opts)
  return NextResponse.redirect(authorize)
}
