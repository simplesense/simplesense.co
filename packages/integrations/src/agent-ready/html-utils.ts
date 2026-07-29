/**
 * Narrow, regex-based HTML helpers for M2 AgentReady's static rubric — NOT a general
 * HTML parser (that would be a new dependency, D5; see PARKING_LOT.md for the default
 * call to avoid one here too, matching @ss/csv-ingest's hand-written parser). Each
 * function does exactly one bounded extraction the rubric needs, and is honest about
 * its limits in its own doc comment rather than pretending to be a real DOM.
 */

/** Re-exported so existing call sites (`from './html-utils'`) don't change — the real
 *  definition now lives in @ss/safe-fetch, shared with the S1 crawler's own bail-out. */
export { detectsCaptcha } from '@ss/safe-fetch'

/** Re-exported so existing call sites (`from './html-utils'`) don't change — the real
 *  definitions now live in ../json-ld, shared with M3 ReviewProof's Review/AggregateRating extraction. */
export { extractJsonLd, flattenJsonLdTypes, hasType } from '../json-ld'

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
