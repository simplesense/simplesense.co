import { describe, it, expect } from 'vitest'
import { rankScore, sortByRank } from '../src/ranking'

describe('rankScore', () => {
  it('is impact-midpoint × confidence ÷ effort weight', () => {
    expect(rankScore({ impactLow: 1000, impactHigh: 2000, confidence: 0.8, effort: 'LOW' })).toBe(
      1200,
    )
    expect(rankScore({ impactLow: 1000, impactHigh: 2000, confidence: 0.8, effort: 'MED' })).toBe(
      600,
    )
    expect(
      rankScore({ impactLow: 1000, impactHigh: 2000, confidence: 1, effort: 'HIGH' }),
    ).toBeCloseTo(1500 / 3.5, 6)
  })
})

describe('sortByRank', () => {
  it('orders by descending score, deterministically', () => {
    const items = [
      { id: 'a', impactLow: 100, impactHigh: 100, confidence: 0.5, effort: 'LOW' as const },
      { id: 'b', impactLow: 1000, impactHigh: 1000, confidence: 0.9, effort: 'LOW' as const },
      { id: 'c', impactLow: 1000, impactHigh: 1000, confidence: 0.9, effort: 'HIGH' as const },
    ]
    expect(sortByRank(items).map((x) => x.id)).toEqual(['b', 'c', 'a'])
  })
})
