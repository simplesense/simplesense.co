import { describe, it, expect } from 'vitest'
import { normalizeScanUrl } from './agent-ready-scan'

describe('normalizeScanUrl', () => {
  it('accepts a well-formed https URL as-is', () => {
    expect(normalizeScanUrl('https://shop.example.com/products/tee')).toEqual({
      ok: true,
      url: 'https://shop.example.com/products/tee',
    })
  })

  it('adds https:// to a bare domain', () => {
    expect(normalizeScanUrl('shop.example.com')).toEqual({
      ok: true,
      url: 'https://shop.example.com/',
    })
  })

  it('preserves an explicit http:// scheme', () => {
    const result = normalizeScanUrl('http://shop.example.com')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.url.startsWith('http://')).toBe(true)
  })

  it('rejects an empty submission', () => {
    expect(normalizeScanUrl('   ')).toEqual({
      ok: false,
      error: 'Enter a product page URL to scan.',
    })
  })

  it('rejects a non-http(s) scheme', () => {
    expect(normalizeScanUrl('ftp://shop.example.com')).toEqual({
      ok: false,
      error: 'Only http:// and https:// URLs can be scanned.',
    })
  })

  it('rejects a hostname with no dot (not a real domain)', () => {
    expect(normalizeScanUrl('localhost')).toEqual({
      ok: false,
      error: "That doesn't look like a valid URL.",
    })
  })

  it('rejects unparseable garbage', () => {
    expect(normalizeScanUrl('http://').ok).toBe(false)
  })
})
