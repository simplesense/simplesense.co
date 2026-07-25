import { describe, it, expect } from 'vitest'
import { computeApparelBrandsDemo } from '../src/demo/compute-apparel-demo'

const NOW = new Date('2026-07-25T00:00:00Z')

describe('computeApparelBrandsDemo — real-pipeline proof', () => {
  const result = computeApparelBrandsDemo(NOW)

  it('produces exactly the 3 configured moves, fully rendered', () => {
    expect(result.moves).toHaveLength(3)
    for (const m of result.moves) expect(m.narrative).not.toMatch(/\{\{computed\./)
  })

  it('lands the real computed return rate inside the cited apparel range (20-40%), with tolerance', () => {
    const stat = result.stats.find((s) => s.label === 'Return rate')!
    const pct = Number(stat.value.replace('%', ''))
    expect(pct).toBeGreaterThanOrEqual(10)
    expect(pct).toBeLessThanOrEqual(50)
  })

  it('lands the real computed repeat-purchase rate inside the cited apparel range (20-26%), with tolerance', () => {
    const stat = result.stats.find((s) => s.label === 'Repeat-purchase rate')!
    const pct = Number(stat.value.replace('%', ''))
    expect(pct).toBeGreaterThanOrEqual(10)
    expect(pct).toBeLessThanOrEqual(40)
  })

  it('the abuse-cohort move reports a real, non-zero dollar figure', () => {
    const move = result.moves.find((m) => m.title === 'The 2% eating the 98%')!
    expect(move.narrative).toMatch(/\$[1-9]/)
  })

  it('the bracketing move names the real detected style (Trail Runner Jacket), not a placeholder', () => {
    const move = result.moves.find((m) => m.title === 'Bracketing tax')!
    expect(move.narrative).toContain('Trail Runner Jacket')
  })

  it('the top-3-SKU move names a real Shopify ReturnReason enum value, not free text', () => {
    const move = result.moves.find((m) => m.title === 'Three SKUs, half the bill')!
    // Verified real values (M5 ledger, shopify.dev): SIZE_TOO_LARGE/SIZE_TOO_SMALL/OTHER/DEFECTIVE/...
    expect(move.narrative).toMatch(
      /SIZE_TOO_LARGE|SIZE_TOO_SMALL|OTHER|DEFECTIVE|WRONG_ITEM|UNWANTED/,
    )
  })

  it('is deterministic across repeated calls', () => {
    expect(computeApparelBrandsDemo(NOW)).toEqual(result)
  })
})
