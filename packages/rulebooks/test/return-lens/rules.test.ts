import { describe, it, expect } from 'vitest'
import { runRulebook } from '../../src/engine'
import { returnLensRulebook } from '../../src/return-lens/rulebook'
import { snapshot, entity, findFinding } from './factory'

describe('entityResolutionRule', () => {
  it('is insufficient with zero orders', () => {
    const f = findFinding(
      runRulebook(returnLensRulebook, snapshot({ orderCount: 0, entities: [] })),
      'return_lens.entity_resolution',
    )
    expect(f.status).toBe('insufficient')
  })

  it('reports no gap when no entity spans multiple emails', () => {
    const f = findFinding(
      runRulebook(returnLensRulebook, snapshot()),
      'return_lens.entity_resolution',
    )
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.flaggedCount).toBe(0)
    expect(f.action).toMatch(/no gap/i)
  })

  it('flags an entity spanning 2+ emails at the same address with enough orders', () => {
    const snap = snapshot({
      entities: [
        entity({
          spansMultipleEmails: true,
          emails: ['a@x.com', 'b@x.com'],
          orderCount: 3,
          refundTotal: 200,
        }),
      ],
    })
    const f = findFinding(runRulebook(returnLensRulebook, snap), 'return_lens.entity_resolution')
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.flaggedCount).toBe(1)
    expect(f.dollarFrame).toBeUndefined() // deliberately no fabricated recovery estimate
  })
})

describe('serialRefunderRule', () => {
  it('is insufficient when there is no cohort baseline', () => {
    const f = findFinding(
      runRulebook(returnLensRulebook, snapshot({ cohortAvgReturnRate: null })),
      'return_lens.serial_refunder',
    )
    expect(f.status).toBe('insufficient')
  })

  it('reports no gap when no one exceeds the cohort multiplier', () => {
    const f = findFinding(
      runRulebook(returnLensRulebook, snapshot()),
      'return_lens.serial_refunder',
    )
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.flaggedCount).toBe(0)
  })

  it('flags a customer at 3x+ the cohort average with enough orders', () => {
    // cohort avg 0.15 -> 3x = 0.45
    const snap = snapshot({
      cohortAvgReturnRate: 0.15,
      entities: [entity({ orderCount: 5, returnRate: 0.6, refundTotal: 300 })],
    })
    const f = findFinding(runRulebook(returnLensRulebook, snap), 'return_lens.serial_refunder')
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.flaggedCount).toBe(1)
    expect(f.evidence?.metrics.topReturnRatePct).toBe(60)
  })

  it('does not flag a customer whose order count is below the minimum, even at a high rate', () => {
    const snap = snapshot({
      cohortAvgReturnRate: 0.15,
      entities: [entity({ orderCount: 2, returnRate: 1 })], // below MIN_ORDERS_TO_SCORE (3)
    })
    const f = findFinding(runRulebook(returnLensRulebook, snap), 'return_lens.serial_refunder')
    expect(f.evidence?.metrics.flaggedCount).toBe(0)
  })
})

describe('bracketingRule', () => {
  it('is insufficient with zero orders', () => {
    const f = findFinding(
      runRulebook(returnLensRulebook, snapshot({ orderCount: 0 })),
      'return_lens.bracketing',
    )
    expect(f.status).toBe('insufficient')
  })

  it('reports no gap when there are no bracketing candidates', () => {
    const f = findFinding(runRulebook(returnLensRulebook, snapshot()), 'return_lens.bracketing')
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.candidateCount).toBe(0)
  })

  it('flags orders with a bracketing candidate and names the most common style', () => {
    const snap = snapshot({
      bracketingCandidates: [
        { orderName: '#1', baseStyle: 'wool coat', variantsOrdered: 3, variantsReturned: 2 },
        { orderName: '#2', baseStyle: 'wool coat', variantsOrdered: 2, variantsReturned: 2 },
      ],
    })
    const f = findFinding(runRulebook(returnLensRulebook, snap), 'return_lens.bracketing')
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.candidateCount).toBe(2)
    expect(f.evidence?.metrics.topStyle).toBe('wool coat')
  })
})

describe('wardrobingRule', () => {
  it('is insufficient when there are no returns', () => {
    const f = findFinding(
      runRulebook(
        returnLensRulebook,
        snapshot({
          wardrobing: { totalReturns: 0, wearWindowReturns: 0, wearWindowSharePct: null },
        }),
      ),
      'return_lens.wardrobing',
    )
    expect(f.status).toBe('insufficient')
  })

  it('reports no gap when the wear-window share is below the v0 threshold', () => {
    const f = findFinding(runRulebook(returnLensRulebook, snapshot()), 'return_lens.wardrobing')
    expect(f.status).toBe('triggered')
    expect(f.action).toMatch(/no gap/i)
  })

  it('flags an elevated wear-window share', () => {
    const snap = snapshot({
      wardrobing: { totalReturns: 10, wearWindowReturns: 6, wearWindowSharePct: 60 },
    })
    const f = findFinding(runRulebook(returnLensRulebook, snap), 'return_lens.wardrobing')
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.wearWindowSharePct).toBe(60)
    expect(f.action).toMatch(/manually/i)
  })
})

describe('highReturnSkuRule', () => {
  it('is insufficient with no SKU data', () => {
    const f = findFinding(
      runRulebook(returnLensRulebook, snapshot({ skuStats: [] })),
      'return_lens.high_return_sku',
    )
    expect(f.status).toBe('insufficient')
  })

  it('reports no gap when no SKU exceeds the return-rate/volume floor', () => {
    const snap = snapshot({
      skuStats: [
        {
          sku: 'SKU-1',
          orderedQuantity: 3,
          returnedQuantity: 3,
          returnRate: 1,
          dominantReason: null,
        },
      ],
    })
    const f = findFinding(runRulebook(returnLensRulebook, snap), 'return_lens.high_return_sku')
    // orderedQuantity below MIN_ORDERED_QTY (5), so not flagged despite 100% return rate
    expect(f.evidence?.metrics.flaggedCount).toBe(0)
  })

  it('flags a high-volume, high-return-rate SKU and names its dominant reason', () => {
    const snap = snapshot({
      skuStats: [
        {
          sku: 'SKU-A',
          orderedQuantity: 20,
          returnedQuantity: 2,
          returnRate: 0.1,
          dominantReason: null,
        },
        {
          sku: 'SKU-B',
          orderedQuantity: 10,
          returnedQuantity: 6,
          returnRate: 0.6,
          dominantReason: 'SIZE_TOO_SMALL',
        },
      ],
    })
    const f = findFinding(runRulebook(returnLensRulebook, snap), 'return_lens.high_return_sku')
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.flaggedCount).toBe(1)
    expect(f.evidence?.metrics.topSku).toBe('SKU-B')
    expect(f.evidence?.metrics.topDominantReason).toBe('SIZE_TOO_SMALL')
  })
})

describe('policyTierRule', () => {
  it('is insufficient with zero entities', () => {
    const f = findFinding(
      runRulebook(returnLensRulebook, snapshot({ entities: [] })),
      'return_lens.policy_tier',
    )
    expect(f.status).toBe('insufficient')
  })

  it('uses the cohort-relative cutoff when a baseline exists', () => {
    // cohort avg 0.15 -> cutoff 0.3
    const snap = snapshot({
      cohortAvgReturnRate: 0.15,
      entities: [entity({ returnRate: 0.5 }), entity({ key: 'e2', returnRate: 0.1 })],
    })
    const f = findFinding(runRulebook(returnLensRulebook, snap), 'return_lens.policy_tier')
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.cutoffPct).toBe(30)
    expect(f.evidence?.metrics.reviewTierCount).toBe(1)
    expect(f.evidence?.metrics.instantTierCount).toBe(1)
  })

  it('falls back to the flat cutoff when there is no cohort baseline', () => {
    const snap = snapshot({
      cohortAvgReturnRate: null,
      entities: [entity({ returnRate: 0.5 }), entity({ key: 'e2', returnRate: 0.1 })],
    })
    const f = findFinding(runRulebook(returnLensRulebook, snap), 'return_lens.policy_tier')
    expect(f.evidence?.metrics.cutoffPct).toBe(30) // FLAT_FALLBACK_CUTOFF
  })

  it('does not sweep a one-order customer into the review tier just because their one return is a 100% rate', () => {
    const snap = snapshot({
      cohortAvgReturnRate: 0.1,
      entities: [entity({ orderCount: 1, returnedOrderCount: 1, returnRate: 1 })],
    })
    const f = findFinding(runRulebook(returnLensRulebook, snap), 'return_lens.policy_tier')
    expect(f.evidence?.metrics.reviewTierCount).toBe(0)
    expect(f.evidence?.metrics.instantTierCount).toBe(1)
  })
})
