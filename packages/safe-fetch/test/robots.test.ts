import { describe, it, expect } from 'vitest'
import {
  parseRobotsDisallows,
  parseRobotsGroups,
  disallowsEverything,
  isPathBlocked,
  robotsProductToken,
} from '../src/robots'

describe('parseRobotsDisallows', () => {
  it('parses a single-agent group', () => {
    const txt = 'User-agent: *\nDisallow: /admin\nDisallow: /cart\n'
    expect(parseRobotsDisallows(txt)).toEqual({ '*': ['/admin', '/cart'] })
  })

  it('groups consecutive User-agent lines into one shared record', () => {
    const txt = 'User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\n'
    expect(parseRobotsDisallows(txt)).toEqual({ gptbot: ['/'], claudebot: ['/'] })
  })

  it('is a back-compat view of parseRobotsGroups that drops Allow rules', () => {
    const txt = 'User-agent: *\nDisallow: /\nAllow: /products/\n'
    expect(parseRobotsDisallows(txt)).toEqual({ '*': ['/'] })
  })
})

describe('parseRobotsGroups', () => {
  it('captures both Disallow and Allow rules per group', () => {
    const txt = 'User-agent: *\nDisallow: /\nAllow: /products/\n'
    expect(parseRobotsGroups(txt)).toEqual({ '*': { disallow: ['/'], allow: ['/products/'] } })
  })

  it('groups consecutive User-agent lines into one shared record', () => {
    const txt = 'User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\nAllow: /blog/\n'
    expect(parseRobotsGroups(txt)).toEqual({
      gptbot: { disallow: ['/'], allow: ['/blog/'] },
      claudebot: { disallow: ['/'], allow: ['/blog/'] },
    })
  })

  it('starts a new group after a non-User-agent directive closes the previous one', () => {
    const txt = 'User-agent: A\nDisallow: /x\nUser-agent: B\nAllow: /y\n'
    expect(parseRobotsGroups(txt)).toEqual({
      a: { disallow: ['/x'], allow: [] },
      b: { disallow: [], allow: ['/y'] },
    })
  })
})

describe('disallowsEverything', () => {
  it('is true only for an exact "/" rule', () => {
    expect(disallowsEverything(['/'])).toBe(true)
    expect(disallowsEverything(['/admin', '/cart'])).toBe(false)
    expect(disallowsEverything([])).toBe(false)
  })
})

describe('isPathBlocked', () => {
  it('matches a plain literal prefix rule', () => {
    expect(isPathBlocked('/admin/orders', { disallow: ['/admin'], allow: [] })).toBe(true)
    expect(isPathBlocked('/products/tee', { disallow: ['/admin'], allow: [] })).toBe(false)
  })

  it('is false with no rules at all', () => {
    expect(isPathBlocked('/anything', { disallow: [], allow: [] })).toBe(false)
  })

  it('handles a "*" wildcard mid-rule (regression: literal prefix matching missed this)', () => {
    // A real Shopify default robots.txt line blocking `+`-encoded tag-filtered blog URLs.
    expect(
      isPathBlocked('/blogs/news/tagged/sale+clearance', {
        disallow: ['/blogs/*+*'],
        allow: [],
      }),
    ).toBe(true)
    expect(isPathBlocked('/blogs/news/plain-post', { disallow: ['/blogs/*+*'], allow: [] })).toBe(
      false,
    )
  })

  it('handles a "$" end-anchor (regression: literal prefix matching missed this)', () => {
    expect(isPathBlocked('/page', { disallow: ['/page$'], allow: [] })).toBe(true)
    expect(isPathBlocked('/pages/other', { disallow: ['/page$'], allow: [] })).toBe(false)
  })

  it('an Allow carve-out inside a broader Disallow wins by longest-match precedence (regression: Allow was previously dropped entirely)', () => {
    const rules = { disallow: ['/'], allow: ['/products/'] }
    expect(isPathBlocked('/products/widget', rules)).toBe(false)
    expect(isPathBlocked('/checkout', rules)).toBe(true)
  })

  it('a more specific Disallow still wins over a shorter Allow', () => {
    const rules = { disallow: ['/products/discontinued/'], allow: ['/products/'] }
    expect(isPathBlocked('/products/discontinued/widget', rules)).toBe(true)
    expect(isPathBlocked('/products/widget', rules)).toBe(false)
  })
})

describe('robotsProductToken', () => {
  it('strips the version and comment from a descriptive user-agent string', () => {
    expect(robotsProductToken('SimpleSense-Crawler/0.1 (+https://simplesense.co)')).toBe(
      'SimpleSense-Crawler',
    )
  })

  it('returns a bare token unchanged', () => {
    expect(robotsProductToken('GPTBot')).toBe('GPTBot')
  })
})
