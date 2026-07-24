import { describe, it, expect } from 'vitest'
import { runRulebook } from '../../src/engine'
import { retentionXRayRulebook } from '../../src/retention-x-ray/rulebook'
import { snapshot, flow, campaign, cadence, listHealth, segments, findFinding } from './factory'

describe('flowCoverageRule', () => {
  it('reports no gap when all 6 canonical flows are live and sending', () => {
    const findings = runRulebook(retentionXRayRulebook, snapshot())
    const f = findFinding(findings, 'retention.flow_coverage')
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.missingCount).toBe(0)
    expect(f.evidence?.metrics.dormantCount).toBe(0)
    expect(f.action).toMatch(/no gap/i)
  })

  it('flags missing and dormant flows by canonical type', () => {
    const snap = snapshot({
      flows: [
        flow({ canonicalType: 'welcome', status: 'archived' }), // missing (not live)
        flow({ canonicalType: 'abandoned_checkout', status: 'live', sends30d: 0 }), // dormant
        flow({ canonicalType: 'post_purchase', status: 'live', sends30d: 50 }), // fine
      ],
    })
    const f = findFinding(runRulebook(retentionXRayRulebook, snap), 'retention.flow_coverage')
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.missingCount).toBe(4) // welcome + abandoned_browse + winback + sunset
    expect(f.evidence?.metrics.dormantCount).toBe(1) // abandoned_checkout
    expect(f.action).toMatch(/build the missing/i)
    expect(f.action).toMatch(/reactivate the dormant/i)
  })

  it('renders insufficient when flow data is unavailable', () => {
    const snap = snapshot({ flows: null as unknown as ReturnType<typeof flow>[] })
    const f = findFinding(runRulebook(retentionXRayRulebook, snap), 'retention.flow_coverage')
    expect(f.status).toBe('insufficient')
    expect(f.evidence).toBeUndefined()
  })
})

describe('revenuePerFlowRule', () => {
  it('reports no gap when no flow has declined 20%+', () => {
    const f = findFinding(
      runRulebook(retentionXRayRulebook, snapshot()),
      'retention.revenue_per_flow_trend',
    )
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.decliningCount).toBe(0)
    expect(f.dollarFrame).toBeUndefined()
  })

  it('grounds a dollar estimate in the actual revenue-per-recipient gap and send volume', () => {
    const snap = snapshot({
      flows: [
        flow({
          name: 'Welcome',
          canonicalType: 'welcome',
          revenuePerRecipient: 1.6, // 20% down from 2.0
          revenuePerRecipient90dAgo: 2.0,
          sends30d: 1000,
        }),
      ],
    })
    const f = findFinding(
      runRulebook(retentionXRayRulebook, snap),
      'retention.revenue_per_flow_trend',
    )
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.decliningCount).toBe(1)
    // gap = 0.4/recipient * 1000 sends = 400 high, 200 low (halved)
    expect(f.dollarFrame).toEqual({
      low: 200,
      high: 400,
      basis: expect.stringContaining('90-day-ago'),
    })
    expect(f.action).toMatch(/Welcome/)
  })

  it('renders insufficient when no flow has a 90-day-ago baseline', () => {
    const snap = snapshot({
      flows: [flow({ revenuePerRecipient: 1, revenuePerRecipient90dAgo: null })],
    })
    const f = findFinding(
      runRulebook(retentionXRayRulebook, snap),
      'retention.revenue_per_flow_trend',
    )
    expect(f.status).toBe('insufficient')
  })
})

describe('cadenceFatigueRule', () => {
  it('reports no gap when complaint/unsubscribe trends are stable and no quiet-hours issues', () => {
    const f = findFinding(
      runRulebook(retentionXRayRulebook, snapshot()),
      'retention.cadence_fatigue',
    )
    expect(f.status).toBe('triggered')
    expect(f.action).toMatch(/no gap/i)
  })

  it('flags a rising spam-complaint trend', () => {
    const snap = snapshot({
      cadence: cadence({ spamComplaintRatePct: 0.05, spamComplaintRatePct90dAgo: 0.02 }),
    })
    const f = findFinding(runRulebook(retentionXRayRulebook, snap), 'retention.cadence_fatigue')
    expect(f.status).toBe('triggered')
    expect(f.evidence?.summary).toMatch(/spam complaints up/i)
  })

  it('flags quiet-hours violations', () => {
    const snap = snapshot({ cadence: cadence({ quietHoursViolationCount: 3 }) })
    const f = findFinding(runRulebook(retentionXRayRulebook, snap), 'retention.cadence_fatigue')
    expect(f.evidence?.summary).toMatch(/quiet-hours/i)
  })

  it('renders insufficient when neither rate is available', () => {
    const snap = snapshot({
      cadence: cadence({ spamComplaintRatePct: null, unsubscribeRatePct: null }),
    })
    const f = findFinding(runRulebook(retentionXRayRulebook, snap), 'retention.cadence_fatigue')
    expect(f.status).toBe('insufficient')
  })
})

describe('listHealthRule', () => {
  it('reports no gap for a healthy list', () => {
    const f = findFinding(runRulebook(retentionXRayRulebook, snapshot()), 'retention.list_health')
    expect(f.action).toMatch(/no gap/i)
  })

  it('flags a missing sunset flow and high inactive share', () => {
    const snap = snapshot({
      listHealth: listHealth({ hasSunsetFlow: false, inactiveSharePct: 0.4 }),
    })
    const f = findFinding(runRulebook(retentionXRayRulebook, snap), 'retention.list_health')
    expect(f.evidence?.summary).toMatch(/no sunset/i)
    expect(f.evidence?.summary).toMatch(/40%/)
    expect(f.action).toMatch(/sunset flow/i)
    expect(f.action).toMatch(/segment out/i)
  })
})

describe('segmentArchitectureRule', () => {
  it('reports no gap when both segments exist', () => {
    const f = findFinding(
      runRulebook(retentionXRayRulebook, snapshot()),
      'retention.segment_architecture',
    )
    expect(f.action).toMatch(/no gap/i)
  })

  it('flags missing VIP and at-risk segments', () => {
    const snap = snapshot({ segments: segments({ hasVipSegment: false, hasAtRiskSegment: false }) })
    const f = findFinding(
      runRulebook(retentionXRayRulebook, snap),
      'retention.segment_architecture',
    )
    expect(f.evidence?.summary).toMatch(/VIP.*at-risk|at-risk.*VIP/)
  })
})

describe('discountDependencyRule', () => {
  it('reports no gap when discount share is under 50%', () => {
    const f = findFinding(
      runRulebook(retentionXRayRulebook, snapshot()),
      'retention.discount_dependency',
    )
    expect(f.dollarFrame).toBeUndefined()
  })

  it('flags high discount dependency with an editorial-labeled dollar estimate', () => {
    const snap = snapshot({
      campaigns: [
        campaign({ revenue: 600, usedDiscountCode: true }),
        campaign({ revenue: 400, usedDiscountCode: false }),
      ],
    })
    const f = findFinding(runRulebook(retentionXRayRulebook, snap), 'retention.discount_dependency')
    expect(f.evidence?.metrics.discountedRevenueSharePct).toBe(60)
    expect(f.dollarFrame).toEqual({
      low: 90,
      high: 150,
      basis: expect.stringContaining('Editorial estimate'),
    })
  })

  it('renders insufficient when there is no campaign data', () => {
    const snap = snapshot({ campaigns: [] })
    const f = findFinding(runRulebook(retentionXRayRulebook, snap), 'retention.discount_dependency')
    expect(f.status).toBe('insufficient')
  })
})
