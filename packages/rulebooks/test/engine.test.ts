import { describe, it, expect } from 'vitest'
import { runRulebook } from '../src/engine'
import type { Rule, Rulebook } from '../src/types'

interface Ctx {
  value: number | null
}

const passingRule: Rule<Ctx> = {
  id: 'test.passing',
  title: 'Passing rule',
  severity: 'low',
  citation: { label: 'test' },
  remediationTemplate: 'template',
  version: '1.0.0',
  addedBecause: 'test fixture',
  detect: (ctx) =>
    ctx.value == null
      ? { status: 'insufficient', insufficientReason: 'no value' }
      : {
          status: 'triggered',
          evidence: { summary: `value is ${ctx.value}`, metrics: { value: ctx.value } },
          action: 'do the thing',
        },
}

const testRulebook: Rulebook<Ctx> = { module: 'test', version: '1.0.0', rules: [passingRule] }

describe('runRulebook', () => {
  it("merges each rule's static metadata with its detection result", () => {
    const [finding] = runRulebook(testRulebook, { value: 42 })
    expect(finding!).toMatchObject({
      ruleId: 'test.passing',
      title: 'Passing rule',
      severity: 'low',
      citation: { label: 'test' },
      remediationTemplate: 'template',
      ruleVersion: '1.0.0',
      addedBecause: 'test fixture',
      status: 'triggered',
      action: 'do the thing',
    })
    expect(finding!.evidence?.metrics.value).toBe(42)
  })

  it('renders insufficient rather than a guess when the rule cannot detect', () => {
    const [finding] = runRulebook(testRulebook, { value: null })
    expect(finding!.status).toBe('insufficient')
    expect(finding!.insufficientReason).toBe('no value')
    expect(finding!.evidence).toBeUndefined()
  })

  it('runs every rule in the rulebook, in order', () => {
    const secondRule: Rule<Ctx> = { ...passingRule, id: 'test.second', title: 'Second' }
    const findings = runRulebook(
      { ...testRulebook, rules: [passingRule, secondRule] },
      { value: 1 },
    )
    expect(findings.map((f) => f.ruleId)).toEqual(['test.passing', 'test.second'])
  })
})
