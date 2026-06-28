import { describe, it, expect } from 'vitest'
import { computeLift } from '../src/outcome'

describe('computeLift', () => {
  it('reports a real positive lift', () => {
    const r = computeLift(0.3, 0.45)
    expect(r.status).toBe('MEASURED')
    expect(r.liftValue).toBe(0.15)
    expect(r.liftConfidence).toBeGreaterThan(0)
  })

  it('reports a negative lift as MEASURED', () => {
    const r = computeLift(0.5, 0.4)
    expect(r.status).toBe('MEASURED')
    expect(r.liftValue).toBe(-0.1)
  })

  it('treats sub-noise change as INCONCLUSIVE', () => {
    expect(computeLift(100, 102).status).toBe('INCONCLUSIVE') // +2% < 5% floor
  })

  it('is INCONCLUSIVE with no baseline (never overclaims)', () => {
    const r = computeLift(null, 5)
    expect(r.status).toBe('INCONCLUSIVE')
    expect(r.liftValue).toBeNull()
  })
})
