import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Public routes: landing, the shareable Audit, auth pages, health, and machine-to-machine
// endpoints (Shopify/Stripe webhooks + Shopify OAuth, which are HMAC/state-verified, not
// Clerk-session-authed). Everything else requires login.
const isPublic = createRouteMatcher([
  '/',
  '/how-it-works',
  '/pricing',
  '/audit(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  // Metadata routes (extensionless, so the matcher below doesn't auto-exclude them) — must be
  // public so social scrapers can fetch the OG card without hitting the Clerk auth wall.
  '/opengraph-image(.*)',
  '/twitter-image(.*)',
  '/api/health',
  '/api/webhooks(.*)',
  '/api/stores/connect(.*)',
])

// Gate on the SAME signal the ClerkProvider uses (the build-inlined publishable key) so the
// middleware (auth enforcement) and the provider (UI) can never diverge — a build with the
// publishable key but no runtime secret now throws loudly inside auth.protect() instead of
// silently passing every request through. assertServerEnv refuses to boot on a split config.
const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default hasClerk
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublic(req)) await auth.protect()
    })
  : function middleware(): NextResponse {
      return NextResponse.next()
    }

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
}
