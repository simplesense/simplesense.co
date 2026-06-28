/**
 * Pure numeric helpers used across the analyzers, ranking and grounding layers.
 * Deterministic by construction — no randomness, no clocks, no I/O.
 */

/** Sum of a list. Empty list → 0. */
export function sum(xs: readonly number[]): number {
  let total = 0
  for (const x of xs) total += x
  return total
}

/** Arithmetic mean. Empty list → 0 (callers should treat empty as "insufficient data"). */
export function mean(xs: readonly number[]): number {
  return xs.length === 0 ? 0 : sum(xs) / xs.length
}

/** Clamp `n` into the inclusive range [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  if (n < min) return min
  if (n > max) return max
  return n
}

/** Clamp into [0, 1] — for shares/confidences. */
export function clamp01(n: number): number {
  return clamp(n, 0, 1)
}

/** Round to `decimals` places using round-half-up on the absolute value (deterministic). */
export function roundTo(n: number, decimals = 2): number {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

/**
 * Safe ratio numerator/denominator. Returns `null` when the denominator is 0,
 * signalling "insufficient data" rather than emitting a misleading 0 or Infinity.
 */
export function safeShare(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return numerator / denominator
}

/**
 * Median of a list (linear interpolation of the two middle values for even counts).
 * Empty list → null (insufficient data). Does not mutate the input.
 */
export function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[mid] as number
  return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
}
