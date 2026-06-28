import type { Address } from './types'

const EARTH_RADIUS_MI = 3958.7613

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Great-circle distance in miles between two lat/lng points (Haversine).
 * Pure and deterministic. Returns null if either point lacks coordinates.
 */
export function haversineMiles(
  a: { lat?: number | null; lng?: number | null },
  b: { lat?: number | null; lng?: number | null },
): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** True when the address carries usable coordinates. */
export function hasCoords(addr?: Address | null): addr is Address & { lat: number; lng: number } {
  return addr != null && addr.lat != null && addr.lng != null
}

/** A coarse region label for grouping (region, else country, else "unknown"). */
export function regionLabel(addr?: Address | null): string {
  if (!addr) return 'unknown'
  return addr.region || addr.country || 'unknown'
}
