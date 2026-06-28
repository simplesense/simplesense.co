import { describe, it, expect } from 'vitest'
import { runDemo } from './run-demo'

describe('demo pipeline (seed store → grounded moves)', () => {
  it('produces several grounded moves including VIP + Geo, with nothing rejected', async () => {
    const res = await runDemo()
    expect(res.recommendations.length).toBeGreaterThanOrEqual(3)
    expect(res.rejectedCount).toBe(0)

    const categories = res.recommendations.map((r) => r.category)
    expect(categories).toContain('VIP / retention')
    expect(categories).toContain('Geo / acquisition')

    // every move is grounded: each evidence id maps to a real computed metric
    const keys = new Set(res.metrics.map((m) => m.key))
    for (const r of res.recommendations) {
      expect(r.evidenceMetricIds.length).toBeGreaterThan(0)
      for (const id of r.evidenceMetricIds) expect(keys.has(id)).toBe(true)
    }
    // ranked descending
    const scores = res.recommendations.map((r) => r.rankScore)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)
  })
})
