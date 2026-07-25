import { describe, it, expect } from 'vitest'
import { runRulebook, answerShelf } from '@ss/rulebooks'
import type { PromptResponse } from '@ss/rulebooks'
import currentRaw from '../../../../fixtures/answer-shelf/case-01/responses.json'
import baselineRaw from '../../../../fixtures/answer-shelf/case-01/baseline-responses.json'

const { answerShelfRulebook, analyzeAnswerShelf } = answerShelf

// JSON imports widen literal types (e.g. "positive" -> string) — safe because the
// fixture is hand-authored to match PromptResponse's shape exactly; a real mismatch
// would surface as a runtime assertion failure below, not a silent type hole.
const currentResponses = currentRaw as unknown as PromptResponse[]
const baselineResponses = baselineRaw as unknown as PromptResponse[]

/**
 * "Cascade Trailwear vs. TrailForge" fixture (fixtures/answer-shelf/case-01): proves
 * the full chassis (battery responses -> analyzeAnswerShelf -> rulebook) end to end,
 * with every number hand-derived from the raw fixture files before running the test.
 */
describe('M1 AnswerShelf — end-to-end chassis (fixture case-01)', () => {
  const snapshot = analyzeAnswerShelf(
    'Cascade Trailwear',
    ['TrailForge'],
    30,
    currentResponses,
    baselineResponses,
  )
  const findings = runRulebook(answerShelfRulebook, snapshot)

  it('computes share of voice: 5 of 25 = 20%', () => {
    expect(snapshot.totalResponses).toBe(25)
    expect(snapshot.mentionCount).toBe(5)
    expect(snapshot.shareOfVoicePct).toBe(20)
  })

  it('computes first-mention rate: 2 of 5 mentions rank first = 40%', () => {
    expect(snapshot.firstMentionCount).toBe(2)
    expect(snapshot.firstMentionRatePct).toBe(40)
  })

  it('tallies sentiment across the 5 mentions: 3 positive, 1 neutral, 1 negative', () => {
    expect(snapshot.sentimentCounts).toEqual({ positive: 3, neutral: 1, negative: 1 })
  })

  it('aggregates cited domains, most-cited first', () => {
    expect(snapshot.topCitedDomains).toEqual([
      { domain: 'cascadetrailwear.com', count: 3 },
      { domain: 'gearjunkie.com', count: 2 },
      { domain: 'outdoorgearlab.com', count: 1 },
    ])
  })

  it('computes TrailForge at 10 of 25 = 40% share of voice', () => {
    expect(snapshot.competitorShares).toEqual([
      { brand: 'TrailForge', mentionCount: 10, shareOfVoicePct: 40 },
    ])
  })

  it('computes the baseline share of voice: 8 of 25 = 32%', () => {
    expect(snapshot.baselineShareOfVoicePct).toBe(32)
  })

  it('produces all 6 findings, every one triggered (no insufficient — the fixture clears every sampling floor)', () => {
    expect(findings).toHaveLength(6)
    expect(findings.every((f) => f.status === 'triggered')).toBe(true)
  })

  it('competitor-delta rule reports the 20-point gap to TrailForge', () => {
    const f = findings.find((x) => x.ruleId === 'answer_shelf.competitor_delta')
    expect(f?.evidence?.metrics.gapPct).toBe(20) // 40 - 20
  })

  it('week-over-week rule reports a 12-point decline and flags it for investigation', () => {
    const f = findings.find((x) => x.ruleId === 'answer_shelf.week_over_week_trend')
    expect(f?.evidence?.metrics.deltaPct).toBe(-12) // 20 - 32
    expect(f?.action).toMatch(/investigate the decline/i)
  })

  it('sentiment rule flags the 20% negative share as worth a look', () => {
    const f = findings.find((x) => x.ruleId === 'answer_shelf.sentiment')
    expect(f?.action).toMatch(/recurring complaint/i)
  })
})
