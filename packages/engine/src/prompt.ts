import type { Metric, Signal } from '@ss/core'
import type { EngineInput } from './types'

/**
 * Stage-3 system prompt — implemented verbatim from SIMPLE_SENSE_BUILD_PROMPT.md §8.3.
 * Tune wording, never the rules.
 */
export const SYSTEM_PROMPT = `You are the prescription engine for Simple Sense, an advisor to a $1M-$15M Shopify merchant. You are given a set of SIGNALS, each with the exact computed metrics behind it. Produce a list of prescriptive recommendations in the required JSON schema. Hard rules: (1) Use ONLY the numbers provided — never invent, round beyond the source precision, or extrapolate a figure that is not given. (2) Every recommendation must cite the metric ids it relies on in evidence_metric_ids. (3) impact_low/impact_high must be a defensible range derived from the provided metrics; if you cannot ground an impact in the data, set both to 0 and say so in the rationale. (4) Be specific and operator-grade: each recommendation says exactly what to do, why, and the expected effect. (5) Prefer fewer, higher-conviction moves over a long weak list. (6) No hype, no vague "optimize" language. (7) For geo/acquisition signals, honor the has_physical_locations flag: if true, you may recommend local pickup / BOPIS / foot-traffic plays; if false, recommend regional ad-targeting, inventory placement, or regional shipping offers instead — never tell an online-only store to drive in-store foot traffic. (8) Do NOT state the length of the analysis window, any external/industry benchmark, or any number that is not one of the provided metric values or your own impact_low/impact_high. (9) When you recommend a target (a new price, threshold, budget, etc.), express it RELATIVE to a provided metric (e.g. "raise it toward your $X average order value") rather than inventing a specific new number. Every percentage and dollar figure in your rationale must equal a provided metric value (you may render a ratio like 0.717 as "72%"). Return only valid JSON.`

/** JSON Schema for the structured output / tool the model is forced to call. */
export const RECOMMENDATION_TOOL_SCHEMA = {
  name: 'emit_recommendations',
  description: 'Return the ranked prescriptive recommendations for this store.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['recommendations'],
    properties: {
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'category',
            'title',
            'rationale',
            'evidence_metric_ids',
            'impact_low',
            'impact_high',
            'impact_unit',
            'effort',
            'confidence',
            'suggested_execution',
          ],
          properties: {
            category: { type: 'string' },
            title: { type: 'string', maxLength: 80 },
            rationale: { type: 'string' },
            evidence_metric_ids: { type: 'array', items: { type: 'string' } },
            impact_low: { type: 'number' },
            impact_high: { type: 'number' },
            impact_unit: { type: 'string' },
            effort: { type: 'string', enum: ['LOW', 'MED', 'HIGH'] },
            confidence: { type: 'number' },
            suggested_execution: {
              type: 'object',
              required: ['type', 'spec'],
              properties: { type: { type: 'string' }, spec: { type: 'object' } },
            },
          },
        },
      },
    },
  },
} as const

/** Only the metrics a signal actually references — the grounding allow-list for the model. */
function metricsForSignals(input: EngineInput): Metric[] {
  const wanted = new Set(input.signals.flatMap((s) => s.metricKeys))
  return input.metrics.filter(
    (m) => wanted.has(m.key) && !m.insufficientData && m.valueNumeric != null,
  )
}

/** Compact, PII-free user payload: signals + just the metrics behind them. */
export function buildUserPayload(input: EngineInput): string {
  const metrics = metricsForSignals(input).map((m) => ({
    id: m.key,
    value: m.valueNumeric,
    unit: m.unit,
    window: m.window,
    detail: m.valueJson,
  }))
  const signals = input.signals.map((s: Signal) => ({
    type: s.type,
    severity: s.severity,
    triggered_by: s.metricKey,
    value: s.value,
    cites: s.metricKeys,
    context: s.context,
  }))
  return JSON.stringify({ signals, metrics }, null, 2)
}
