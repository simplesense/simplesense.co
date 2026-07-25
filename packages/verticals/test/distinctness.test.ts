import { describe, it, expect } from 'vitest'
import { computeUniquenessShare } from '../src/honesty-rails/distinctness'
import { petBrandsConfig } from '../src/configs/pet-brands'
import { candleBrandsConfig } from '../src/configs/candle-brands'
import { apparelBrandsConfig } from '../src/configs/apparel-brands'

describe('computeUniquenessShare', () => {
  it('is 1.0 (fully unique) when there is nothing to compare against', () => {
    expect(computeUniquenessShare(petBrandsConfig, [])).toBe(1)
  })

  it('is lower when configs share significant vocabulary', () => {
    const identical = { ...petBrandsConfig }
    expect(computeUniquenessShare(petBrandsConfig, [identical])).toBeLessThan(0.2)
  })

  it('the 3 shipped verticals each clear the addendum’s ≥60% page-unique threshold against the other two', () => {
    const configs = [petBrandsConfig, candleBrandsConfig, apparelBrandsConfig]
    for (const target of configs) {
      const others = configs.filter((c) => c.slug !== target.slug)
      const share = computeUniquenessShare(target, others)
      expect(share, `${target.slug} uniqueness`).toBeGreaterThanOrEqual(0.6)
    }
  })
})
