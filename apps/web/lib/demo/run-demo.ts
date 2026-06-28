import { runAnalyzers, detectSignals, type Metric, type Recommendation } from '@ss/core'
import { runEngine, createLlmClient } from '@ss/engine'
import { SIGNAL_THRESHOLDS, ANALYSIS_WINDOW_MONTHS } from '@ss/config'
import { makeSeedStore } from './seed-store'

export interface DemoResult {
  storeName: string
  metrics: Metric[]
  recommendations: Recommendation[]
  rejectedCount: number
  model?: string
}

/**
 * Run the full prescription pipeline over the seed store: analyzers → signals → engine
 * (mock LLM unless ANTHROPIC_API_KEY is set). This is what the dashboard renders, so the
 * demo exercises the exact same grounded path a real store would.
 */
export async function runDemo(): Promise<DemoResult> {
  const now = new Date()
  const store = makeSeedStore(now)
  const ctx = { store, now, windowMonths: ANALYSIS_WINDOW_MONTHS }
  const metrics = runAnalyzers(ctx)
  const signals = detectSignals(metrics, SIGNAL_THRESHOLDS)
  const result = await runEngine({ signals, metrics }, { llm: createLlmClient() })
  return {
    storeName: 'Wildflower Skincare',
    metrics,
    recommendations: result.recommendations,
    rejectedCount: result.rejected.length,
    model: result.model,
  }
}

/** Pull a metric numeric value by key (for the dashboard KPI tiles). */
export function metricValue(metrics: Metric[], key: string): number | null {
  return metrics.find((m) => m.key === key)?.valueNumeric ?? null
}
