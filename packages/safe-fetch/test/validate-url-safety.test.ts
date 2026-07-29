import { describe, it, expect } from 'vitest'
import { validateUrlSafety } from '../src/safe-fetch'

describe('validateUrlSafety — direct unit tests (exported for the S1 crawler)', () => {
  it('clears a normal https URL that resolves to a public IP', async () => {
    const reason = await validateUrlSafety(
      new URL('https://example.com/product/1'),
      async () => ['93.184.216.34'],
      5000,
    )
    expect(reason).toBeNull()
  })

  it('rejects a hostname resolving to a private IP', async () => {
    const reason = await validateUrlSafety(
      new URL('https://internal.example.com/'),
      async () => ['10.0.0.5'],
      5000,
    )
    expect(reason).toMatch(/blocked address/)
  })

  it('rejects a non-http(s) scheme without doing DNS at all', async () => {
    let called = false
    const reason = await validateUrlSafety(
      new URL('file:///etc/passwd'),
      async () => {
        called = true
        return ['93.184.216.34']
      },
      5000,
    )
    expect(reason).toMatch(/blocked scheme/)
    expect(called).toBe(false)
  })

  it('rejects a non-standard port', async () => {
    const reason = await validateUrlSafety(
      new URL('https://example.com:8080/'),
      async () => ['93.184.216.34'],
      5000,
    )
    expect(reason).toMatch(/blocked port/)
  })

  it('rejects an IP literal in the blocklist directly, without a lookup call', async () => {
    let called = false
    const reason = await validateUrlSafety(
      new URL('http://127.0.0.1/'),
      async () => {
        called = true
        return []
      },
      5000,
    )
    expect(reason).toMatch(/blocked IP literal/)
    expect(called).toBe(false)
  })
})
