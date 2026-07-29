import { chromium, type Browser } from 'playwright'
import type { CrawlerPageHandle } from './types'

export const DEFAULT_USER_AGENT = 'SimpleSense-Crawler/0.1 (+https://simplesense.co)'

/** Whether a single outgoing request (main navigation, a redirect hop, or a
 *  subresource the page's own JS/markup issues) is safe to let through. */
export type RequestSafetyCheck = (url: string) => Promise<boolean>

/**
 * Lazily launches ONE headless Chromium instance (expensive) reused across every
 * `capture()` call on a `Crawler`, but hands back a fresh, cookie-less `BrowserContext`
 * per capture (cheap) — no session/cookie ever carries between captures, so this can
 * never accidentally ride an authenticated session into a page it shouldn't see. This
 * is the ONLY file in the package that imports `playwright` directly; everything else
 * depends on the structural `CrawlerPage` interface so tests never launch a real browser.
 *
 * Every request the page issues — the main navigation, EVERY redirect hop, and every
 * subresource fetch (img/script/xhr/fetch a review-widget's own JS makes) — is routed
 * through `isUrlSafe` before Chromium's network stack ever touches it. A single
 * pre-navigation check on the top-level URL (this package's first version) left a
 * critical gap: Chromium follows redirects and loads subresources entirely on its own,
 * and neither ever passed back through that one check — confirmed via adversarial
 * review this session.
 */
export class BrowserPool {
  private browser: Browser | null = null
  private launching: Promise<Browser> | null = null

  constructor(private readonly isUrlSafe: RequestSafetyCheck) {}

  private ensureBrowser(): Promise<Browser> {
    if (this.browser) return Promise.resolve(this.browser)
    // Cache the LAUNCH PROMISE itself, not just the eventual browser — two concurrent
    // calls before the first launch resolves must share one Chromium process, not each
    // start their own (the second would be launched and then never referenced again,
    // leaking a real OS process for the life of this Node process — a real bug this
    // session found via adversarial review).
    if (!this.launching) {
      this.launching = chromium.launch({ headless: true }).then((browser) => {
        this.browser = browser
        return browser
      })
    }
    return this.launching
  }

  async newPage(userAgent: string): Promise<CrawlerPageHandle> {
    const browser = await this.ensureBrowser()
    const context = await browser.newContext({ userAgent })
    try {
      await context.route('**/*', async (route) => {
        const safe = await this.isUrlSafe(route.request().url())
        if (safe) {
          await route.continue()
        } else {
          await route.abort('blockedbyclient')
        }
      })
      const page = await context.newPage()
      return {
        page,
        close: async () => {
          await context.close()
        },
      }
    } catch (err) {
      // `context.newPage()` (or `route()`) throwing after `newContext()` already
      // succeeded must not leak the context — a real bug this session found via
      // adversarial review (the context was reachable only via a local variable that
      // would otherwise go out of scope with nothing left to close it).
      await context.close()
      throw err
    }
  }

  async close(): Promise<void> {
    // Must wait for an in-flight launch rather than no-op — otherwise a `close()` that
    // races a concurrent first `newPage()` can see `this.browser` still null, do
    // nothing, and leak the browser that finishes launching moments later with no
    // remaining reference to it (a real bug this session found via adversarial review).
    if (this.launching) {
      const browser = await this.launching
      await browser.close()
      this.browser = null
      this.launching = null
      return
    }
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}
