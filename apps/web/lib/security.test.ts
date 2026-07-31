import { describe, it, expect, beforeEach } from 'vitest'
import { redactSecrets, redactDeep, rateLimit, _resetRateLimits } from './security'

describe('redaction', () => {
  it('masks emails, Anthropic keys and Shopify tokens in strings', () => {
    const s = 'user owner@store.com key sk-ant-api03-AbC_d-1 token shpat_abc123'
    const out = redactSecrets(s)
    expect(out).not.toMatch(/owner@store\.com/)
    expect(out).not.toMatch(/sk-ant-api03-AbC_d-1/)
    expect(out).not.toMatch(/shpat_abc123/)
    expect(out).toContain('[redacted-email]')
  })

  it('masks Stripe secret, restricted and webhook-signing keys (regression: Stripe was the one configured provider this redactor missed, found 2026-07-31)', () => {
    const out = redactSecrets(
      'live sk_live_51AbCdEf00xyz test sk_test_51AbCdEf00xyz restricted rk_live_51AbCdEf00xyz hook whsec_AbCdEf123',
    )
    expect(out).not.toMatch(/sk_live_51AbCdEf00xyz/)
    expect(out).not.toMatch(/sk_test_51AbCdEf00xyz/)
    expect(out).not.toMatch(/rk_live_51AbCdEf00xyz/)
    expect(out).not.toMatch(/whsec_AbCdEf123/)
    expect(out).toContain('[redacted-key]')
    expect(out).toContain('[redacted-secret]')
  })

  it('leaves non-secret Stripe identifiers (price_/acct_/cs_) readable — they are needed for debugging and are not credentials', () => {
    const s = 'price_1Tz9fDPSg73eCHB6 acct_1Tz8wzPSg73eCHB6 cs_test_a1gNITK2JSv9'
    expect(redactSecrets(s)).toBe(s)
  })

  it('deep-redacts sensitive keys and scrubs nested strings', () => {
    const obj = { accessTokenEnc: 'iv.tag.ct', nested: { email: 'a@b.co' }, ok: 'fine' }
    const out = redactDeep(obj) as { accessTokenEnc: string; nested: { email: string }; ok: string }
    expect(out.accessTokenEnc).toBe('[redacted]')
    expect(out.nested.email).toBe('[redacted-email]')
    expect(out.ok).toBe('fine')
  })
})

describe('rateLimit', () => {
  beforeEach(() => _resetRateLimits())

  it('allows up to the limit, then denies within the window', () => {
    const now = 1_000_000
    expect(rateLimit('k', 2, 60_000, now).allowed).toBe(true)
    expect(rateLimit('k', 2, 60_000, now).allowed).toBe(true)
    expect(rateLimit('k', 2, 60_000, now).allowed).toBe(false) // 3rd denied
  })

  it('resets after the window elapses', () => {
    expect(rateLimit('k', 1, 1000, 0).allowed).toBe(true)
    expect(rateLimit('k', 1, 1000, 500).allowed).toBe(false)
    expect(rateLimit('k', 1, 1000, 1200).allowed).toBe(true) // new window
  })
})
