import { describe, it, expect } from 'vitest'
import { paretoAnalyzer } from '../../src/analyzers/pareto'
import { geographyAnalyzer } from '../../src/analyzers/geography'
import { ctxOf, order, customer, location, addr, num, findMetric } from '../factory'

describe('paretoAnalyzer', () => {
  it('computes top-share concentration with hand-verified answers', () => {
    // 10 customers, one order each; revenues sum to 2000.
    const revenues = [800, 600, 200, 120, 90, 70, 50, 30, 25, 15]
    const customers = revenues.map((_, i) => customer({ id: `c${i + 1}` }))
    const orders = revenues.map((rev, i) =>
      order({ id: `o${i}`, customerId: `c${i + 1}`, totalPrice: rev }),
    )
    const metrics = paretoAnalyzer(ctxOf({ customers, orders }))

    expect(num(metrics, 'pareto.customer_count')).toBe(10)
    expect(num(metrics, 'pareto.revenue_total')).toBe(2000)
    // top 20% = top 2 customers = 1400 / 2000 = 0.7
    expect(num(metrics, 'pareto.top20_revenue_share')).toBe(0.7)
    // top 10% = top 1 customer = 800 / 2000 = 0.4
    expect(num(metrics, 'pareto.top10_revenue_share')).toBe(0.4)
    expect(num(metrics, 'pareto.top20_customer_count')).toBe(2)
  })

  it('emits insufficient-data below the customer floor', () => {
    const customers = [1, 2, 3, 4].map((i) => customer({ id: `c${i}` }))
    const orders = customers.map((c, i) =>
      order({ id: `o${i}`, customerId: c.id, totalPrice: 100 }),
    )
    const metrics = paretoAnalyzer(ctxOf({ customers, orders }))
    const m = findMetric(metrics, 'pareto.top20_revenue_share')
    expect(m.valueNumeric).toBeNull()
    expect(m.insufficientData).toBe(true)
  })
})

describe('geographyAnalyzer — omnichannel (physical locations)', () => {
  it('computes trade-area share within 5 miles and flags has_physical_locations', () => {
    const loc = location({ id: 'l1', name: 'Flagship', lat: 0, lng: 0 })
    // ~3.46mi away (in radius): lng 0.05; ~6.9mi (out): lng 0.1; far: 10,10
    const near = addr({ region: 'CA', lat: 0, lng: 0.05 })
    const farCA = addr({ region: 'CA', lat: 0, lng: 0.1 })
    const farNY = addr({ region: 'NY', lat: 10, lng: 10 })
    const orders = [
      order({ id: 'a1', customerId: 'c1', totalPrice: 200, shippingAddress: near }),
      order({ id: 'a2', customerId: 'c2', totalPrice: 200, shippingAddress: near }),
      order({ id: 'a3', customerId: 'c3', totalPrice: 200, shippingAddress: near }),
      order({ id: 'a4', customerId: 'c4', totalPrice: 200, shippingAddress: near }),
      order({ id: 'a5', customerId: 'c5', totalPrice: 100, shippingAddress: farCA }),
      order({ id: 'a6', customerId: 'c6', totalPrice: 100, shippingAddress: farNY }),
    ]
    const metrics = geographyAnalyzer(
      ctxOf({ hasPhysicalLocations: true, locations: [loc], orders }),
    )

    expect(num(metrics, 'geo.has_physical_locations')).toBe(1)
    // CA = 800+100 = 900 of 1000 total
    expect(num(metrics, 'geo.single_region_share')).toBe(0.9)
    // within radius: 4x200 = 800 of 1000 geocoded
    expect(num(metrics, 'geo.within_5mi_revenue_share')).toBe(0.8)
    const share = findMetric(metrics, 'geo.within_5mi_revenue_share')
    expect((share.valueJson as { action_type: string }).action_type).toBe('bopis')

    // region breakdown persists every region's share of located revenue, ranked
    const breakdown = findMetric(metrics, 'geo.region_breakdown')
    const regions = (breakdown.valueJson as { regions: { region: string; revenueShare: number }[] })
      .regions
    expect(regions).toEqual([
      { region: 'CA', revenueShare: 0.9 },
      { region: 'NY', revenueShare: 0.1 },
    ])
  })

  it('computes trade-area overlap with two stores', () => {
    const l1 = location({ id: 'l1', lat: 0, lng: 0 })
    const l2 = location({ id: 'l2', lat: 0, lng: 0.06 }) // ~4.1mi from l1
    // point at lng 0.03 is ~2.07mi from l1 AND ~2.07mi from l2 → overlap
    const overlap = addr({ region: 'CA', lat: 0, lng: 0.03 })
    const orders = [
      order({ id: 'o1', customerId: 'c1', totalPrice: 100, shippingAddress: overlap }),
    ]
    const metrics = geographyAnalyzer(
      ctxOf({ hasPhysicalLocations: true, locations: [l1, l2], orders }),
    )
    expect(num(metrics, 'geo.trade_area_overlap_share')).toBe(1)
  })
})

describe('geographyAnalyzer — online-only', () => {
  it('computes top zip-cluster share with a regional action and no foot-traffic', () => {
    const mk = (zip: string, rev: number, id: string) =>
      order({ id, customerId: id, totalPrice: rev, shippingAddress: addr({ region: 'CA', zip }) })
    const orders = [
      mk('10001', 300, 'o1'),
      mk('10001', 100, 'o2'),
      mk('90210', 300, 'o3'),
      mk('60601', 200, 'o4'),
      mk('30301', 100, 'o5'),
    ]
    const metrics = geographyAnalyzer(ctxOf({ hasPhysicalLocations: false, orders }))
    expect(num(metrics, 'geo.has_physical_locations')).toBe(0)
    // top 3 zips: 400 + 300 + 200 = 900 of 1000
    expect(num(metrics, 'geo.top_zip_cluster_share')).toBe(0.9)
    const m = findMetric(metrics, 'geo.top_zip_cluster_share')
    expect((m.valueJson as { action_type: string }).action_type).toBe('regional_inventory')
  })
})
