/**
 * S1 Crawler service (COMPOUND_ENGINEERING_PLAN.md §3): Playwright-based capture for
 * pages that need rendered DOM (JS-injected review widgets, etc.) — @ss/safe-fetch
 * remains the right tool for anything a plain fetch can read. Every invariant from the
 * plan is enforced here, not left to caller discipline: robots-aware, per-domain rate
 * limited, no login walls, no CAPTCHA evasion, public pages only.
 */
import type { RobotsFetcher } from './robots-cache'

export interface Capture {
  requestedUrl: string
  /** After following any redirects. */
  finalUrl: string
  /** ISO timestamp. */
  fetchedAt: string
  status: number
  html: string
  /** PNG, base64-encoded. */
  screenshotBase64: string
  /** SHA-256 over `html + screenshotBase64`, hex-encoded — tamper-evidence input for S6. */
  sha256: string
}

export type CrawlSkipReason =
  | 'invalid_url'
  | 'blocked_scheme'
  | 'ssrf_blocked'
  | 'robots_disallowed'
  /** robots.txt genuinely could not be fetched (timeout, DNS failure, oversized
   *  response, ...) — distinct from "fetched and it declares no restrictions." When we
   *  can't verify what robots.txt says, we don't guess "allowed." */
  | 'robots_unavailable'
  | 'login_walled'
  | 'captcha_gated'
  | 'navigation_failed'

export type CrawlResult =
  { ok: true; capture: Capture } | { ok: false; reason: CrawlSkipReason; detail?: string }

/** The minimal slice of Playwright's `Page` this package actually calls — kept narrow
 *  and structural so tests can inject a fake without importing or launching a real
 *  browser, and a real `playwright.Page` satisfies it with zero adapter code. */
export interface CrawlerPage {
  goto(
    url: string,
    options?: { waitUntil?: 'load' | 'domcontentloaded'; timeout?: number },
  ): Promise<{ status(): number } | null>
  content(): Promise<string>
  screenshot(options?: { fullPage?: boolean }): Promise<Buffer>
  url(): string
}

export interface CrawlerPageHandle {
  page: CrawlerPage
  close(): Promise<void>
}

export interface CrawlerOptions {
  /** Identifies us truthfully in our own robots.txt group and outbound requests. */
  userAgent?: string
  /** Minimum delay between two requests to the same origin. Default 2000ms. */
  minDelayPerOriginMs?: number
  /** Per-navigation timeout. Default 15000ms. */
  navigationTimeoutMs?: number
  /** Navigation retries on transient (thrown) failures. Default 2. */
  maxRetries?: number
  /** Base for exponential backoff between retries. Default 500ms. */
  retryBaseDelayMs?: number
  /** Injectable clock — never read the system clock directly, for deterministic tests. */
  now?: () => Date
  /** Injectable sleep — real timers in production, instant/no-op in tests. */
  sleep?: (ms: number) => Promise<void>
  /** Injectable DNS resolution, passed straight through to @ss/safe-fetch's IP-blocklist check. */
  lookup?: (hostname: string) => Promise<string[]>
  /** Injectable robots.txt fetcher — real (SSRF-safe) fetch by default. */
  robotsFetcher?: RobotsFetcher
  /** Produces a fresh page (and its cleanup) for one capture — real Playwright by default. */
  pageFactory?: () => Promise<CrawlerPageHandle>
}

export interface Crawler {
  capture(url: string): Promise<CrawlResult>
  /** Releases the underlying browser, if one was launched. Safe to call even if it wasn't. */
  close(): Promise<void>
}
