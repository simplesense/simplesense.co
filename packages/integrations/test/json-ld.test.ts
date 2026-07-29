import { describe, it, expect } from 'vitest'
import { extractJsonLd, flattenJsonLdTypes, hasType } from '../src/json-ld'

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

  it('returns an empty array when there are no ld+json blocks', () => {
    expect(extractJsonLd('<html><body>hi</body></html>')).toEqual([])
  })
})

describe('flattenJsonLdTypes', () => {
  it('recurses through @graph arrays', () => {
    const blocks = [{ '@context': 'https://schema.org', '@graph': [{ '@type': 'Product' }] }]
    expect(flattenJsonLdTypes(blocks)).toEqual([{ '@type': 'Product' }])
  })

  it('recurses into nested objects (e.g. a Product with a nested AggregateRating)', () => {
    const blocks = [
      { '@type': 'Product', aggregateRating: { '@type': 'AggregateRating', reviewCount: 5 } },
    ]
    const flat = flattenJsonLdTypes(blocks)
    expect(flat).toHaveLength(2)
    expect(flat.some((n) => hasType(n, 'AggregateRating'))).toBe(true)
  })
})

describe('hasType', () => {
  it('matches a plain string @type', () => {
    expect(hasType({ '@type': 'Product' }, 'Product')).toBe(true)
    expect(hasType({ '@type': 'Product' }, 'Review')).toBe(false)
  })
  it('matches within an array @type', () => {
    expect(hasType({ '@type': ['Thing', 'Product'] }, 'Product')).toBe(true)
  })
})
