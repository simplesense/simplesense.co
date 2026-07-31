import { describe, it, expect } from 'vitest'
import type { Metric } from '@ss/core'
import { requiredMetric, requiredPct, optionalMetric } from '../src/demo/metric-access'
import { computePetBrandsDemo } from '../src/demo/compute-pet-demo'
import { computeCandleBrandsDemo } from '../src/demo/compute-candle-demo'
import { computeApparelBrandsDemo } from '../src/demo/compute-apparel-demo'

const NOW = new Date('2026-07-25T00:00:00Z')

function metric(over: Partial<Metric> & { key: string }): Metric {
  return { unit: 'ratio', window: '24m', valueNumeric: 0.5, ...over } as Metric
}
const asMap = (...ms: Metric[]) => new Map(ms.map((m) => [m.key, m]))

describe('metric-access — grounding guard', () => {
  it('returns a real value when the metric is sufficient', () => {
    expect(requiredMetric(asMap(metric({ key: 'a', valueNumeric: 42 })), 'a')).toBe(42)
    expect(requiredPct(asMap(metric({ key: 'a', valueNumeric: 0.425 })), 'a')).toBe(42.5)
  })

  it('THROWS rather than defaulting to 0 when the metric is flagged insufficient', () => {
    const m = asMap(metric({ key: 'a', valueNumeric: null, insufficientData: true }))
    expect(() => requiredMetric(m, 'a')).toThrow(/insufficient/i)
  })

  it('THROWS rather than defaulting to 0 when the metric value is null', () => {
    expect(() => requiredMetric(asMap(metric({ key: 'a', valueNumeric: null })), 'a')).toThrow()
  })

  it('THROWS rather than defaulting to 0 when the metric is absent entirely', () => {
    expect(() => requiredMetric(asMap(), 'nope')).toThrow()
  })

  it('optionalMetric returns null instead of throwing, for claims the page can drop', () => {
    expect(optionalMetric(asMap(), 'nope')).toBeNull()
    expect(optionalMetric(asMap(metric({ key: 'a', valueNumeric: 7 })), 'a')).toBe(7)
  })
})

describe('no vertical demo page ships a fabricated zero', () => {
  // Regression for a REAL live defect (2026-07-31): /for/pet-brands publicly rendered
  // "launch a replenishment flow timed to your 0-day reorder cycle" because an
  // insufficient replenishment metric was defaulted with `?? 0` — on a page whose own
  // copy promises every figure is computed by the real pipeline.
  const demos = [
    ['pet', computePetBrandsDemo],
    ['candle', computeCandleBrandsDemo],
    ['apparel', computeApparelBrandsDemo],
  ] as const

  for (const [name, compute] of demos) {
    it(`${name}: every rendered stat is a real non-zero computed value`, () => {
      for (const stat of compute(NOW).stats) {
        expect(stat.value, `${name} stat "${stat.label}"`).not.toMatch(/^0(\.0+)?\s*(%|days)?$/)
      }
    })

    it(`${name}: no move narrative claims a zero-valued quantity`, () => {
      for (const move of compute(NOW).moves) {
        expect(move.narrative, `${name} move "${move.title}"`).not.toMatch(
          /\b0\s*(-|\s)?(day|days|%|customers|orders)\b/i,
        )
        expect(move.narrative, `${name} move "${move.title}"`).not.toMatch(/\$0\b/)
      }
    })
  }
})
