import { describe, it, expect } from 'vitest'
import { hasLiteralDollarOrPercent } from '../src/render-moves'
import { findBannedClaims } from '../src/honesty-rails/banned-claims'
import { collectConfigText } from '../src/honesty-rails/distinctness'
import { SHIPPED_VERTICAL_CONFIGS } from '../src/index'

describe('§2.3 computed-token rule — every shipped config’s move templates', () => {
  for (const config of SHIPPED_VERTICAL_CONFIGS) {
    describe(config.slug, () => {
      for (const move of config.exampleMoves) {
        it(`"${move.title}" has no literal $/% outside {{computed.x}} tokens`, () => {
          expect(hasLiteralDollarOrPercent(move.narrativeTemplate)).toBe(false)
        })
      }
    })
  }
})

describe('§2.1 banned-claims lint — every shipped config’s vertical-specific text', () => {
  for (const config of SHIPPED_VERTICAL_CONFIGS) {
    it(`${config.slug} has no fabricated-social-proof language`, () => {
      expect(findBannedClaims(collectConfigText(config))).toEqual([])
    })
  }
})

describe('§2.2 cite-or-omit — every pain point and benchmark has a real cite or the editorial marker', () => {
  for (const config of SHIPPED_VERTICAL_CONFIGS) {
    describe(config.slug, () => {
      it('every benchmark has a non-empty sourceUrl', () => {
        for (const b of config.benchmarks) {
          expect(b.sourceUrl).toMatch(/^https?:\/\//)
        }
      })
      it('every non-editorial pain point has a working-looking sourceUrl', () => {
        for (const p of config.painPoints) {
          if (p.cite !== 'editorial') {
            expect(p.cite.sourceUrl).toMatch(/^https?:\/\//)
          }
        }
      })
      it('has at least 2 benchmarks and 3 pain points, per the page template (§1.3)', () => {
        expect(config.benchmarks.length).toBeGreaterThanOrEqual(2)
        expect(config.painPoints.length).toBeGreaterThanOrEqual(3)
      })
      it('has exactly 5 FAQ items and 3 example moves, per the page template (§1.3/§3)', () => {
        expect(config.faq).toHaveLength(5)
        expect(config.exampleMoves).toHaveLength(3)
      })
    })
  }

  it('the unshipped home-decor stub is excluded from every shipped-content check', () => {
    expect(SHIPPED_VERTICAL_CONFIGS.some((c) => c.slug === 'home-decor-brands')).toBe(false)
  })
})
