import { describe, it, expect, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { createCrawler } from '../src/crawler'
import { DEFAULT_USER_AGENT } from '../src/browser'
import type { CrawlerPage, CrawlerPageHandle } from '../src/types'
import type { RobotsFetchResult } from '../src/robots-cache'

function fetched(body: string): RobotsFetchResult {
  return { status: 'fetched', body }
}
const UNAVAILABLE: RobotsFetchResult = { status: 'unavailable' }

function fakePageHandle(overrides: Partial<CrawlerPage> = {}): {
  handle: CrawlerPageHandle
  close: ReturnType<typeof vi.fn>
  page: CrawlerPage
} {
  const close = vi.fn(async () => {})
  const page: CrawlerPage = {
    goto: vi.fn(async () => ({ status: () => 200 })),
    content: vi.fn(async () => '<html><body>hello</body></html>'),
    screenshot: vi.fn(async () => Buffer.from('fake-png-bytes')),
    url: vi.fn(() => 'https://example.com/reviews'),
    ...overrides,
  }
  return { handle: { page, close }, close, page }
}

const PUBLIC_LOOKUP = async () => ['93.184.216.34']
const NO_ROBOTS = async () => fetched('')

describe('createCrawler — SSRF and URL validation', () => {
  it('rejects an invalid URL without touching the page factory', async () => {
    const pageFactory = vi.fn()
    const crawler = createCrawler({ pageFactory, lookup: PUBLIC_LOOKUP })
    const result = await crawler.capture('not a url')
    expect(result).toEqual({ ok: false, reason: 'invalid_url' })
    expect(pageFactory).not.toHaveBeenCalled()
  })

  it('rejects a URL resolving to a private IP without touching the page factory', async () => {
    const pageFactory = vi.fn()
    const crawler = createCrawler({
      pageFactory,
      lookup: async () => ['10.0.0.5'],
      robotsFetcher: NO_ROBOTS,
    })
    const result = await crawler.capture('https://internal.example.com/')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('ssrf_blocked')
    expect(pageFactory).not.toHaveBeenCalled()
  })

  it('rejects a non-http(s) scheme without touching the page factory', async () => {
    const pageFactory = vi.fn()
    const crawler = createCrawler({ pageFactory, lookup: PUBLIC_LOOKUP })
    const result = await crawler.capture('file:///etc/passwd')
    expect(result).toEqual({
      ok: false,
      reason: 'blocked_scheme',
      detail: 'blocked scheme: file:',
    })
    expect(pageFactory).not.toHaveBeenCalled()
  })
})

describe('createCrawler — robots.txt compliance', () => {
  it('refuses a path disallowed for everyone, without touching the page factory', async () => {
    const pageFactory = vi.fn()
    const crawler = createCrawler({
      pageFactory,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: async () => fetched('User-agent: *\nDisallow: /admin\n'),
    })
    const result = await crawler.capture('https://example.com/admin/orders')
    expect(result).toEqual({ ok: false, reason: 'robots_disallowed' })
    expect(pageFactory).not.toHaveBeenCalled()
  })

  it('proceeds when robots.txt allows the path', async () => {
    const { handle } = fakePageHandle()
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: async () => fetched('User-agent: *\nDisallow: /admin\n'),
    })
    const result = await crawler.capture('https://example.com/reviews')
    expect(result.ok).toBe(true)
  })

  it('caches robots.txt across captures to the same origin (fetched once)', async () => {
    const { handle } = fakePageHandle()
    const robotsFetcher = vi.fn(async () => fetched('User-agent: *\nDisallow: /admin\n'))
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher,
      sleep: vi.fn(async () => {}),
    })
    await crawler.capture('https://example.com/reviews')
    await crawler.capture('https://example.com/products/1')
    expect(robotsFetcher).toHaveBeenCalledTimes(1)
  })

  it('a site blocking us BY NAME (our real default user-agent) is actually respected — regression: an earlier version matched on the whole descriptive UA string and never selected this group at all', async () => {
    const pageFactory = vi.fn()
    // Real sites declare a bare product token, not our full "Name/version (+url)" string.
    const productToken = DEFAULT_USER_AGENT.split('/')[0]
    const crawler = createCrawler({
      pageFactory,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: async () => fetched(`User-agent: ${productToken}\nDisallow: /\n`),
    })
    const result = await crawler.capture('https://example.com/products/1')
    expect(result).toEqual({ ok: false, reason: 'robots_disallowed' })
    expect(pageFactory).not.toHaveBeenCalled()
  })

  it('an Allow carve-out inside a broader Disallow is honored, not dropped', async () => {
    const { handle } = fakePageHandle()
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: async () => fetched('User-agent: *\nDisallow: /\nAllow: /products/\n'),
    })
    const result = await crawler.capture('https://example.com/products/1')
    expect(result.ok).toBe(true)
  })

  it('treats a genuine robots.txt fetch failure as unavailable, never as "no restrictions"', async () => {
    const pageFactory = vi.fn()
    const crawler = createCrawler({
      pageFactory,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: async () => UNAVAILABLE,
    })
    const result = await crawler.capture('https://example.com/products/1')
    expect(result).toEqual({ ok: false, reason: 'robots_unavailable' })
    expect(pageFactory).not.toHaveBeenCalled()
  })
})

describe('createCrawler — rate limiting', () => {
  it('waits at least minDelayPerOriginMs between two captures to the same origin', async () => {
    const { handle } = fakePageHandle()
    const sleep = vi.fn(async () => {})
    let clock = 1_000_000
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
      minDelayPerOriginMs: 2000,
      now: () => new Date(clock),
      sleep,
    })
    await crawler.capture('https://example.com/a')
    clock += 500 // only 500ms elapsed, need to wait the remaining 1500ms
    await crawler.capture('https://example.com/b')
    expect(sleep).toHaveBeenCalledWith(1500)
  })

  it('does not wait for a different origin', async () => {
    const { handle } = fakePageHandle()
    const sleep = vi.fn(async () => {})
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
      minDelayPerOriginMs: 2000,
      sleep,
    })
    await crawler.capture('https://example.com/a')
    await crawler.capture('https://other.example.com/b')
    expect(sleep).not.toHaveBeenCalled()
  })
})

describe('createCrawler — successful capture', () => {
  it('returns a Capture with the expected shape, and a sha256 over html+screenshot', async () => {
    const { handle } = fakePageHandle()
    const fixedNow = new Date('2026-07-29T00:00:00.000Z')
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
      now: () => fixedNow,
    })
    const result = await crawler.capture('https://example.com/reviews')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const html = '<html><body>hello</body></html>'
    const screenshotBase64 = Buffer.from('fake-png-bytes').toString('base64')
    const expectedHash = createHash('sha256').update(html).update(screenshotBase64).digest('hex')
    expect(result.capture).toEqual({
      requestedUrl: 'https://example.com/reviews',
      finalUrl: 'https://example.com/reviews',
      fetchedAt: fixedNow.toISOString(),
      status: 200,
      html,
      screenshotBase64,
      sha256: expectedHash,
    })
  })

  it('always closes the page handle, even on a successful capture', async () => {
    const { handle, close } = fakePageHandle()
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
    })
    await crawler.capture('https://example.com/reviews')
    expect(close).toHaveBeenCalledTimes(1)
  })

  it("returns a typed navigation_failed result if pageFactory() itself throws, instead of rejecting (regression: this call sat outside capture()'s try/catch)", async () => {
    const crawler = createCrawler({
      pageFactory: async () => {
        throw new Error('Chromium crashed')
      },
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
    })
    await expect(crawler.capture('https://example.com/reviews')).resolves.toEqual({
      ok: false,
      reason: 'navigation_failed',
      detail: 'Chromium crashed',
    })
  })

  it('returns a typed navigation_failed result if page.content() throws after a successful navigation, instead of rejecting (regression: unguarded post-navigation calls broke the "never throws" contract)', async () => {
    const { handle, close } = fakePageHandle({
      content: vi.fn(async () => {
        throw new Error('tab crashed')
      }),
    })
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
    })
    await expect(crawler.capture('https://example.com/reviews')).resolves.toEqual({
      ok: false,
      reason: 'navigation_failed',
      detail: 'tab crashed',
    })
    expect(close).toHaveBeenCalledTimes(1) // still cleaned up
  })

  it('returns a typed navigation_failed result if page.screenshot() throws, instead of rejecting', async () => {
    const { handle } = fakePageHandle({
      screenshot: vi.fn(async () => {
        throw new Error('renderer OOM')
      }),
    })
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
    })
    await expect(crawler.capture('https://example.com/reviews')).resolves.toEqual({
      ok: false,
      reason: 'navigation_failed',
      detail: 'renderer OOM',
    })
  })

  it('a cleanup (close) failure never masks a real result already computed (regression: an unguarded finally-block close() could override a good result with an unrelated cleanup error)', async () => {
    const { handle } = fakePageHandle({
      // Real result: a successful capture. Then cleanup itself fails.
    })
    handle.close = vi.fn(async () => {
      throw new Error('context already closed')
    })
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
    })
    const result = await crawler.capture('https://example.com/reviews')
    expect(result.ok).toBe(true) // the real capture result survives the cleanup failure
  })
})

describe('createCrawler — navigation retry/backoff', () => {
  it('retries a thrown navigation error with exponential backoff, then succeeds', async () => {
    let calls = 0
    const { handle } = fakePageHandle({
      goto: vi.fn(async () => {
        calls++
        if (calls < 2) throw new Error('net::ERR_CONNECTION_RESET')
        return { status: () => 200 }
      }),
    })
    const sleep = vi.fn(async () => {})
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
      retryBaseDelayMs: 500,
      sleep,
    })
    const result = await crawler.capture('https://example.com/reviews')
    expect(result.ok).toBe(true)
    expect(sleep).toHaveBeenCalledWith(500)
  })

  it('gives up after maxRetries and returns navigation_failed', async () => {
    const { handle, close } = fakePageHandle({
      goto: vi.fn(async () => {
        throw new Error('net::ERR_CONNECTION_RESET')
      }),
    })
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
      maxRetries: 2,
      sleep: vi.fn(async () => {}),
    })
    const result = await crawler.capture('https://example.com/reviews')
    expect(result).toEqual({
      ok: false,
      reason: 'navigation_failed',
      detail: 'net::ERR_CONNECTION_RESET',
    })
    expect(handle.page.goto).toHaveBeenCalledTimes(3) // initial attempt + 2 retries
    expect(close).toHaveBeenCalledTimes(1) // still cleaned up on failure
  })
})

describe('createCrawler — login-wall and CAPTCHA bail-out', () => {
  it('refuses a page returning 401', async () => {
    const { handle } = fakePageHandle({ goto: vi.fn(async () => ({ status: () => 401 })) })
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
    })
    const result = await crawler.capture('https://example.com/reviews')
    expect(result).toEqual({ ok: false, reason: 'login_walled' })
  })

  it('refuses a page whose final URL looks like a login page', async () => {
    const { handle } = fakePageHandle({ url: vi.fn(() => 'https://example.com/account/login') })
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
    })
    const result = await crawler.capture('https://example.com/reviews')
    expect(result).toEqual({ ok: false, reason: 'login_walled' })
  })

  it('refuses a page embedding a CAPTCHA widget', async () => {
    const { handle } = fakePageHandle({
      content: vi.fn(async () => '<div class="h-captcha"></div>'),
    })
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
    })
    const result = await crawler.capture('https://example.com/reviews')
    expect(result).toEqual({ ok: false, reason: 'captcha_gated' })
  })

  it('never takes a screenshot of a login-walled or CAPTCHA-gated page', async () => {
    const { handle } = fakePageHandle({ goto: vi.fn(async () => ({ status: () => 403 })) })
    const crawler = createCrawler({
      pageFactory: async () => handle,
      lookup: PUBLIC_LOOKUP,
      robotsFetcher: NO_ROBOTS,
    })
    await crawler.capture('https://example.com/reviews')
    expect(handle.page.screenshot).not.toHaveBeenCalled()
  })
})

describe('createCrawler — close()', () => {
  it('is safe to call when no real browser was ever launched (test always injects pageFactory)', async () => {
    const crawler = createCrawler({ pageFactory: async () => fakePageHandle().handle })
    await expect(crawler.close()).resolves.toBeUndefined()
  })
})
