import type { Analyzer, Metric } from '../types'
import { ordersInWindow, windowLabel, netRevenue } from '../window'
import { metric, insufficient } from '../metrics'
import { sum, roundTo } from '../math'
import { haversineMiles, hasCoords, regionLabel } from '../geo'

const RADIUS_MI = 5

/**
 * Geographic concentration. Computes region concentration always, then BRANCHES on
 * store type (Prime Directive #1 + §1.4):
 *  - physical locations → trade-area share within N miles + multi-store overlap, with
 *    a BOPIS/foot-traffic action context.
 *  - online-only → top zip-cluster share with a regional-inventory/offer context.
 * `has_physical_locations` is recorded on the share metrics so Stage 3 picks the
 * correct action and never tells an online-only store to drive foot traffic.
 */
export const geographyAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const orders = ordersInWindow(ctx)
  const out: Metric[] = []

  const locationsWithCoords = ctx.store.locations.filter(hasCoords)
  const hasPhysical = ctx.store.hasPhysicalLocations && locationsWithCoords.length > 0
  out.push(metric('geo.has_physical_locations', hasPhysical ? 1 : 0, { unit: 'bool', window: win }))

  // --- region concentration (store-type agnostic) ---
  const byRegion = new Map<string, number>()
  let totalRev = 0
  for (const o of orders) {
    const rev = netRevenue(o)
    if (rev <= 0) continue
    totalRev += rev
    const r = regionLabel(o.shippingAddress)
    byRegion.set(r, (byRegion.get(r) ?? 0) + rev)
  }

  if (totalRev <= 0) {
    out.push(
      insufficient('geo.single_region_share', 'no shipped revenue in window', {
        unit: 'ratio',
        window: win,
      }),
    )
    return out
  }

  const sortedRegions = [...byRegion.entries()].sort((a, b) => b[1] - a[1])
  const top = sortedRegions[0]
  if (top) {
    out.push(
      metric('geo.single_region_share', roundTo(top[1] / totalRev, 4), {
        unit: 'ratio',
        window: win,
        valueJson: { region: top[0], has_physical_locations: hasPhysical },
      }),
    )
  }
  out.push(metric('geo.region_count', sortedRegions.length, { unit: 'count', window: win }))

  // --- branch ---
  if (hasPhysical) {
    let withCoordsRev = 0
    let withinRev = 0
    let overlapRev = 0 // revenue within radius of >= 2 stores (trade-area overlap)
    for (const o of orders) {
      const rev = netRevenue(o)
      if (rev <= 0) continue
      const addr = o.shippingAddress
      if (!hasCoords(addr)) continue
      withCoordsRev += rev
      const distances = locationsWithCoords.map((loc) => haversineMiles(addr, loc) ?? Infinity)
      const nearCount = distances.filter((d) => d <= RADIUS_MI).length
      if (nearCount >= 1) withinRev += rev
      if (nearCount >= 2) overlapRev += rev
    }
    if (withCoordsRev <= 0) {
      out.push(
        insufficient('geo.within_5mi_revenue_share', 'no geocoded orders to compute trade area', {
          unit: 'ratio',
          window: win,
        }),
      )
    } else {
      out.push(
        metric('geo.within_5mi_revenue_share', roundTo(withinRev / withCoordsRev, 4), {
          unit: 'ratio',
          window: win,
          valueJson: {
            radius_miles: RADIUS_MI,
            has_physical_locations: true,
            action_type: 'bopis',
          },
        }),
      )
      if (locationsWithCoords.length >= 2) {
        out.push(
          metric('geo.trade_area_overlap_share', roundTo(overlapRev / withCoordsRev, 4), {
            unit: 'ratio',
            window: win,
            valueJson: { radius_miles: RADIUS_MI, store_count: locationsWithCoords.length },
          }),
        )
      }
    }
  } else {
    const byZip = new Map<string, number>()
    let zipRev = 0
    for (const o of orders) {
      const rev = netRevenue(o)
      if (rev <= 0) continue
      const zip = o.shippingAddress?.zip
      if (!zip) continue
      zipRev += rev
      byZip.set(zip, (byZip.get(zip) ?? 0) + rev)
    }
    if (zipRev <= 0) {
      out.push(
        insufficient('geo.top_zip_cluster_share', 'no zip-coded orders in window', {
          unit: 'ratio',
          window: win,
        }),
      )
    } else {
      const sortedZips = [...byZip.entries()].sort((a, b) => b[1] - a[1])
      const top3 = sortedZips.slice(0, 3)
      out.push(
        metric('geo.top_zip_cluster_share', roundTo(sum(top3.map((z) => z[1])) / zipRev, 4), {
          unit: 'ratio',
          window: win,
          valueJson: {
            zips: top3.map((z) => z[0]),
            has_physical_locations: false,
            action_type: 'regional_inventory',
          },
        }),
      )
    }
  }

  return out
}
