/**
 * Security utilities (Slice 12): secret/PII redaction for logs and a best-effort
 * in-memory rate limiter for sensitive routes. The limiter is per-instance (fine for a
 * single Fly machine); swap for Upstash/Redis when running multi-instance.
 */

const PATTERNS: { re: RegExp; with: string }[] = [
  { re: /[\w.+-]+@[\w-]+\.[\w.-]+/g, with: '[redacted-email]' },
  { re: /sk-ant-[A-Za-z0-9_-]+/g, with: '[redacted-key]' },
  { re: /shp(at|ss|ca|pa|ss)_[A-Za-z0-9]+/g, with: '[redacted-token]' },
  { re: /Bearer\s+[A-Za-z0-9._-]+/gi, with: 'Bearer [redacted]' },
]

const SENSITIVE_KEY = /(token|secret|password|api[_-]?key|authorization|accessToken)/i

/** Redact secrets/PII from a string for safe logging. */
export function redactSecrets(input: string): string {
  let out = input
  for (const p of PATTERNS) out = out.replace(p.re, p.with)
  return out
}

/** Deep-redact an object: sensitive-named keys are masked; string values are scrubbed. */
export function redactDeep(value: unknown): unknown {
  if (typeof value === 'string') return redactSecrets(value)
  if (Array.isArray(value)) return value.map(redactDeep)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEY.test(k) ? '[redacted]' : redactDeep(v)
    }
    return out
  }
  return value
}

// --- rate limiting (fixed window, in-memory) ---
interface Bucket {
  count: number
  resetAt: number
}
const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }
  if (b.count >= limit) return { allowed: false, remaining: 0, resetAt: b.resetAt }
  b.count += 1
  return { allowed: true, remaining: limit - b.count, resetAt: b.resetAt }
}

/** Test hook — clear all buckets. */
export function _resetRateLimits(): void {
  buckets.clear()
}
