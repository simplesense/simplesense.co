import type { Analyzer, Metric } from '../types'
import { ordersInWindow, windowLabel, netRevenue } from '../window'
import { metric, insufficient } from '../metrics'
import { sum, roundTo } from '../math'
import { haversineMiles, hasCoords, regionLabel } from '../geo'

const RADIUS_MI = 5

/**
 * Geographic concentration. Computes region concentration over LOCATED revenue only
 * (orders with a known region) and reports the unlocatable fraction separately so a
 * POS-heavy store's missing ship-to data never masquerades as a geographic "unknown"
 * cluster. Then BRANCHES on store type (§1.4):
 *  - physical → trade-area share within N miles + multi-store overlap (BOPIS context),
 *    with the geocoded-revenue fraction emitted so the share is honestly qualified.
 *  - online-only → top zip-cluster share (regional-inventory context).
 * `has_physical_locations` is recorded on the share metrics so Stage 3 never tells an
 * online-only store to drive foot traffic (Prime Directive #1).
 */
export const geographyAnalyzer: Analyzer = (ctx) => {
  const win = windowLabel(ctx)
  const orders = ordersInWindow(ctx)
  const out: Metric[] = []

  const locationsWithCoords = ctx.store.locations.filter(hasCoords)
  const hasPhysical = ctx.store.hasPhysicalLocations && locationsWithCoords.length > 0
  out.push(metric('geo.has_physical_locations', hasPhysical ? 1 : 0, { unit: 'bool', window: win }))

  // --- region concentration over LOCATED revenue only ---
  const byRegion = new Map<string, number>()
  let allRev = 0
  let regionRev = 0
  for (const o of orders) {
    const rev = netRevenue(o)
    if (rev <= 0) continue
    allRev += rev
    const r = regionLabel(o.shippingAddress)
    if (r === 'unknown') continue
    regionRev += rev
    byRegion.set(r, (byRegion.get(r) ?? 0) + rev)
  }

  if (allRev <= 0) {
    out.push(
      insufficient('geo.single_region_share', 'no shipped revenue in window', {
        unit: 'ratio',
        window: win,
      }),
    )
    return out
  }

  out.push(
    metric('geo.unlocatable_revenue_fraction', roundTo((allRev - regionRev) / allRev, 4), {
      unit: 'ratio',
      window: win,
    }),
  )

  const sortedRegions = [...byRegion.entries()].sort((a, b) => b[1] - a[1])
  const top = sortedRegions[0]
  if (!top || regionRev <= 0) {
    out.push(
      insufficient('geo.single_region_share', 'no orders carry a region/ship-to', {
        unit: 'ratio',
        window: win,
      }),
    )
  } else {
    out.push(
      metric('geo.single_region_share', roundTo(top[1] / regionRev, 4), {
        unit: 'ratio',
        window: win,
        valueJson: {
          region: top[0],
          has_physical_locations: hasPhysical,
          basis: 'located_revenue',
        },
      }),
    )
    out.push(metric('geo.region_count', sortedRegions.length, { unit: 'count', window: win }))
    // Persist the top regions' shares of located revenue so the UI can chart the real
    // distribution (not just the #1). Additive evidence; shares sum over located revenue.
    out.push(
      metric('geo.region_breakdown', sortedRegions.length, {
        unit: 'count',
        window: win,
        valueJson: {
          basis: 'located_revenue',
          regions: sortedRegions.slice(0, 8).map(([region, rev]) => ({
            region,
            revenueShare: roundTo(rev / regionRev, 4),
          })),
        },
      }),
    )
  }

  // --- branch ---
  if (hasPhysical) {
    let withCoordsRev = 0
    let geocodedOrders = 0
    let withinRev = 0
    let overlapRev = 0
    let revenueOrders = 0
    for (const o of orders) {
      const rev = netRevenue(o)
      if (rev <= 0) continue
      revenueOrders++
      const address = o.shippingAddress
      if (!hasCoords(address)) continue
      withCoordsRev += rev
      geocodedOrders++
      const distances = locationsWithCoords.map((loc) => haversineMiles(address, loc) ?? Infinity)
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
      // qualifier: how much of total revenue we could actually place on a map
      out.push(
        metric('geo.geocoded_revenue_fraction', roundTo(withCoordsRev / allRev, 4), {
          unit: 'ratio',
          window: win,
          valueJson: { geocoded_order_count: geocodedOrders, revenue_order_count: revenueOrders },
        }),
      )
      out.push(
        metric('geo.within_5mi_revenue_share', roundTo(withinRev / withCoordsRev, 4), {
          unit: 'ratio',
          window: win,
          valueJson: {
            radius_miles: RADIUS_MI,
            has_physical_locations: true,
            action_type: 'bopis',
            basis: 'geocoded_revenue',
          },
        }),
      )
      if (locationsWithCoords.length >= 2) {
        out.push(
          metric('geo.trade_area_overlap_share', roundTo(overlapRev / withCoordsRev, 4), {
            unit: 'ratio',
            window: win,
            valueJson: {
              radius_miles: RADIUS_MI,
              store_count: locationsWithCoords.length,
              basis: 'geocoded_revenue',
            },
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
            basis: 'zip_coded_revenue',
          },
        }),
      )
    }
  }

  return out
}
