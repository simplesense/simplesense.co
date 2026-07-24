/**
 * Header alias matching ("schema sniffing", S2 spec). Real-world exports vary column
 * names (Shopify's own docs vs. a returns app vs. a manually re-saved spreadsheet) —
 * this matches case/whitespace-insensitively against a list of known aliases per
 * canonical field, rather than assuming one exact header string.
 */
function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Maps each canonical field to the column index of its first matching alias, if any. */
export function sniffHeader<TField extends string>(
  header: string[],
  aliases: Record<TField, string[]>,
): Partial<Record<TField, number>> {
  const normalized = header.map(normalizeHeader)
  const result: Partial<Record<TField, number>> = {}
  for (const field of Object.keys(aliases) as TField[]) {
    for (const alias of aliases[field]) {
      const idx = normalized.indexOf(normalizeHeader(alias))
      if (idx !== -1) {
        result[field] = idx
        break
      }
    }
  }
  return result
}

/** Reads a sniffed column's raw value for one row, or '' if the column wasn't found. */
export function cell(row: string[], colIndex: number | undefined): string {
  if (colIndex === undefined) return ''
  return (row[colIndex] ?? '').trim()
}

/** Parses a currency-ish string ("1,234.50", "$12") into a number, or null if empty/invalid. */
export function parseAmount(raw: string): number | null {
  if (raw === '') return null
  const cleaned = raw.replace(/[$,]/g, '').trim()
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** Parses an integer quantity, or null if empty/invalid. */
export function parseQuantity(raw: string): number | null {
  if (raw === '') return null
  const n = Number(raw.trim())
  return Number.isInteger(n) ? n : null
}
