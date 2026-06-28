import { describe, it, expect } from 'vitest'
import type { Metric } from '../src/types'
import type { Signal, SignalType } from '../src/signals'
import { detectSignals } from '../src/signals'
import { runAnalyzers } from '../src/analyzers/run'
import { ctxOf, order, customer, location, addr } from './factory'

const M = (key: string, valueNumeric: number, valueJson?: unknown): Metric => ({
  key,
  valueNumeric,
  valueJson,
})
const has = (signals: Signal[], type: SignalType) => signals.some((s) => s.type === type)
const get = (signals: Signal[], type: SignalType) => signals.find((s) => s.type === type)

describe('detectSignals — threshold boundaries', () => {
  it('vip_pareto fires just over, not just under, 0.65', () => {
    expect(has(detectSignals([M('pareto.top20_revenue_share', 0.651)]), 'vip_pareto')).toBe(true)
    expect(has(detectSignals([M('pareto.top20_revenue_share', 0.649)]), 'vip_pareto')).toBe(false)
    // exactly at threshold → not noteworthy (strictly greater)
    expect(has(detectSignals([M('pareto.top20_revenue_share', 0.65)]), 'vip_pareto')).toBe(false)
  })

  it('vip_pareto severity scales with how far over threshold', () => {
    expect(
      get(detectSignals([M('pareto.top20_revenue_share', 0.66)]), 'vip_pareto')?.severity,
    ).toBe('low')
    expect(
      get(detectSignals([M('pareto.top20_revenue_share', 0.71)]), 'vip_pareto')?.severity,
    ).toBe('med')
    expect(get(detectSignals([M('pareto.top20_revenue_share', 0.9)]), 'vip_pareto')?.severity).toBe(
      'high',
    )
  })

  it('insufficient-data metrics never trigger a signal', () => {
    const m: Metric = {
      key: 'pareto.top20_revenue_share',
      valueNumeric: null,
      insufficientData: true,
    }
    expect(has(detectSignals([m]), 'vip_pareto')).toBe(false)
  })

  it('geo: physical store → bopis_local; online → regional_inventory', () => {
    const physical = detectSignals([
      M('geo.has_physical_locations', 1),
      M('geo.single_region_share', 0.7, { region: 'CA' }),
      M('geo.within_5mi_revenue_share', 0.61),
    ])
    expect(has(physical, 'geo_focus')).toBe(true)
    expect(has(physical, 'bopis_local')).toBe(true)
    expect(has(physical, 'regional_inventory')).toBe(false)

    const online = detectSignals([
      M('geo.has_physical_locations', 0),
      M('geo.single_region_share', 0.7),
      M('geo.top_zip_cluster_share', 0.7),
    ])
    expect(has(online, 'regional_inventory')).toBe(true)
    expect(has(online, 'bopis_local')).toBe(false)
    expect(get(online, 'regional_inventory')?.context.action_type).toBe('regional_inventory')
  })

  it('discount, aov, sku-margin and retention rules respect their boundaries', () => {
    expect(
      has(detectSignals([M('discount.revenue_share_discounted', 0.41)]), 'discount_dependency'),
    ).toBe(true)
    expect(
      has(detectSignals([M('discount.revenue_share_discounted', 0.39)]), 'discount_dependency'),
    ).toBe(false)

    expect(
      has(
        detectSignals([M('aov.freeship_gap', -25, { position: 'below', aov: 125 })]),
        'aov_freeship',
      ),
    ).toBe(true)
    expect(
      has(
        detectSignals([M('aov.freeship_gap', 25, { position: 'above', aov: 125 })]),
        'aov_freeship',
      ),
    ).toBe(false)

    expect(
      has(detectSignals([M('sku_margin.negative_margin_sku_count', 1)]), 'sku_margin_kill'),
    ).toBe(true)
    expect(
      has(detectSignals([M('sku_margin.negative_margin_sku_count', 0)]), 'sku_margin_kill'),
    ).toBe(false)

    expect(has(detectSignals([M('cohort.repeat_purchase_rate', 0.29)]), 'retention_gap')).toBe(true)
    expect(has(detectSignals([M('cohort.repeat_purchase_rate', 0.31)]), 'retention_gap')).toBe(
      false,
    )
  })

  it('every signal carries grounding metricKeys present in the input', () => {
    const signals = detectSignals([
      M('pareto.top20_revenue_share', 0.8),
      M('pareto.top20_customer_count', 4),
      M('pareto.revenue_total', 1000),
    ])
    const vip = get(signals, 'vip_pareto')
    expect(vip?.metricKeys).toContain('pareto.top20_revenue_share')
    expect(
      vip?.metricKeys.every((k) =>
        [
          'pareto.top20_revenue_share',
          'pareto.top20_customer_count',
          'pareto.revenue_total',
        ].includes(k),
      ),
    ).toBe(true)
  })
})

describe('Slice 4→5 integration: analyzers → signals', () => {
  it('a concentrated omnichannel store surfaces VIP + geo + BOPIS signals', () => {
    const loc = location({ id: 'l1', lat: 0, lng: 0 })
    const near = (region: string) => addr({ region, lat: 0, lng: 0.05 })
    const far = (region: string) => addr({ region, lat: 10, lng: 10 })
    const customers = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map((id) => customer({ id }))
    const orders = [
      order({ id: 'o1', customerId: 'c1', totalPrice: 500, shippingAddress: near('CA') }),
      order({ id: 'o2', customerId: 'c2', totalPrice: 400, shippingAddress: near('CA') }),
      order({ id: 'o3', customerId: 'c3', totalPrice: 60, shippingAddress: near('CA') }),
      order({ id: 'o4', customerId: 'c4', totalPrice: 40, shippingAddress: near('CA') }),
      order({ id: 'o5', customerId: 'c5', totalPrice: 30, shippingAddress: far('NY') }),
      order({ id: 'o6', customerId: 'c6', totalPrice: 20, shippingAddress: far('NY') }),
    ]
    const metrics = runAnalyzers(
      ctxOf({ hasPhysicalLocations: true, locations: [loc], customers, orders }),
    )
    const signals = detectSignals(metrics)
    expect(has(signals, 'vip_pareto')).toBe(true)
    expect(has(signals, 'geo_focus')).toBe(true)
    expect(has(signals, 'bopis_local')).toBe(true)
  })
})
