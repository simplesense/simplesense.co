import { describe, it, expect } from 'vitest'
import type { Recommendation } from '@ss/core'
import { shipPlan, moveChecklist } from './move-execution'

function rec(partial: Partial<Recommendation>): Recommendation {
  return {
    id: 'r1',
    category: 'Customer',
    title: 'Build a VIP early-access flow',
    rationale: 'Top 20% drive 72% of revenue.',
    evidenceMetricIds: ['pareto.top20_revenue_share'],
    impactLow: 1800,
    impactHigh: 3500,
    impactUnit: 'USD/month',
    effort: 'MED',
    confidence: 0.7,
    rankScore: 0.9,
    status: 'NEW',
    suggestedExecution: { type: 'manual', spec: {} },
    ...partial,
  }
}

describe('shipPlan', () => {
  it('maps a klaviyo segment to Klaviyo + Shopify rows with the definition', () => {
    const rows = shipPlan({ type: 'klaviyo_segment', spec: { definition: 'top_20_pct_by_spend' } })
    expect(rows.map((r) => r.channel)).toEqual(['Klaviyo', 'Shopify'])
    expect(rows[0]!.detail).toContain('top 20 pct by spend')
  })

  it('geofence honors radius and only adds BOPIS when enabled', () => {
    const noBopis = shipPlan({ type: 'meta_geofence', spec: { radius_miles: 5 } })
    expect(noBopis).toHaveLength(1)
    expect(noBopis[0]!.detail).toContain('5-mile')
    const withBopis = shipPlan({
      type: 'meta_geofence',
      spec: { radius_miles: 3, enable_bopis: true },
    })
    expect(withBopis.map((r) => r.channel)).toContain('Shopify')
    expect(withBopis[0]!.detail).toContain('3-mile')
  })

  it('falls back to an operator playbook for unknown/manual types', () => {
    const rows = shipPlan({ type: 'manual', spec: { action: 'tighten_discount_policy' } })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.channel).toBe('Operator playbook')
    expect(rows[0]!.detail).toContain('tighten discount policy')
  })
})

describe('moveChecklist', () => {
  it('always leads with the move title and ends with the measure-lift step', () => {
    const steps = moveChecklist(rec({}))
    expect(steps[0]).toBe('Build a VIP early-access flow')
    expect(steps[steps.length - 1]).toMatch(/measure lift/i)
  })

  it('de-duplicates repeated steps', () => {
    const steps = moveChecklist(
      rec({ title: 'Apply here so we capture the baseline and measure lift after the window' }),
    )
    expect(new Set(steps).size).toBe(steps.length)
  })

  it('includes a klaviyo definition step for segment moves', () => {
    const steps = moveChecklist(
      rec({
        suggestedExecution: { type: 'klaviyo_segment', spec: { definition: 'win_back_90d' } },
      }),
    )
    expect(steps.some((s) => s.includes('win back 90d'))).toBe(true)
  })
})
