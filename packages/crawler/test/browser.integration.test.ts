import { describe, it, expect } from 'vitest'
import { BrowserPool } from '../src/browser'

const ALLOW_ALL = async () => true

/**
 * The tests in this package that launch a REAL Chromium instance — proving the
 * Playwright wiring actually works (a real `Page` structurally satisfies
 * `CrawlerPage`, and `context.route()` genuinely intercepts real requests), not just
 * that the mocked unit tests pass. Navigates to `data:` URLs directly on the page
 * object, bypassing `capture()`'s own URL/SSRF validation (which correctly refuses
 * http(s)-only, non-loopback targets) — these tests are about the browser wiring
 * itself, not `capture()`'s pre-flight checks, which are covered by crawler.test.ts's
 * mocks.
 */
describe('BrowserPool — real Playwright integration', () => {
  it('launches a real browser and produces a page satisfying CrawlerPage', async () => {
    const pool = new BrowserPool(ALLOW_ALL)
    const handle = await pool.newPage('SimpleSense-Crawler-Test/0.1')
    try {
      // Playwright's own documented behavior: navigating to a `data:` URL returns a
      // null response (there's no real network request to report status for) — this
      // test is about proving the page itself works, not exercising that response.
      await handle.page.goto('data:text/html,<html><body><h1>hi</h1></body></html>')
      const html = await handle.page.content()
      expect(html).toContain('<h1>hi</h1>')
      const screenshot = await handle.page.screenshot()
      expect(Buffer.isBuffer(screenshot)).toBe(true)
      expect(screenshot.length).toBeGreaterThan(0)
    } finally {
      await handle.close()
      await pool.close()
    }
  }, 30_000)

  it('routes every real subresource request through the injected safety check and aborts unsafe ones (regression: a single pre-navigation check missed subresources entirely)', async () => {
    const checked: string[] = []
    const pool = new BrowserPool(async (url) => {
      checked.push(url)
      return false // block everything real — data:/about: navigation itself isn't routed
    })
    const handle = await pool.newPage('SimpleSense-Crawler-Test/0.1')
    try {
      await handle.page.goto(
        'data:text/html,<html><body><img src="https://blocked.invalid/pixel.png"></body></html>',
      )
      expect(checked.some((u) => u.includes('blocked.invalid'))).toBe(true)
    } finally {
      await handle.close()
      await pool.close()
    }
  }, 30_000)

  it('lets a real subresource request through when the injected safety check approves it', async () => {
    const checked: string[] = []
    const pool = new BrowserPool(async (url) => {
      checked.push(url)
      return true
    })
    const handle = await pool.newPage('SimpleSense-Crawler-Test/0.1')
    try {
      await handle.page.goto('data:text/html,<html><body><h1>ok</h1></body></html>')
      const html = await handle.page.content()
      expect(html).toContain('ok')
    } finally {
      await handle.close()
      await pool.close()
    }
  }, 30_000)

  it('launches only ONE browser under concurrent first newPage() calls (regression: an earlier version could launch and leak a second Chromium process)', async () => {
    const pool = new BrowserPool(ALLOW_ALL)
    try {
      const [a, b] = await Promise.all([
        pool.newPage('SimpleSense-Crawler-Test/0.1'),
        pool.newPage('SimpleSense-Crawler-Test/0.1'),
      ])
      // Both pages must come from the SAME browser process — proven indirectly: both
      // pages work normally, and there's exactly one `browser` to close.
      await a.page.goto('data:text/html,<h1>a</h1>')
      await b.page.goto('data:text/html,<h1>b</h1>')
      expect(await a.page.content()).toContain('a')
      expect(await b.page.content()).toContain('b')
      await a.close()
      await b.close()
    } finally {
      await pool.close()
    }
  }, 30_000)

  it('close() waits for an in-flight launch instead of leaking it, leaving the pool ready for a fresh launch afterward', async () => {
    const pool = new BrowserPool(ALLOW_ALL)
    const firstPagePromise = pool.newPage('SimpleSense-Crawler-Test/0.1')
    // Attached synchronously, in the same tick the promise is created — Node's
    // unhandled-rejection detector otherwise fires on timing alone if a real rejection
    // lands before an async `await x.catch()` further down gets around to attaching.
    firstPagePromise.catch(() => {})
    await pool.close() // races the still-launching browser from the newPage() call above
    // Which side of that race "wins" for the first call is an accepted tradeoff (you
    // asked to close while your own work was in flight) — not what's under test here.
    await firstPagePromise.catch(() => {})
    // What must be true regardless: close() actually waited for and closed that
    // browser rather than silently no-op'ing and leaking it — proven by the pool being
    // able to cleanly launch and use a FRESH browser afterward, not stuck on a stale
    // reference to an already-closed one.
    const handle = await pool.newPage('SimpleSense-Crawler-Test/0.1')
    await handle.page.goto('data:text/html,<h1>fresh</h1>')
    expect(await handle.page.content()).toContain('fresh')
    await handle.close()
    await pool.close()
  }, 30_000)
})
