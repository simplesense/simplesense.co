import type { Metric } from './types'
import type { RawRecommendation } from './recommendation'

export interface GroundingResult {
  ok: boolean
  reasons: string[]
}

/** Structural integers that legitimately appear in copy (e.g. "top 20%", "3 zip clusters"). */
const STRUCTURAL = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 50, 75, 100])

/** Relative/absolute tolerance for matching a copy number to a computed fact. */
function close(n: number, fact: number): boolean {
  return Math.abs(n - fact) <= Math.max(0.5, Math.abs(fact) * 0.02)
}

/** Collect every numeric leaf in a JSON value. */
function numericLeaves(value: unknown, out: number[]): void {
  if (typeof value === 'number' && Number.isFinite(value)) out.push(value)
  else if (Array.isArray(value)) for (const v of value) numericLeaves(v, out)
  else if (value && typeof value === 'object')
    for (const v of Object.values(value)) numericLeaves(v, out)
}

/** Expand a metric value into the forms it may legitimately appear as in copy. */
function factsFromMetric(m: Metric): number[] {
  const facts: number[] = []
  if (m.valueNumeric != null) {
    const v = m.valueNumeric
    facts.push(v, Math.round(v), Math.round(v * 10) / 10, Math.round(v * 100) / 100)
    // ratios commonly rendered as percentages
    facts.push(v * 100, Math.round(v * 100), Math.round(v * 1000) / 10)
  }
  numericLeaves(m.valueJson, facts)
  return facts
}

/**
 * Pull number MAGNITUDES out of free text: handles $, %, and thousands separators.
 * Sign is intentionally ignored ("top-20%" must not parse as -20, and "-$20" margin
 * should match a metric value of -20) — callers compare against |fact| too.
 */
function extractNumbers(text: string): number[] {
  const matches = text.match(/\d[\d,]*\.?\d*\s*%?/g) ?? []
  const nums: number[] = []
  for (const raw of matches) {
    const cleaned = raw.replace(/[$,%\s]/g, '')
    const n = Number(cleaned)
    if (Number.isFinite(n)) nums.push(n)
  }
  return nums
}

/**
 * Stage 4 — grounding validation (Prime Directive #1 enforcement). For one
 * recommendation, confirm:
 *  1. every evidence_metric_id exists in the run's metrics and is not insufficient,
 *  2. confidence is a probability,
 *  3. impact is a sane ordered non-negative range,
 *  4. every number appearing in the rationale/title/impact traces to a CITED metric
 *     value (within source precision) or is a structural integer.
 * A failing recommendation is rejected/quarantined, never shown.
 */
export interface GroundingOpts {
  /**
   * Extra numbers that are legitimately part of the analysis context and may appear in
   * copy without citing a metric — e.g. the analysis window length (24) and the signal
   * thresholds the move references. These are config, not fabricated store data.
   */
  extraAllowedNumbers?: readonly number[]
}

export function validateGrounding(
  rec: RawRecommendation,
  metrics: readonly Metric[],
  opts: GroundingOpts = {},
): GroundingResult {
  const reasons: string[] = []
  const byKey = new Map(metrics.map((m) => [m.key, m]))

  // 1. evidence ids exist and are usable
  const cited: Metric[] = []
  for (const id of rec.evidence_metric_ids) {
    const m = byKey.get(id)
    if (!m) {
      reasons.push(`cites unknown metric id "${id}"`)
      continue
    }
    if (m.insufficientData || m.valueNumeric == null) {
      reasons.push(`cites insufficient-data metric "${id}"`)
      continue
    }
    cited.push(m)
  }
  if (rec.evidence_metric_ids.length === 0) reasons.push('cites no evidence metrics')

  // 2. confidence
  if (!(rec.confidence >= 0 && rec.confidence <= 1))
    reasons.push(`confidence ${rec.confidence} out of [0,1]`)

  // 3. impact range
  if (!(rec.impact_low >= 0) || !(rec.impact_high >= 0)) reasons.push('impact must be >= 0')
  if (rec.impact_low > rec.impact_high) reasons.push('impact_low > impact_high')

  // 4. every number in copy must be explainable by a cited metric (or structural)
  const allowed: number[] = [
    rec.impact_low,
    rec.impact_high,
    (rec.impact_low + rec.impact_high) / 2,
    ...(opts.extraAllowedNumbers ?? []),
  ]
  for (const m of cited) allowed.push(...factsFromMetric(m))

  const copyNumbers = [...extractNumbers(rec.rationale), ...extractNumbers(rec.title)]
  for (const n of copyNumbers) {
    if (STRUCTURAL.has(n)) continue
    if (allowed.some((f) => close(n, f) || close(n, Math.abs(f)))) continue
    reasons.push(`number ${n} in copy is not grounded in any cited metric`)
  }

  return { ok: reasons.length === 0, reasons }
}
