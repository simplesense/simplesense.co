import type { Metric } from '@ss/core'

/**
 * Strict metric readers for the vertical demo pages.
 *
 * These pages are statically generated, so anything these functions throw fails the
 * BUILD rather than shipping. That is deliberate and is the whole point: on
 * 2026-07-31 a `?? 0` default turned an insufficient-data metric into the live public
 * claim "launch a replenishment flow timed to your 0-day reorder cycle" on
 * /for/pet-brands — a fabricated number on a page whose own copy promises "every
 * figure below is computed by SimpleSense's real analysis pipeline." That is exactly
 * the Grounding invariant (CLAUDE.md #1) inverted.
 *
 * Rule: never default a missing metric to a number. Either the metric is genuinely
 * computable (use these), or the claim must be dropped from the page (use
 * `optionalMetric` and omit the move).
 */

function read(metrics: Map<string, Metric>, key: string): number | null {
  const m = metrics.get(key)
  if (!m || m.insufficientData || m.valueNumeric == null) return null
  return m.valueNumeric
}

/** A metric the page's copy depends on. Throws (failing the build) when insufficient. */
export function requiredMetric(metrics: Map<string, Metric>, key: string): number {
  const v = read(metrics, key)
  if (v == null) {
    throw new Error(
      `[verticals] Metric "${key}" is insufficient/missing, but a demo page's copy cites it. ` +
        `Do NOT default it to 0 — either make the synthetic store produce real data for it, ` +
        `or drop the claim that cites it. See packages/verticals/src/demo/metric-access.ts.`,
    )
  }
  return v
}

/** A ratio metric (0..1) the page depends on, returned as a rounded percentage. */
export function requiredPct(metrics: Map<string, Metric>, key: string): number {
  return Math.round(requiredMetric(metrics, key) * 1000) / 10
}

/** A metric the page can live without — caller MUST handle null by omitting the claim. */
export function optionalMetric(metrics: Map<string, Metric>, key: string): number | null {
  return read(metrics, key)
}
