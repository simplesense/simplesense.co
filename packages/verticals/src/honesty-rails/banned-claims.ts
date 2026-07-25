/**
 * §2.1's banned-claims lint: fabricated-social-proof patterns that have no place under
 * `/for/*` — there are no customers yet, so there is nothing true to say in this shape.
 * Revisit this list when real customers exist (per the addendum itself).
 */
const BANNED_PATTERNS: RegExp[] = [
  /trusted by/i,
  /loved by/i,
  /\b\d+[,\d]*\+?\s*brands?\s+use/i,
  /join\s+\d/i,
  /★{2,}|☆{2,}/,
  /\b[1-5](\.\d)?\s*(out of|\/)\s*5\s*stars?\b/i,
  /"[^"]{15,}"\s*[-—]\s*[A-Z][a-z]+ [A-Z]/, // a quoted testimonial attributed to "Firstname L."
  /as (seen|featured) in/i,
]

/** Returns the matched banned phrases found in `text`, or an empty array if clean. */
export function findBannedClaims(text: string): string[] {
  const hits: string[] = []
  for (const pattern of BANNED_PATTERNS) {
    const match = text.match(pattern)
    if (match) hits.push(match[0])
  }
  return hits
}
