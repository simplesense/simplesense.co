/**
 * Content-level bail-out checks — separate from the SSRF network-layer defenses in
 * ip-blocklist.ts, but the same spirit: a scanner should refuse to push past a page
 * that clearly doesn't want automated access, not try to work around it. Shared by
 * M2 AgentReady's static-fetch rubric and the S1 crawler's own capture bail-out, so
 * one definition, checked here once, rather than two copies drifting apart.
 */

const CAPTCHA_MARKERS = [
  'recaptcha',
  'hcaptcha', // covers hcaptcha.com script src
  'h-captcha', // covers the widget's actual CSS class (h-captcha, not hcaptcha)
  'cf-turnstile',
  'turnstile.js',
  'arkoselabs',
  'funcaptcha',
]

/** Whether the page embeds a known CAPTCHA widget — checked before any JS executes. */
export function detectsCaptcha(html: string): boolean {
  const lower = html.toLowerCase()
  return CAPTCHA_MARKERS.some((marker) => lower.includes(marker))
}

const LOGIN_PATH_PATTERN = /\b(login|sign[-_]?in|account\/login)\b/i

/** Whether a URL path looks like a login page by naming convention — a weak signal on
 *  its own, meant to be OR'd with a real signal (401/403 status, etc.) by the caller. */
export function looksLikeLoginPath(pathname: string): boolean {
  return LOGIN_PATH_PATTERN.test(pathname)
}
