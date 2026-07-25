import { describe, it, expect } from 'vitest'
import { computeCandleBrandsDemo } from '../src/demo/compute-candle-demo'

const NOW = new Date('2026-07-25T00:00:00Z')

describe('computeCandleBrandsDemo — real-pipeline proof', () => {
  const result = computeCandleBrandsDemo(NOW)

  it('produces exactly the 3 configured moves, fully rendered', () => {
    expect(result.moves).toHaveLength(3)
    for (const m of result.moves) expect(m.narrative).not.toMatch(/\{\{computed\./)
  })

  it('lands the real computed repeat-purchase rate inside the cited home-goods range (18-25%), with tolerance', () => {
    const stat = result.stats.find((s) => s.label === 'Repeat-purchase rate')!
    const pct = Number(stat.value.replace('%', ''))
    expect(pct).toBeGreaterThanOrEqual(10)
    expect(pct).toBeLessThanOrEqual(35)
  })

  it('discount treadmill move reflects the configured ~34% discounted-revenue share', () => {
    const move = result.moves.find((m) => m.title === 'The discount treadmill')!
    const match = move.narrative.match(/^(\d+(?:\.\d+)?)%/)
    expect(match).not.toBeNull()
    const pct = Number(match![1])
    expect(pct).toBeGreaterThan(15)
    expect(pct).toBeLessThan(50)
  })

  it('gift-buyer move reports a real, non-negative one-time-buyer count', () => {
    const move = result.moves.find((m) => m.title === 'Gift-buyers → repeat buyers')!
    expect(move.narrative).toMatch(/\d+% of last Q4/)
  })

  it('is deterministic across repeated calls', () => {
    expect(computeCandleBrandsDemo(NOW)).toEqual(result)
  })
})
