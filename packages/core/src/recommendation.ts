export type Effort = 'LOW' | 'MED' | 'HIGH'
export type RecStatus = 'NEW' | 'VIEWED' | 'IMPLEMENTED' | 'DISMISSED'

/**
 * The exact JSON object Stage 3 (the LLM) must return per recommendation (§8.3).
 * snake_case mirrors the structured-output schema the model is forced into.
 */
export interface RawRecommendation {
  category: string
  title: string
  rationale: string
  evidence_metric_ids: string[]
  impact_low: number
  impact_high: number
  impact_unit: string
  effort: Effort
  confidence: number
  suggested_execution: { type: string; spec: Record<string, unknown> }
}

/**
 * A grounded, ranked recommendation ready to persist and render as a MoveCard (§19).
 * Pattern → Why → Move → Impact maps to title → rationale → suggestedExecution → impact.
 */
export interface Recommendation {
  id: string
  category: string
  title: string
  rationale: string
  evidenceMetricIds: string[]
  impactLow: number
  impactHigh: number
  impactUnit: string
  effort: Effort
  confidence: number
  rankScore: number
  status: RecStatus
  suggestedExecution: { type: string; spec: Record<string, unknown> }
}
