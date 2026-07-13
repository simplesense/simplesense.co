/**
 * Client-side mirror of @ss/integrations normalizeShop (trim/lowercase/strip protocol+path),
 * plus bare-name completion: "mystore" → "mystore.myshopify.com". The server still re-validates
 * with isValidShopDomain, so this is UX polish, not a security boundary.
 */
export function normalizeShopInput(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
  if (!s) return s
  return s.includes('.') ? s : `${s}.myshopify.com`
}
