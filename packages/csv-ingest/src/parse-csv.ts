/**
 * Minimal RFC4180 CSV parser — no third-party dependency (S2 default call, parked in
 * PARKING_LOT.md). Handles: quoted fields, commas/newlines inside quoted fields,
 * `""` as an escaped quote, CRLF/LF line endings, and a leading UTF-8 BOM. Rejects
 * nothing — a malformed row still parses to *some* string array; validating field
 * count/content against a schema is the caller's job (see `sniff.ts`).
 */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  const n = src.length

  const endField = () => {
    row.push(field)
    field = ''
  }
  const endRow = () => {
    endField()
    rows.push(row)
    row = []
  }

  while (i < n) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += c
      i += 1
      continue
    }
    if (c === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (c === ',') {
      endField()
      i += 1
      continue
    }
    if (c === '\r') {
      if (src[i + 1] === '\n') i += 1
      endRow()
      i += 1
      continue
    }
    if (c === '\n') {
      endRow()
      i += 1
      continue
    }
    field += c
    i += 1
  }
  // Final field/row, unless the file ended cleanly on a line break (nothing pending).
  if (field.length > 0 || row.length > 0) endRow()

  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}
