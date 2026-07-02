import { describe, it, expect } from 'vitest'
import { TIERS } from '@ss/config'
import {
  FREE_TOP_MOVES,
  movesVisibility,
  canExport,
  detailUnlocked,
  outcomesUnlocked,
} from './gating'

const free = TIERS.free.entitlements
const basic = TIERS.basic.entitlements
const pro = TIERS.pro.entitlements

describe('movesVisibility', () => {
  it('free tier sees only the top moves; the rest are locked', () => {
    expect(movesVisibility(free, false, 8)).toEqual({
      visibleCount: FREE_TOP_MOVES,
      lockedCount: 8 - FREE_TOP_MOVES,
    })
  })

  it('free tier with fewer moves than the cap locks nothing', () => {
    expect(movesVisibility(free, false, 2)).toEqual({ visibleCount: 2, lockedCount: 0 })
  })

  it('basic and pro see the full list', () => {
    expect(movesVisibility(basic, false, 8)).toEqual({ visibleCount: 8, lockedCount: 0 })
    expect(movesVisibility(pro, false, 8)).toEqual({ visibleCount: 8, lockedCount: 0 })
  })

  it('the demo store is an ungated showcase even on the free tier', () => {
    expect(movesVisibility(free, true, 8)).toEqual({ visibleCount: 8, lockedCount: 0 })
  })
})

describe('canExport', () => {
  it('exports are Basic+ and stay gated even for demo viewing', () => {
    expect(canExport(free)).toBe(false)
    expect(canExport(basic)).toBe(true)
    expect(canExport(pro)).toBe(true)
  })
})

describe('detailUnlocked / outcomesUnlocked', () => {
  it('geo+pareto detail is Basic+, demo exempt', () => {
    expect(detailUnlocked(free, false)).toBe(false)
    expect(detailUnlocked(free, true)).toBe(true)
    expect(detailUnlocked(basic, false)).toBe(true)
  })

  it('outcomes flywheel is Basic+ (summary) / Pro (full), demo exempt', () => {
    expect(outcomesUnlocked(free, false)).toBe(false)
    expect(outcomesUnlocked(free, true)).toBe(true)
    expect(outcomesUnlocked(basic, false)).toBe(true)
    expect(outcomesUnlocked(pro, false)).toBe(true)
  })
})
