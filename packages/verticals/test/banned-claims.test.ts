import { describe, it, expect } from 'vitest'
import { findBannedClaims } from '../src/honesty-rails/banned-claims'

describe('findBannedClaims', () => {
  it('flags "trusted by"', () => {
    expect(findBannedClaims('Trusted by hundreds of brands')).toHaveLength(1)
  })
  it('flags "N brands use"', () => {
    expect(findBannedClaims('1,200+ brands use SimpleSense')).toHaveLength(1)
  })
  it('flags a star-rating claim', () => {
    expect(findBannedClaims('Rated 4.9 out of 5 stars')).toHaveLength(1)
  })
  it('flags a quoted testimonial attribution', () => {
    expect(
      findBannedClaims('"This changed how we run our store completely" - Sarah M.'),
    ).toHaveLength(1)
  })
  it('flags "as seen in"', () => {
    expect(findBannedClaims('As seen in TechCrunch')).toHaveLength(1)
  })
  it('returns empty for clean, grounded copy', () => {
    expect(
      findBannedClaims(
        'A ranked read of your retention program, computed from your own Klaviyo account.',
      ),
    ).toEqual([])
  })
  it('does not false-positive on the word "brands" alone', () => {
    expect(findBannedClaims('Built for independent pet brands doing $1M–$15M.')).toEqual([])
  })
})
