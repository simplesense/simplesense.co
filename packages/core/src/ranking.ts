import type { Effort } from './recommendation'

/** Effort → weight; higher effort discounts the score. */
export const EFFORT_WEIGHT: Record<Effort, number> = { LOW: 1, MED: 2, HIGH: 3.5 }

/**
 * Stage 5 ranking score (§8.5): expected-impact midpoint × confidence ÷ effort weight.
 * Pure and deterministic. Higher is better.
 */
export function rankScore(input: {
  impactLow: number
  impactHigh: number
  confidence: number
  effort: Effort
}): number {
  const midpoint = (input.impactLow + input.impactHigh) / 2
  return (midpoint * input.confidence) / EFFORT_WEIGHT[input.effort]
}

/**
 * Sort a copy of the items by rankScore descending. Ties broken by higher confidence
 * then lower effort weight, so ordering is fully deterministic.
 */
export function sortByRank<
  T extends { impactLow: number; impactHigh: number; confidence: number; effort: Effort },
>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const sb = rankScore(b)
    const sa = rankScore(a)
    if (sb !== sa) return sb - sa
    if (b.confidence !== a.confidence) return b.confidence - a.confidence
    return EFFORT_WEIGHT[a.effort] - EFFORT_WEIGHT[b.effort]
  })
}
