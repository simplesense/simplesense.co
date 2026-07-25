/**
 * Narrow, regex-based HTML helpers for M2 AgentReady's static rubric — NOT a general
 * HTML parser (that would be a new dependency, D5; see PARKING_LOT.md for the default
 * call to avoid one here too, matching @ss/csv-ingest's hand-written parser). Each
 * function does exactly one bounded extraction the rubric needs, and is honest about
 * its limits in its own doc comment rather than pretending to be a real DOM.
 */

/** Every `<script type="application/ld+json">...</script>` block, parsed as JSON. Silently drops blocks that don't parse — a malformed JSON-LD block is itself evidence of bad structured data, surfaced by the rule finding none valid, not by throwing here. */
export function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]!.trim()))
    } catch {
      // malformed block — skip, don't crash the scan over one bad script tag
    }
  }
  return blocks
}

/**
 * Flattens a JSON-LD block into every object carrying an `@type`, recursing through
 * `@graph` arrays and nested objects (schema.org allows both). Returns objects only —
 * primitive `@type` string arrays aren't expanded further.
 */
export function flattenJsonLdTypes(blocks: unknown[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  function walk(node: unknown) {
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      if ('@type' in obj) out.push(obj)
      if (Array.isArray(obj['@graph'])) walk(obj['@graph'])
      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') walk(value)
      }
    }
  }
  blocks.forEach(walk)
  return out
}

/** True when a JSON-LD node's `@type` is (or includes) the given schema.org type name. */
export function hasType(node: Record<string, unknown>, typeName: string): boolean {
  const t = node['@type']
  if (typeof t === 'string') return t === typeName
  if (Array.isArray(t)) return t.includes(typeName)
  return false
}

/** Strips tags/scripts/styles to approximate visible text length — a heuristic, not real rendering. */
export function visibleTextLength(html: string): number {
  const withoutScriptsStyles = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  const text = withoutScriptsStyles
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length
}

export interface HtmlLink {
  href: string
  text: string
}

/** Every `<a href="...">text</a>` in the document, href/text minimally cleaned. */
export function extractLinks(html: string): HtmlLink[] {
  const links: HtmlLink[] = []
  const re = /<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    const text = match[2]!
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    links.push({ href: match[1]!, text })
  }
  return links
}

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
