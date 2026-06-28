import { describe, it, expect } from 'vitest'
import { sum, mean, clamp, clamp01, roundTo, safeShare } from '../src/math'

describe('math', () => {
  it('sum: known answers incl. empty', () => {
    expect(sum([])).toBe(0)
    expect(sum([1, 2, 3, 4])).toBe(10)
    expect(sum([-2, 2])).toBe(0)
  })

  it('mean: known answers; empty → 0', () => {
    expect(mean([])).toBe(0)
    expect(mean([2, 4, 6])).toBe(4)
  })

  it('clamp / clamp01', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
    expect(clamp01(1.4)).toBe(1)
    expect(clamp01(-0.2)).toBe(0)
  })

  it('roundTo: deterministic precision', () => {
    expect(roundTo(0.12345, 2)).toBe(0.12)
    expect(roundTo(0.125, 2)).toBe(0.13)
    expect(roundTo(1234.5678, 0)).toBe(1235)
  })

  it('safeShare: null on zero denominator (insufficient data, not a fake 0)', () => {
    expect(safeShare(70, 100)).toBe(0.7)
    expect(safeShare(5, 0)).toBeNull()
  })
})
