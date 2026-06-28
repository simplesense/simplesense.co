import { runAnalyzers, detectSignals, type Metric, type Recommendation } from '@ss/core'
import { runEngine, createLlmClient, MockLlmClient } from '@ss/engine'
import { SIGNAL_THRESHOLDS, ANALYSIS_WINDOW_MONTHS } from '@ss/config'
import { makeSeedStore } from './seed-store'

export interface DemoResult {
  storeName: string
  metrics: Metric[]
  recommendations: Recommendation[]
  rejectedCount: number
  model?: string
}

// In-memory cache for the server's lifetime. The seed store is static, so we only pay
// for one live Claude synthesis per server run; subsequent dashboard/audit loads are
// instant and free. Pass force=true to recompute.
let demoCache: DemoResult | null = null

/**
 * Run the full prescription pipeline over the seed store: analyzers → signals → engine
 * (mock LLM unless ANTHROPIC_API_KEY is set). This is what the dashboard renders, so the
 * demo exercises the exact same grounded path a real store would. Result is cached.
 */
export async function runDemo(force = false): Promise<DemoResult> {
  if (demoCache && !force) return demoCache
  const now = new Date()
  const store = makeSeedStore(now)
  const ctx = { store, now, windowMonths: ANALYSIS_WINDOW_MONTHS }
  const metrics = runAnalyzers(ctx)
  const signals = detectSignals(metrics, SIGNAL_THRESHOLDS)

  // Live Claude synthesis when ANTHROPIC_API_KEY is set; fall back to the deterministic
  // mock if the live call errors so the dashboard never breaks on a transient API issue.
  let result = await runEngine({ signals, metrics }, { llm: createLlmClient() }).catch(
    async (err: unknown) => {
      console.warn('[demo] live synthesis failed, using mock:', (err as Error).message)
      return runEngine({ signals, metrics }, { llm: new MockLlmClient() })
    },
  )
  // If live synthesis returned zero grounded moves (e.g. all quarantined), keep the mock
  // so the demo still shows the intended moves.
  if (result.recommendations.length === 0) {
    result = await runEngine({ signals, metrics }, { llm: new MockLlmClient() })
  }

  console.log(
    '[demo] model=%s moves=%d rejected=%d',
    result.model,
    result.recommendations.length,
    result.rejected.length,
  )
  for (const r of result.rejected) {
    console.log('[demo][rejected] %s :: %s', r.raw.title, r.reasons.join(' | '))
  }
  demoCache = {
    storeName: 'Wildflower Skincare',
    metrics,
    recommendations: result.recommendations,
    rejectedCount: result.rejected.length,
    model: result.model,
  }
  return demoCache
}

/** Pull a metric numeric value by key (for the dashboard KPI tiles). */
export function metricValue(metrics: Metric[], key: string): number | null {
  return metrics.find((m) => m.key === key)?.valueNumeric ?? null
}
