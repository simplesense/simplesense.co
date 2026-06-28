import { describe, it, expect } from 'vitest'
import {
  runAnalyzers,
  detectSignals,
  type AnalyzerContext,
  type NormalizedStore,
  type Order,
  type RawRecommendation,
} from '@ss/core'
import { runEngine, MockLlmClient, createLlmClient, AnthropicLlmClient } from '../src/index'
import type { EngineInput, LlmClient, LlmResult } from '../src/index'

const NOW = new Date('2026-06-01T00:00:00.000Z')

function omnichannelStore(): NormalizedStore {
  const near = { region: 'CA', lat: 0, lng: 0.05 }
  const far = { region: 'NY', lat: 10, lng: 10 }
  const order = (id: string, cid: string, total: number, addr: typeof near): Order => ({
    id,
    customerId: cid,
    createdAt: new Date('2025-09-01T00:00:00.000Z'),
    totalPrice: total,
    discountTotal: 0,
    currency: 'USD',
    refundedAmount: 0,
    lineItems: [],
    shippingAddress: addr,
  })
  return {
    storeId: 's1',
    currency: 'USD',
    hasPhysicalLocations: true,
    locations: [{ id: 'l1', name: 'Flagship', lat: 0, lng: 0 }],
    customers: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map((id) => ({ id })),
    products: [],
    orders: [
      order('o1', 'c1', 500, near),
      order('o2', 'c2', 400, near),
      order('o3', 'c3', 60, near),
      order('o4', 'c4', 40, near),
      order('o5', 'c5', 30, far),
      order('o6', 'c6', 20, far),
    ],
    freeShippingThreshold: null,
  }
}

function inputFor(store: NormalizedStore): EngineInput {
  const ctx: AnalyzerContext = { store, now: NOW, windowMonths: 24 }
  const metrics = runAnalyzers(ctx)
  return { metrics, signals: detectSignals(metrics) }
}

describe('runEngine — happy path with the mock LLM', () => {
  it('produces grounded VIP + geo moves, all citing real metric ids, ranked', async () => {
    const input = inputFor(omnichannelStore())
    const res = await runEngine(input, { llm: new MockLlmClient() })

    expect(res.rejected).toEqual([]) // mock output is grounded by construction
    const categories = res.recommendations.map((r) => r.category)
    expect(categories).toContain('VIP / retention')
    expect(categories).toContain('Geo / acquisition')

    const metricKeys = new Set(input.metrics.map((m) => m.key))
    for (const r of res.recommendations) {
      expect(r.evidenceMetricIds.length).toBeGreaterThan(0)
      for (const id of r.evidenceMetricIds) expect(metricKeys.has(id)).toBe(true)
    }
    // ranked descending and ids assigned deterministically
    const scores = res.recommendations.map((r) => r.rankScore)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)
    expect(res.recommendations[0]?.id).toBe('rec_1')
  })
})

describe('runEngine — grounding rejection (Prime Directive #1)', () => {
  it('quarantines a hallucinated recommendation and keeps the grounded one', async () => {
    const input = inputFor(omnichannelStore())
    const top20 =
      input.metrics.find((m) => m.key === 'pareto.top20_revenue_share')?.valueNumeric ?? 0

    const good: RawRecommendation = {
      category: 'VIP / retention',
      title: 'Build your top-20% VIP segment',
      rationale: `Your top 20% of customers drive ${Math.round(top20 * 100)}% of revenue.`,
      evidence_metric_ids: ['pareto.top20_revenue_share'],
      impact_low: 100,
      impact_high: 200,
      impact_unit: 'USD/month',
      effort: 'LOW',
      confidence: 0.8,
      suggested_execution: { type: 'klaviyo_segment', spec: {} },
    }
    const hallucinated: RawRecommendation = {
      ...good,
      title: 'Capture hidden revenue',
      rationale: 'We found $999,999 of hidden revenue you can capture this month.',
    }

    const fake: LlmClient = {
      synthesize: (): Promise<LlmResult> =>
        Promise.resolve({ recommendations: [good, hallucinated], tokensUsed: 7, model: 'fake' }),
    }
    const res = await runEngine(input, { llm: fake })

    expect(res.recommendations).toHaveLength(1)
    expect(res.recommendations[0]?.title).toBe('Build your top-20% VIP segment')
    expect(res.rejected).toHaveLength(1)
    expect(res.rejected[0]?.reasons.join(' ')).toMatch(/999999|not grounded/)
    expect(res.tokensUsed).toBe(7)
  })
})

describe('createLlmClient', () => {
  it('returns the mock with no key and the Anthropic client with one', () => {
    expect(createLlmClient({})).toBeInstanceOf(MockLlmClient)
    expect(createLlmClient({ ANTHROPIC_API_KEY: 'sk-test' })).toBeInstanceOf(AnthropicLlmClient)
  })
})
