import { describe, it, expect } from 'vitest'
import { computeAgentReadyScore } from '../../src/agent-ready/score'
import type { Finding } from '../../src/types'

function finding(over: Partial<Finding> = {}): Finding {
  return {
    ruleId: 'r1',
    title: 'Rule',
    severity: 'medium',
    citation: { label: 'x' },
    remediationTemplate: 'x',
    ruleVersion: '0.1.0',
    addedBecause: 'x',
    status: 'triggered',
    passed: true,
    ...over,
  }
}

describe('computeAgentReadyScore', () => {
  it('is null when there is nothing assessable', () => {
    expect(
      computeAgentReadyScore([finding({ status: 'insufficient', passed: undefined })]),
    ).toEqual({
      score: null,
      passedCount: 0,
      assessedCount: 0,
    })
  })

  it('is 100 when every assessed rule passed', () => {
    const findings = [finding({ passed: true }), finding({ ruleId: 'r2', passed: true })]
    expect(computeAgentReadyScore(findings)).toEqual({
      score: 100,
      passedCount: 2,
      assessedCount: 2,
    })
  })

  it('is 0 when every assessed rule failed', () => {
    const findings = [finding({ passed: false }), finding({ ruleId: 'r2', passed: false })]
    expect(computeAgentReadyScore(findings)).toEqual({ score: 0, passedCount: 0, assessedCount: 2 })
  })

  it('rounds a partial score', () => {
    // 2 of 3 passed = 66.66... -> 67
    const findings = [
      finding({ ruleId: 'r1', passed: true }),
      finding({ ruleId: 'r2', passed: true }),
      finding({ ruleId: 'r3', passed: false }),
    ]
    expect(computeAgentReadyScore(findings).score).toBe(67)
  })

  it('excludes insufficient findings from the denominator', () => {
    const findings = [
      finding({ ruleId: 'r1', passed: true }),
      finding({ ruleId: 'r2', status: 'insufficient', passed: undefined, evidence: undefined }),
    ]
    expect(computeAgentReadyScore(findings)).toEqual({
      score: 100,
      passedCount: 1,
      assessedCount: 1,
    })
  })
})
