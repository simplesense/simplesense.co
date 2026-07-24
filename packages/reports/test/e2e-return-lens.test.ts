import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { runRulebook, returnLens } from '@ss/rulebooks'
import { parseOrdersCsv, parseReturnsCsv } from '@ss/csv-ingest'
import { renderReportHtml } from '../src/render'
import type { Report } from '../src/types'

const { returnLensRulebook, analyzeReturns } = returnLens

const ordersCsv = readFileSync(
  new URL('../../../fixtures/return-lens/case-01/orders.csv', import.meta.url),
  'utf8',
)
const returnsCsv = readFileSync(
  new URL('../../../fixtures/return-lens/case-01/returns.csv', import.meta.url),
  'utf8',
)

describe('M5 ReturnLens — end-to-end chassis (CSV ingest → rulebook → report)', () => {
  const parsedOrders = parseOrdersCsv(ordersCsv)
  const parsedReturns = parseReturnsCsv(returnsCsv)

  it('parses the fixture CSVs with zero quarantined rows', () => {
    expect(parsedOrders.quarantined).toEqual([])
    expect(parsedReturns.quarantined).toEqual([])
    expect(parsedOrders.rows).toHaveLength(32)
    expect(parsedReturns.rows).toHaveLength(13)
  })

  const snapshot = analyzeReturns(parsedOrders.rows, parsedReturns.rows, 365)
  const findings = runRulebook(returnLensRulebook, snapshot)
  const report: Report = {
    meta: {
      module: returnLensRulebook.module,
      moduleVersion: returnLensRulebook.version,
      moduleTitle: 'Return Lens',
      clientName: 'Cascade Trailwear',
      generatedAt: '2026-07-24T00:00:00.000Z',
    },
    findings,
  }
  const html = renderReportHtml(
    report,
    'Returns intelligence surfaces review cohorts, never an auto-deny list — a false positive punishes a good customer. Every figure is computed directly from the CSV exports provided.',
  )

  it('every non-insufficient finding traces to a real, recomputable number in the input CSVs', () => {
    expect(findings).toHaveLength(6)
    for (const f of findings) {
      if (f.status !== 'triggered') continue
      expect(f.evidence?.summary.length).toBeGreaterThan(0)
      if (f.dollarFrame) {
        expect(f.dollarFrame.low).toBeGreaterThanOrEqual(0)
        expect(f.dollarFrame.high).toBeGreaterThanOrEqual(f.dollarFrame.low)
      }
    }
  })

  it('entity resolution: merges dup1/dup2 (same shipping address) into one identity, 4 orders / 3 returns', () => {
    const f = findings.find((x) => x.ruleId === 'return_lens.entity_resolution')
    expect(f?.evidence?.metrics.flaggedCount).toBe(1)
    expect(f?.evidence?.metrics.totalOrders).toBe(4)
    expect(f?.evidence?.metrics.totalReturns).toBe(3)
    expect(f?.evidence?.metrics.combinedRefund).toBe(240) // 3 x $80
  })

  it('serial refunder: flags serial1 and the dup1/dup2 identity at 75%, ~21% cohort average', () => {
    // Cohort baseline = mean return rate across the 12 entities with >=2 orders:
    // 8 clean customers @ 0%, normal9/normal10 @ 50% each, serial1 @ 75%, dup-merged @ 75%.
    // (0*8 + 0.5 + 0.5 + 0.75 + 0.75) / 12 = 2.5/12 = 20.83%
    const f = findings.find((x) => x.ruleId === 'return_lens.serial_refunder')
    expect(f?.evidence?.metrics.cohortAvgReturnRatePct).toBeCloseTo(20.8, 1)
    expect(f?.evidence?.metrics.flaggedCount).toBe(2)
    expect(f?.evidence?.metrics.topReturnRatePct).toBe(75)
    expect(f?.evidence?.metrics.combinedRefund).toBe(450) // serial1 $210 + dup-merged $240
  })

  it('bracketing: flags order #4029 (3 Trail Jacket sizes, 2 returned)', () => {
    const f = findings.find((x) => x.ruleId === 'return_lens.bracketing')
    expect(f?.evidence?.metrics.candidateCount).toBe(1)
    expect(f?.evidence?.metrics.topStyle).toBe('trail jacket')
  })

  it('wardrobing: 8 of 13 returns (61.5%) fall inside the 5-21 day wear window', () => {
    const f = findings.find((x) => x.ruleId === 'return_lens.wardrobing')
    expect(f?.evidence?.metrics.wearWindowSharePct).toBe(61.5)
    expect(f?.evidence?.metrics.wearWindowReturns).toBe(8)
    expect(f?.evidence?.metrics.totalReturns).toBe(13)
  })

  it('high-return SKU: flags SKU-HOOD at 83.3% (5 of 6 units), dominant reason SIZE_TOO_SMALL', () => {
    const f = findings.find((x) => x.ruleId === 'return_lens.high_return_sku')
    expect(f?.evidence?.metrics.flaggedCount).toBe(1)
    expect(f?.evidence?.metrics.topSku).toBe('SKU-HOOD')
    expect(f?.evidence?.metrics.topReturnRatePct).toBeCloseTo(83.3, 1)
    expect(f?.evidence?.metrics.topDominantReason).toBe('SIZE_TOO_SMALL')
  })

  it('policy tier: 4 of 16 customers (25%) move to review at the ~41.7% cutoff; one-order returners are excluded', () => {
    const f = findings.find((x) => x.ruleId === 'return_lens.policy_tier')
    expect(f?.evidence?.metrics.cutoffPct).toBeCloseTo(41.7, 1)
    expect(f?.evidence?.metrics.reviewTierCount).toBe(4)
    expect(f?.evidence?.metrics.instantTierCount).toBe(12)
    expect(f?.evidence?.metrics.reviewTierPct).toBe(25)
  })

  it('matches the reviewed golden report (regenerate deliberately with `vitest -u`, never hand-edit)', () => {
    expect(html).toMatchSnapshot()
  })
})
