import type { Finding } from '../types'

export interface AgentReadyScore {
  /** 0-100, or null when nothing could be assessed (e.g. the product page never loaded). */
  score: number | null
  passedCount: number
  /** Findings that actually rendered a pass/fail verdict — excludes `insufficient` findings. */
  assessedCount: number
}

/**
 * Turns rule findings into the plan's "URL → score" number for the free scanner.
 * Reads the `passed` field each M2 rule sets explicitly (never inferred from `action`
 * text) — see `types.ts`'s doc comment on `DetectionResult.passed` for why.
 */
export function computeAgentReadyScore(findings: Finding[]): AgentReadyScore {
  const assessed = findings.filter((f) => f.status === 'triggered' && f.passed !== undefined)
  const passedCount = assessed.filter((f) => f.passed === true).length
  return {
    score: assessed.length > 0 ? Math.round((passedCount / assessed.length) * 100) : null,
    passedCount,
    assessedCount: assessed.length,
  }
}
