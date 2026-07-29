/**
 * Narrow, regex-based JSON-LD extraction — NOT a general HTML parser (that would be a
 * new dependency, D5; matches @ss/csv-ingest's own hand-written-parser precedent).
 * Shared across integration modules that read structured data out of captured HTML
 * (M2 AgentReady's Product schema, M3 ReviewProof's Review/AggregateRating schema) —
 * one extractor, not a copy per module.
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
 * primitive `@type` string arrays aren't expanded further. `@graph` needs no special
 * case: it's an array-valued property like any other, so the generic value-walk below
 * already reaches it — an earlier version of this function walked it explicitly TOO,
 * silently double-counting every node inside `@graph` (a real bug this comment
 * documents so it doesn't come back: this function is a count-then-filter input for
 * M3 ReviewProof's review-timing rule, where a doubled count is a wrong dollar figure,
 * not just a cosmetic duplicate).
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
