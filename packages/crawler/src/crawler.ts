import { createHash } from 'node:crypto'
import {
  safeFetch,
  validateUrlSafety,
  defaultDnsLookup,
  detectsCaptcha,
  looksLikeLoginPath,
} from '@ss/safe-fetch'
import { RobotsCache, type RobotsFetcher } from './robots-cache'
import { RateLimiter } from './rate-limiter'
import { BrowserPool, DEFAULT_USER_AGENT, type RequestSafetyCheck } from './browser'
import type { Capture, Crawler, CrawlerOptions, CrawlResult } from './types'

const DEFAULT_MIN_DELAY_MS = 2000
const DEFAULT_NAVIGATION_TIMEOUT_MS = 15_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_RETRY_BASE_DELAY_MS = 500

// Not real network fetches — a page's own inline/local resource references, never an
// SSRF vector — so they skip the SSRF check the every real http(s) request gets.
const NON_NETWORK_SCHEMES = new Set(['data:', 'blob:', 'about:'])

function realSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * S1 Crawler service. Every invariant from COMPOUND_ENGINEERING_PLAN.md §3 is enforced
 * in `capture()` itself, in this order, so none can be skipped by a caller forgetting a
 * step: SSRF check -> robots.txt check -> rate-limit wait -> navigate (with retry) ->
 * login-wall/CAPTCHA bail-out -> screenshot + hash. A rejection at any step returns a
 * typed reason rather than throwing — callers (rulebook snapshot builders) treat a
 * refusal as `insufficient` data, never as a crash. The SSRF check itself is enforced
 * TWICE: once here before `capture()` does anything, as a fast pre-flight reject with a
 * specific typed reason, and again per-request inside the browser (see `browser.ts`'s
 * `isUrlSafe`) so a redirect or a page's own subresource fetch can never bypass it —
 * a single pre-flight check on just the top-level URL was a confirmed critical gap
 * (adversarial review this session).
 */
export function createCrawler(options: CrawlerOptions = {}): Crawler {
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT
  const minDelayMs = options.minDelayPerOriginMs ?? DEFAULT_MIN_DELAY_MS
  const navigationTimeoutMs = options.navigationTimeoutMs ?? DEFAULT_NAVIGATION_TIMEOUT_MS
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
  const retryBaseDelayMs = options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS
  const now = options.now ?? (() => new Date())
  const sleep = options.sleep ?? realSleep
  const lookup = options.lookup ?? defaultDnsLookup

  const robotsFetcher: RobotsFetcher =
    options.robotsFetcher ??
    (async (origin: string) => {
      const result = await safeFetch(`${origin}/robots.txt`, { lookup })
      // Any safeFetch failure — timeout, DNS error, blocked IP, exceeding its byte cap —
      // is "couldn't verify," not "no restrictions." A real 404 is `result.ok: true`
      // (a normal HTTP response) and correctly parses as an empty rule set below.
      return result.ok ? { status: 'fetched', body: result.body } : { status: 'unavailable' }
    })
  const robotsCache = new RobotsCache(robotsFetcher)
  const rateLimiter = new RateLimiter(minDelayMs, now, sleep)

  const isUrlSafe: RequestSafetyCheck = async (urlString) => {
    let parsed: URL
    try {
      parsed = new URL(urlString)
    } catch {
      return false
    }
    if (NON_NETWORK_SCHEMES.has(parsed.protocol)) return true
    const reason = await validateUrlSafety(parsed, lookup, navigationTimeoutMs)
    return reason === null
  }

  // Only launch a real browser if the caller didn't inject their own page factory —
  // tests always inject one, so `pnpm test` never launches Chromium.
  const browserPool = options.pageFactory ? null : new BrowserPool(isUrlSafe)
  const pageFactory = options.pageFactory ?? (() => browserPool!.newPage(userAgent))

  async function capture(urlString: string): Promise<CrawlResult> {
    let url: URL
    try {
      url = new URL(urlString)
    } catch {
      return { ok: false, reason: 'invalid_url' }
    }

    const safetyReason = await validateUrlSafety(url, lookup, navigationTimeoutMs)
    if (safetyReason) {
      const reason = safetyReason.startsWith('blocked scheme') ? 'blocked_scheme' : 'ssrf_blocked'
      return { ok: false, reason, detail: safetyReason }
    }

    const robotsResult = await robotsCache.isDisallowed(url.origin, url.pathname, userAgent)
    if (robotsResult === 'unavailable') {
      return { ok: false, reason: 'robots_unavailable' }
    }
    if (robotsResult === 'blocked') {
      return { ok: false, reason: 'robots_disallowed' }
    }

    await rateLimiter.waitTurn(url.origin)

    let handle
    try {
      handle = await pageFactory()
    } catch (err) {
      // Opening a page can fail for reasons that have nothing to do with the target
      // (a crashed browser, memory/FD pressure) — this must still be a typed result,
      // not an unhandled rejection that could take down a caller looping over many
      // URLs (a confirmed gap, adversarial review this session).
      return {
        ok: false,
        reason: 'navigation_failed',
        detail: err instanceof Error ? err.message : 'failed to open a page',
      }
    }

    try {
      let navigationError: unknown
      let response: { status(): number } | null = null
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        navigationError = undefined
        try {
          response = await handle.page.goto(url.toString(), {
            waitUntil: 'domcontentloaded',
            timeout: navigationTimeoutMs,
          })
          break
        } catch (err) {
          navigationError = err
          if (attempt < maxRetries) {
            await sleep(retryBaseDelayMs * 2 ** attempt)
          }
        }
      }
      if (navigationError !== undefined || response === null) {
        return {
          ok: false,
          reason: 'navigation_failed',
          detail: navigationError instanceof Error ? navigationError.message : 'no response',
        }
      }

      const status = response.status()
      const finalUrl = handle.page.url()
      const html = await handle.page.content()

      const loginWalled =
        status === 401 || status === 403 || looksLikeLoginPath(new URL(finalUrl).pathname)
      if (loginWalled) {
        return { ok: false, reason: 'login_walled' }
      }
      if (detectsCaptcha(html)) {
        return { ok: false, reason: 'captcha_gated' }
      }

      const screenshotBuffer = await handle.page.screenshot({ fullPage: true })
      const screenshotBase64 = screenshotBuffer.toString('base64')
      const sha256 = createHash('sha256').update(html).update(screenshotBase64).digest('hex')

      const capture: Capture = {
        requestedUrl: urlString,
        finalUrl,
        fetchedAt: now().toISOString(),
        status,
        html,
        screenshotBase64,
        sha256,
      }
      return { ok: true, capture }
    } catch (err) {
      // `content()`/`screenshot()` throwing (a crashed tab, an out-of-memory renderer,
      // the browser torn down concurrently) must still return a typed result, matching
      // every other failure path here — a confirmed gap, adversarial review this session.
      return {
        ok: false,
        reason: 'navigation_failed',
        detail: err instanceof Error ? err.message : 'capture failed after navigation',
      }
    } finally {
      try {
        await handle.close()
      } catch {
        // A cleanup failure (e.g. the browser was already torn down concurrently) must
        // never override a result — success or a typed failure — the try block already
        // computed. A confirmed gap, adversarial review this session.
      }
    }
  }

  return {
    capture,
    close: async () => {
      if (browserPool) await browserPool.close()
    },
  }
}
