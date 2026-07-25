export type NormalizeScanUrlResult = { ok: true; url: string } | { ok: false; error: string }

/**
 * Turns whatever a visitor types into the free-scanner box ("shop.example.com",
 * "www.shop.com/products/x") into a well-formed http(s) URL, or a clear error. Pure —
 * no I/O; `safeFetch` (which the caller runs next) is what actually enforces the
 * SSRF/scheme/port rules — this is just "did the user give us something URL-shaped."
 */
export function normalizeScanUrl(raw: string): NormalizeScanUrlResult {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'Enter a product page URL to scan.' }
  // Only prepend a scheme when none is present at all — a non-http(s) scheme (ftp://,
  // javascript:, etc.) must reach the protocol check below and be rejected there with
  // a clear reason, not get "https://" glued onto its front into a garbled URL.
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http:// and https:// URLs can be scanned.' }
  }
  if (!url.hostname.includes('.')) {
    return { ok: false, error: "That doesn't look like a valid URL." }
  }
  return { ok: true, url: url.toString() }
}
