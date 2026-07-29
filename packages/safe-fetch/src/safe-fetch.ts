import { promises as dns } from 'node:dns'
import { isIP } from 'node:net'
import { isBlockedIp } from './ip-blocklist'
import type { SafeFetchOptions, SafeFetchResult } from './types'

const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_MAX_REDIRECTS = 3
const DEFAULT_MAX_BYTES = 2_000_000
const ALLOWED_PORTS = new Set(['', '80', '443'])

/** Real DNS resolution — the default `lookup` for both `safeFetch` and any other
 *  caller of `validateUrlSafety` (the S1 crawler) that doesn't inject its own. */
export async function defaultDnsLookup(hostname: string): Promise<string[]> {
  const results = await dns.lookup(hostname, { all: true })
  return results.map((r) => r.address)
}

function stripBrackets(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname
}

/**
 * Races a promise against a deadline. `dns.promises.lookup` (and any injected
 * `lookup`) has no native cancellation, so this bounds the CALLER's visible wait
 * rather than truly aborting the underlying OS-level query — enough to keep
 * `safeFetch`'s own timeout budget honest, which is the actual goal (a slow/adversarial
 * DNS server for an attacker-chosen hostname shouldn't be able to stall the scanner
 * past its configured timeout).
 */
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/**
 * Validates a URL is safe to fetch: http(s) only, a standard port, and — the actual
 * SSRF defense — every address the hostname resolves to is checked against the IP
 * blocklist (`ip-blocklist.ts`) BEFORE any request is made. Returns a reason string on
 * rejection, or null when clear to fetch. Exported (not just used internally by
 * `safeFetch`) so other callers that need the SAME network-layer validation without
 * `fetch()`'s own request/response cycle — the S1 crawler's Playwright navigation,
 * specifically — get it from one place rather than a second copy.
 *
 * Known v0 limitation, documented rather than silently accepted: this validates DNS
 * resolution, then lets the caller's own connection (Node's `fetch()`, or Playwright's
 * navigation) resolve the SAME hostname again to actually connect — a narrow
 * DNS-rebinding TOCTOU window between the two resolutions. Closing it fully means
 * pinning the connection to the pre-validated IP, which needs a dispatcher/proxy API
 * beyond what's worth adding for a v0 scanner. See PARKING_LOT.md.
 */
export async function validateUrlSafety(
  url: URL,
  lookup: (hostname: string) => Promise<string[]>,
  timeoutMs: number,
): Promise<string | null> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return `blocked scheme: ${url.protocol}`
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    return `blocked port: ${url.port}`
  }
  const hostname = stripBrackets(url.hostname)
  if (isIP(hostname)) {
    return isBlockedIp(hostname) ? `blocked IP literal: ${hostname}` : null
  }
  let addresses: string[]
  try {
    addresses = await withTimeout(lookup(hostname), timeoutMs, 'DNS resolution timed out')
  } catch (err) {
    return err instanceof Error && err.message === 'DNS resolution timed out'
      ? err.message
      : `DNS resolution failed for: ${hostname}`
  }
  if (addresses.length === 0) return `DNS resolution returned no addresses for: ${hostname}`
  const blocked = addresses.find((a) => isBlockedIp(a))
  return blocked ? `${hostname} resolves to a blocked address: ${blocked}` : null
}

/**
 * SSRF-safe single-page fetch for M2 AgentReady's static rubric checks (schema.org,
 * policy text, robots.txt) — NOT the full S1 crawler (no JS rendering, no politeness
 * loop, no snapshot store). Every hop, including redirects, is re-validated against the
 * IP blocklist before being followed; response size and total time are capped.
 */
export async function safeFetch(
  urlString: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const lookup = options.lookup ?? defaultDnsLookup

  let currentUrl: URL
  try {
    currentUrl = new URL(urlString)
  } catch {
    return { ok: false, reason: 'invalid URL' }
  }

  const deadline = Date.now() + timeoutMs

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const beforeValidate = deadline - Date.now()
    if (beforeValidate <= 0) return { ok: false, reason: 'timed out' }

    const invalidReason = await validateUrlSafety(currentUrl, lookup, beforeValidate)
    if (invalidReason) return { ok: false, reason: invalidReason }

    const remaining = deadline - Date.now()
    if (remaining <= 0) return { ok: false, reason: 'timed out' }

    let response: Response
    try {
      response = await fetch(currentUrl, {
        redirect: 'manual',
        signal: AbortSignal.timeout(remaining),
        headers: { 'user-agent': 'SimpleSense-AgentReady-Scanner/0.1 (+https://simplesense.co)' },
      })
    } catch (err) {
      return { ok: false, reason: err instanceof Error ? err.message : 'fetch failed' }
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) return { ok: false, reason: 'redirect with no Location header' }
      try {
        currentUrl = new URL(location, currentUrl)
      } catch {
        return { ok: false, reason: 'redirect to an invalid URL' }
      }
      continue
    }

    let bodyResult: Awaited<ReturnType<typeof readCapped>>
    try {
      bodyResult = await readCapped(response, maxBytes)
    } catch (err) {
      return {
        ok: false,
        reason: err instanceof Error ? err.message : 'error reading response body',
      }
    }
    if (!bodyResult.ok) return bodyResult

    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })
    return {
      ok: true,
      status: response.status,
      headers,
      body: bodyResult.body,
      finalUrl: currentUrl.toString(),
    }
  }

  return { ok: false, reason: 'too many redirects' }
}

async function readCapped(
  response: Response,
  maxBytes: number,
): Promise<{ ok: true; body: string } | { ok: false; reason: string }> {
  const reader = response.body?.getReader()
  if (!reader) return { ok: true, body: '' }
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      return { ok: false, reason: `response exceeded ${maxBytes} bytes` }
    }
    chunks.push(value)
  }
  return { ok: true, body: Buffer.concat(chunks).toString('utf8') }
}
