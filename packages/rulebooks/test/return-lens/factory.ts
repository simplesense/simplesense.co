import type { EntitySummary, ReturnsSnapshot } from '../../src/return-lens/types'
import type { Finding } from '../../src/types'

let entitySeq = 0
export function entity(over: Partial<EntitySummary> = {}): EntitySummary {
  return {
    key: `e${++entitySeq}`,
    emails: ['a@x.com'],
    spansMultipleEmails: false,
    orderCount: 4,
    returnedOrderCount: 1,
    returnRate: 0.25,
    refundTotal: 100,
    ...over,
  }
}

/** A "healthy" snapshot by default — tests override only what they're probing. */
export function snapshot(over: Partial<ReturnsSnapshot> = {}): ReturnsSnapshot {
  return {
    windowDays: 365,
    orderCount: 20,
    returnCount: 5,
    entities: [entity(), entity({ key: 'e-clean', returnRate: 0.1, returnedOrderCount: 0 })],
    cohortAvgReturnRate: 0.15,
    skuStats: [],
    bracketingCandidates: [],
    wardrobing: { totalReturns: 5, wearWindowReturns: 1, wearWindowSharePct: 20 },
    ...over,
  }
}

export function findFinding(findings: Finding[], ruleId: string): Finding {
  const f = findings.find((x) => x.ruleId === ruleId)
  if (!f)
    throw new Error(
      `finding not found: ${ruleId}. present: ${findings.map((x) => x.ruleId).join(', ')}`,
    )
  return f
}
