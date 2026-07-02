import { describe, it, expect } from 'vitest'
import { TIERS } from '@ss/config'
import {
  FREE_TOP_MOVES,
  entitledMoveIds,
  splitOpenMoves,
  canExport,
  detailUnlocked,
  outcomesUnlocked,
} from './gating'

const free = TIERS.free.entitlements
const basic = TIERS.basic.entitlements
const pro = TIERS.pro.entitlements

const rankedRun = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'] // run's full ranked ids (all statuses)
const rec = (id: string) => ({ id })

describe('entitledMoveIds', () => {
  it('free tier is entitled to a FIXED top-N of the run, regardless of status', () => {
    const set = entitledMoveIds(free, false, rankedRun)
    expect(set).not.toBeNull()
    expect([...set!]).toEqual(rankedRun.slice(0, FREE_TOP_MOVES))
  })

  it('paid tiers and the demo showcase are unrestricted (null)', () => {
    expect(entitledMoveIds(basic, false, rankedRun)).toBeNull()
    expect(entitledMoveIds(pro, false, rankedRun)).toBeNull()
    expect(entitledMoveIds(free, true, rankedRun)).toBeNull()
  })
})

describe('splitOpenMoves', () => {
  it('free tier sees only entitled open moves; the rest are locked', () => {
    const entitled = entitledMoveIds(free, false, rankedRun)
    const open = rankedRun.map(rec) // everything open
    const { visible, lockedCount } = splitOpenMoves(entitled, open)
    expect(visible.map((r) => r.id)).toEqual(['r1', 'r2', 'r3'])
    expect(lockedCount).toBe(3)
  })

  it('dismissing an entitled move NEVER promotes a locked one into view', () => {
    const entitled = entitledMoveIds(free, false, rankedRun)
    // r1 was dismissed → it leaves the open set; r4 is next by rank but NOT entitled.
    const openAfterDismiss = ['r2', 'r3', 'r4', 'r5', 'r6'].map(rec)
    const { visible, lockedCount } = splitOpenMoves(entitled, openAfterDismiss)
    expect(visible.map((r) => r.id)).toEqual(['r2', 'r3']) // fewer visible, no promotion
    expect(lockedCount).toBe(3) // r4, r5, r6 stay locked
  })

  it('unrestricted (paid/demo) passes everything through', () => {
    const open = rankedRun.map(rec)
    expect(splitOpenMoves(null, open)).toEqual({ visible: open, lockedCount: 0 })
  })

  it('fewer moves than the cap locks nothing', () => {
    const entitled = entitledMoveIds(free, false, ['r1', 'r2'])
    const { visible, lockedCount } = splitOpenMoves(entitled, [rec('r1'), rec('r2')])
    expect(visible).toHaveLength(2)
    expect(lockedCount).toBe(0)
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
