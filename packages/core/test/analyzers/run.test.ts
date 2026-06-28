import { describe, it, expect } from 'vitest'
import { runAnalyzers } from '../../src/analyzers/run'
import { ctxOf, order, customer, findMetric } from '../factory'

describe('runAnalyzers', () => {
  const customers = Array.from({ length: 6 }, (_, i) => customer({ id: `c${i + 1}` }))
  const orders = [200, 150, 120, 90, 60, 30].map((rev, i) =>
    order({ id: `o${i}`, customerId: `c${i + 1}`, totalPrice: rev }),
  )

  it('produces metrics across analyzers with no duplicate keys', () => {
    const metrics = runAnalyzers(ctxOf({ customers, orders }))
    expect(metrics.length).toBeGreaterThan(10)
    const keys = metrics.map((m) => m.key)
    expect(new Set(keys).size).toBe(keys.length) // unique keys (grounding relies on this)
    expect(findMetric(metrics, 'pareto.top20_revenue_share')).toBeTruthy()
  })

  it('gated analyzers are flagged insufficient (never fabricated) when included', () => {
    const metrics = runAnalyzers(ctxOf({ customers, orders }), { includeGated: true })
    const ltv = findMetric(metrics, 'channel_profitability.ltv_cac')
    expect(ltv.valueNumeric).toBeNull()
    expect(ltv.insufficientData).toBe(true)
    expect((ltv.valueJson as { fast_follow: boolean }).fast_follow).toBe(true)
  })
})
