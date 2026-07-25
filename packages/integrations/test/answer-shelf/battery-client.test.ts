import { describe, it, expect } from 'vitest'
import { MockAnswerShelfBattery } from '../../src/answer-shelf/battery-client'

describe('MockAnswerShelfBattery', () => {
  it('returns 25 responses with no baseline', async () => {
    const result = await new MockAnswerShelfBattery().runBattery('Acme Co.', ['Rival Co.'], 30)
    expect(result.responses).toHaveLength(25)
    expect(result.baselineResponses).toBeNull()
  })

  it('mentions the brand in exactly 5 of the 25 responses', async () => {
    const result = await new MockAnswerShelfBattery().runBattery('Acme Co.', ['Rival Co.'], 30)
    expect(result.responses.filter((r) => r.mentionsBrand)).toHaveLength(5)
  })

  it('cycles across all 4 mock providers', async () => {
    const result = await new MockAnswerShelfBattery().runBattery('Acme Co.', ['Rival Co.'], 30)
    const models = new Set(result.responses.map((r) => r.model))
    expect(models).toEqual(new Set(['claude-opus-5', 'gpt-5', 'gemini-3-pro', 'perplexity-sonar']))
  })

  it('falls back to a placeholder competitor name when none is configured', async () => {
    const result = await new MockAnswerShelfBattery().runBattery('Acme Co.', [], 30)
    const withCompetitorMention = result.responses.find(
      (r) => Object.keys(r.competitorMentions).length > 0,
    )
    expect(withCompetitorMention?.competitorMentions).toEqual({
      'Competitor Co.': expect.any(Number),
    })
  })
})
