import { assertServerEnv } from '@ss/config'

/**
 * Next.js calls register() once per server runtime at startup. We fail-fast on a missing or
 * half-configured production env (§12) — notably a split Clerk config — so a misconfigured
 * deploy crashes loudly on boot instead of silently collapsing tenant isolation onto the demo
 * org. Only meaningful in the Node.js runtime (the edge runtime has no real process env here).
 */
export function register(): void {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    assertServerEnv()
  }
}
