import { describe, it, expect, vi } from 'vitest'
import { RobotsCache, type RobotsFetchResult } from '../src/robots-cache'

function fetched(body: string): RobotsFetchResult {
  return { status: 'fetched', body }
}
const UNAVAILABLE: RobotsFetchResult = { status: 'unavailable' }

describe('RobotsCache', () => {
  it('treats a missing robots.txt (a real 404 -> empty body) as nothing disallowed', async () => {
    const cache = new RobotsCache(async () => fetched(''))
    expect(await cache.isDisallowed('https://example.com', '/anything', 'MyBot')).toBe('allowed')
  })

  it('treats a genuine fetch failure as unavailable, never as "allowed" (regression: an earlier version silently fail-opened here)', async () => {
    const cache = new RobotsCache(async () => UNAVAILABLE)
    expect(await cache.isDisallowed('https://example.com', '/anything', 'MyBot')).toBe(
      'unavailable',
    )
  })

  it('disallows a path matching a wildcard rule', async () => {
    const cache = new RobotsCache(async () => fetched('User-agent: *\nDisallow: /admin\n'))
    expect(await cache.isDisallowed('https://example.com', '/admin/orders', 'MyBot')).toBe(
      'blocked',
    )
    expect(await cache.isDisallowed('https://example.com', '/products', 'MyBot')).toBe('allowed')
  })

  it('matches our real descriptive user-agent by its bare product token, not the whole string (regression: an earlier version matched the FULL descriptive UA and never selected a per-crawler group at all)', async () => {
    const realUserAgent = 'SimpleSense-Crawler/0.1 (+https://simplesense.co)'
    const cache = new RobotsCache(async () =>
      fetched('User-agent: SimpleSense-Crawler\nDisallow: /\n'),
    )
    expect(await cache.isDisallowed('https://example.com', '/anything', realUserAgent)).toBe(
      'blocked',
    )
  })

  it('prefers a named-agent group over the wildcard group (real robots.txt precedence)', async () => {
    const cache = new RobotsCache(async () =>
      fetched('User-agent: *\nDisallow: /\nUser-agent: MyBot\nDisallow: /admin\n'),
    )
    // MyBot's own group replaces the wildcard entirely — MyBot is NOT blocked from /products,
    // even though `*` disallows everything.
    expect(await cache.isDisallowed('https://example.com', '/products', 'MyBot')).toBe('allowed')
    expect(await cache.isDisallowed('https://example.com', '/admin', 'MyBot')).toBe('blocked')
    // A different, unnamed agent still gets the wildcard's blanket disallow.
    expect(await cache.isDisallowed('https://example.com', '/products', 'OtherBot')).toBe('blocked')
  })

  it('treats a blanket "Disallow: /" as blocking every path, not just an exact match', async () => {
    const cache = new RobotsCache(async () => fetched('User-agent: *\nDisallow: /\n'))
    expect(await cache.isDisallowed('https://example.com', '/reviews', 'MyBot')).toBe('blocked')
  })

  it('honors an Allow carve-out inside a broader Disallow (regression: an earlier version dropped Allow entirely, over-blocking)', async () => {
    const cache = new RobotsCache(async () =>
      fetched('User-agent: *\nDisallow: /\nAllow: /products/\n'),
    )
    expect(await cache.isDisallowed('https://example.com', '/products/widget', 'MyBot')).toBe(
      'allowed',
    )
    expect(await cache.isDisallowed('https://example.com', '/checkout', 'MyBot')).toBe('blocked')
  })

  it('fetches each origin at most once, caching across repeated checks', async () => {
    const fetcher = vi.fn(async () => fetched('User-agent: *\nDisallow: /admin\n'))
    const cache = new RobotsCache(fetcher)
    await cache.isDisallowed('https://example.com', '/a', 'MyBot')
    await cache.isDisallowed('https://example.com', '/b', 'MyBot')
    await cache.isDisallowed('https://example.com', '/c', 'MyBot')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('caches different origins independently', async () => {
    const fetcher = vi.fn(async (origin: string) =>
      fetched(
        origin.includes('a.com')
          ? 'User-agent: *\nDisallow: /x\n'
          : 'User-agent: *\nDisallow: /y\n',
      ),
    )
    const cache = new RobotsCache(fetcher)
    expect(await cache.isDisallowed('https://a.com', '/x', 'MyBot')).toBe('blocked')
    expect(await cache.isDisallowed('https://b.com', '/x', 'MyBot')).toBe('allowed')
    expect(await cache.isDisallowed('https://b.com', '/y', 'MyBot')).toBe('blocked')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('shares one in-flight fetch across concurrent checks to the same not-yet-cached origin, instead of firing one per call (regression: an earlier version fired a redundant fetch per concurrent caller)', async () => {
    let resolveFetch!: (r: RobotsFetchResult) => void
    const fetcher = vi.fn(
      () =>
        new Promise<RobotsFetchResult>((resolve) => {
          resolveFetch = resolve
        }),
    )
    const cache = new RobotsCache(fetcher)

    const a = cache.isDisallowed('https://example.com', '/a', 'MyBot')
    const b = cache.isDisallowed('https://example.com', '/b', 'MyBot')
    expect(fetcher).toHaveBeenCalledTimes(1) // both queued onto the SAME in-flight fetch

    resolveFetch(fetched('User-agent: *\nDisallow: /a\n'))
    expect(await a).toBe('blocked')
    expect(await b).toBe('allowed')
  })
})
