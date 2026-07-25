import { describe, it, expect } from 'vitest'
import {
  extractJsonLd,
  flattenJsonLdTypes,
  hasType,
  visibleTextLength,
  extractLinks,
  detectsCaptcha,
} from '../../src/agent-ready/html-utils'

describe('extractJsonLd', () => {
  it('parses a single ld+json block', () => {
    const html = `<html><head><script type="application/ld+json">{"@type":"Product","name":"Tee"}</script></head></html>`
    expect(extractJsonLd(html)).toEqual([{ '@type': 'Product', name: 'Tee' }])
  })

  it('parses multiple blocks', () => {
    const html = `
      <script type="application/ld+json">{"@type":"Organization"}</script>
      <script type="application/ld+json">{"@type":"Product","name":"Tee"}</script>
    `
    expect(extractJsonLd(html)).toHaveLength(2)
  })

  it('skips a malformed block instead of throwing', () => {
    const html = `<script type="application/ld+json">{not valid json}</script>`
    expect(extractJsonLd(html)).toEqual([])
  })

  it('returns an empty array when there is no ld+json script', () => {
    expect(extractJsonLd('<html><body>hi</body></html>')).toEqual([])
  })
})

describe('flattenJsonLdTypes + hasType', () => {
  it('finds a top-level typed node', () => {
    const nodes = flattenJsonLdTypes([{ '@type': 'Product', name: 'Tee' }])
    expect(nodes).toHaveLength(1)
    expect(hasType(nodes[0]!, 'Product')).toBe(true)
  })

  it('recurses into @graph', () => {
    const nodes = flattenJsonLdTypes([
      { '@context': 'https://schema.org', '@graph': [{ '@type': 'Product', name: 'Tee' }] },
    ])
    expect(nodes.some((n) => hasType(n, 'Product'))).toBe(true)
  })

  it('recurses into nested objects (e.g. Product.offers)', () => {
    const nodes = flattenJsonLdTypes([
      { '@type': 'Product', name: 'Tee', offers: { '@type': 'Offer', price: '20' } },
    ])
    expect(nodes.some((n) => hasType(n, 'Offer'))).toBe(true)
  })

  it('matches an array-form @type', () => {
    const nodes = flattenJsonLdTypes([{ '@type': ['Product', 'Vehicle'] }])
    expect(hasType(nodes[0]!, 'Product')).toBe(true)
    expect(hasType(nodes[0]!, 'Vehicle')).toBe(true)
    expect(hasType(nodes[0]!, 'Book')).toBe(false)
  })
})

describe('visibleTextLength', () => {
  it('counts visible text, excluding script/style content', () => {
    const html =
      '<html><head><style>.a{color:red}</style></head><body><script>var x=1</script><p>Hello world</p></body></html>'
    expect(visibleTextLength(html)).toBe('Hello world'.length)
  })

  it('collapses whitespace from tag stripping', () => {
    expect(visibleTextLength('<div>a</div><div>b</div>')).toBe('a b'.length)
  })

  it('returns 0 for an empty shell', () => {
    expect(visibleTextLength('<div id="root"></div>')).toBe(0)
  })
})

describe('extractLinks', () => {
  it('extracts href and cleaned text', () => {
    const html = '<a href="/pages/shipping-policy">Shipping &amp; Returns</a>'
    const links = extractLinks(html)
    expect(links).toEqual([{ href: '/pages/shipping-policy', text: 'Shipping &amp; Returns' }])
  })

  it('strips nested tags from link text', () => {
    const html = '<a href="/policy"><span>Return</span> Policy</a>'
    expect(extractLinks(html)[0]!.text).toBe('Return Policy')
  })

  it('returns an empty array when there are no links', () => {
    expect(extractLinks('<p>no links here</p>')).toEqual([])
  })
})

describe('detectsCaptcha', () => {
  it('detects a reCAPTCHA script', () => {
    expect(detectsCaptcha('<script src="https://www.google.com/recaptcha/api.js"></script>')).toBe(
      true,
    )
  })
  it('detects an hCaptcha div', () => {
    expect(detectsCaptcha('<div class="h-captcha" data-sitekey="x"></div>')).toBe(true)
  })
  it('detects Cloudflare Turnstile', () => {
    expect(detectsCaptcha('<div class="cf-turnstile"></div>')).toBe(true)
  })
  it('returns false for a page with no captcha markers', () => {
    expect(detectsCaptcha('<html><body>Buy now</body></html>')).toBe(false)
  })
})
