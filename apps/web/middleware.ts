import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Public routes: landing, the shareable Audit, auth pages, health, and machine-to-machine
// endpoints (Shopify/Stripe webhooks + Shopify OAuth, which are HMAC/state-verified, not
// Clerk-session-authed). Everything else requires login.
const isPublic = createRouteMatcher([
  '/',
  '/audit(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/webhooks(.*)',
  '/api/stores/connect(.*)',
])

const hasClerk = !!process.env.CLERK_SECRET_KEY

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
