import { describe, it, expect } from 'vitest'
import type { Metric } from '../src/types'
import type { RawRecommendation } from '../src/recommendation'
import { validateGrounding } from '../src/grounding'

const metrics: Metric[] = [
  {
    key: 'pareto.top20_revenue_share',
    valueNumeric: 0.857,
    valueJson: { effective_pct: 0.2 },
    unit: 'ratio',
  },
  { key: 'pareto.revenue_total', valueNumeric: 100000, unit: 'USD' },
  { key: 'cohort.repeat_purchase_rate', valueNumeric: null, insufficientData: true, unit: 'ratio' },
]

const base: RawRecommendation = {
  category: 'VIP / retention',
  title: 'Build your top-20% VIP segment',
  rationale: 'Your top 20% of customers drive 86% of revenue (about $100,000 over the window).',
  evidence_metric_ids: ['pareto.top20_revenue_share', 'pareto.revenue_total'],
  impact_low: 1100,
  impact_high: 1500,
  impact_unit: 'USD/month',
  effort: 'LOW',
  confidence: 0.8,
  suggested_execution: { type: 'klaviyo_segment', spec: {} },
}

describe('validateGrounding', () => {
  it('accepts a fully grounded recommendation', () => {
    const r = validateGrounding(base, metrics)
    expect(r.ok).toBe(true)
    expect(r.reasons).toEqual([])
  })

  it('REJECTS a hallucinated number in the rationale (Prime Directive #1)', () => {
    const bad = {
      ...base,
      rationale: 'We uncovered $999,999 of hidden revenue you can capture now.',
    }
    const r = validateGrounding(bad, metrics)
    expect(r.ok).toBe(false)
    expect(r.reasons.join(' ')).toMatch(/999999|not grounded/)
  })

  it('rejects citing an unknown metric id', () => {
    const bad = { ...base, evidence_metric_ids: ['pareto.top20_revenue_share', 'made.up.metric'] }
    expect(validateGrounding(bad, metrics).reasons.join(' ')).toMatch(/unknown metric/)
  })

  it('rejects citing an insufficient-data metric', () => {
    const bad = { ...base, evidence_metric_ids: ['cohort.repeat_purchase_rate'] }
    expect(validateGrounding(bad, metrics).reasons.join(' ')).toMatch(/insufficient/)
  })

  it('rejects out-of-range confidence and inverted impact range', () => {
    expect(validateGrounding({ ...base, confidence: 1.5 }, metrics).ok).toBe(false)
    expect(validateGrounding({ ...base, impact_low: 2000, impact_high: 100 }, metrics).ok).toBe(
      false,
    )
  })

  it('rejects when no evidence metrics are cited', () => {
    expect(validateGrounding({ ...base, evidence_metric_ids: [] }, metrics).ok).toBe(false)
  })

  it('allows legitimate context numbers (window length, thresholds) via extraAllowedNumbers', () => {
    const withContext = {
      ...base,
      rationale: 'Your top 20% of customers drive 86% of revenue over the trailing 24 months.',
    }
    // "24" is the window length — rejected without context, allowed with it
    expect(validateGrounding(withContext, metrics).ok).toBe(false)
    expect(validateGrounding(withContext, metrics, { extraAllowedNumbers: [24] }).ok).toBe(true)
  })

  it('still rejects a large fabricated figure even with context allowances', () => {
    const bad = { ...base, rationale: 'We uncovered $999,999 of hidden revenue.' }
    expect(validateGrounding(bad, metrics, { extraAllowedNumbers: [24, 40] }).ok).toBe(false)
  })
})
