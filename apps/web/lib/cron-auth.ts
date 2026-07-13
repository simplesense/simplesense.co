import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Constant-time check of the cron bearer secret. Both values are HMAC'd to a fixed
 * length before comparison so neither content nor length leaks via timing.
 */
export function isAuthorizedCron(header: string | null, secret: string | null): boolean {
  if (!secret || !header) return false
  const presented = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : header
  const a = createHmac('sha256', 'cron-auth').update(presented).digest()
  const b = createHmac('sha256', 'cron-auth').update(secret).digest()
  return timingSafeEqual(a, b)
}
