import { validateGrounding, rankScore, sortByRank } from '@ss/core'
import type { Recommendation } from '@ss/core'
import type { EngineInput, EngineResult, LlmClient } from './types'

export interface EngineDeps {
  llm: LlmClient
  /** Deterministic id generator (defaults to rec_1, rec_2, …). */
  idGen?: (index: number) => string
}

/**
 * Run the prescription engine: LLM synthesis (Stage 3) → grounding validation
 * (Stage 4, Prime Directive #1) → ranking (Stage 5). Recommendations that fail
 * grounding are quarantined in `rejected`, never returned as live moves.
 */
export async function runEngine(input: EngineInput, deps: EngineDeps): Promise<EngineResult> {
  const { recommendations: raws, tokensUsed = 0, model } = await deps.llm.synthesize(input)
  const idGen = deps.idGen ?? ((i: number) => `rec_${i}`)

  // Legitimate context numbers the copy may reference without citing a metric:
  // the analysis window length (e.g. 24 from "trailing_24m") and the signal thresholds.
  const extraAllowedNumbers: number[] = []
  for (const m of input.metrics) {
    const w = m.window?.match(/trailing_(\d+)m/)
    if (w?.[1]) extraAllowedNumbers.push(Number(w[1]))
  }
  for (const s of input.signals) {
    const t = s.context.threshold
    if (typeof t === 'number') extraAllowedNumbers.push(t, t * 100)
  }

  const accepted: Recommendation[] = []
  const rejected: EngineResult['rejected'] = []
  let seq = 0
  for (const raw of raws) {
    const g = validateGrounding(raw, input.metrics, { extraAllowedNumbers })
    if (!g.ok) {
      rejected.push({ raw, reasons: g.reasons })
      continue
    }
    accepted.push({
      id: idGen(++seq),
      category: raw.category,
      title: raw.title,
      rationale: raw.rationale,
      evidenceMetricIds: raw.evidence_metric_ids,
      impactLow: raw.impact_low,
      impactHigh: raw.impact_high,
      impactUnit: raw.impact_unit,
      effort: raw.effort,
      confidence: raw.confidence,
      rankScore: rankScore({
        impactLow: raw.impact_low,
        impactHigh: raw.impact_high,
        confidence: raw.confidence,
        effort: raw.effort,
      }),
      status: 'NEW',
      suggestedExecution: raw.suggested_execution,
    })
  }

  return { recommendations: sortByRank(accepted), rejected, tokensUsed, model }
}
