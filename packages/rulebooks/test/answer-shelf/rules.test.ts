import { describe, it, expect } from 'vitest'
import { runRulebook } from '../../src/engine'
import { answerShelfRulebook } from '../../src/answer-shelf/rulebook'
import { snapshot, findFinding } from './factory'

describe('shareOfVoiceRule', () => {
  it('is insufficient below the sampling floor', () => {
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot({ shareOfVoicePct: null, totalResponses: 10 })),
      'answer_shelf.share_of_voice',
    )
    expect(f.status).toBe('insufficient')
  })

  it('reports the share-of-voice percentage', () => {
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot()),
      'answer_shelf.share_of_voice',
    )
    expect(f.status).toBe('triggered')
    expect(f.evidence?.metrics.shareOfVoicePct).toBe(12)
  })
})

describe('firstMentionRateRule', () => {
  it('is insufficient below the mention floor', () => {
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot({ firstMentionRatePct: null, mentionCount: 2 })),
      'answer_shelf.first_mention_rate',
    )
    expect(f.status).toBe('insufficient')
  })

  it('reports no gap when the brand leads most mentions', () => {
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot({ firstMentionRatePct: 60 })),
      'answer_shelf.first_mention_rate',
    )
    expect(f.action).toMatch(/no gap/i)
  })

  it('flags a low first-mention rate', () => {
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot({ firstMentionRatePct: 20 })),
      'answer_shelf.first_mention_rate',
    )
    expect(f.action).toMatch(/investigate/i)
  })
})

describe('sentimentRule', () => {
  it('is insufficient below the mention floor', () => {
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot({ mentionCount: 2 })),
      'answer_shelf.sentiment',
    )
    expect(f.status).toBe('insufficient')
  })

  it('reports no gap when negative share is low', () => {
    const f = findFinding(
      runRulebook(
        answerShelfRulebook,
        snapshot({ mentionCount: 30, sentimentCounts: { positive: 25, neutral: 4, negative: 1 } }),
      ),
      'answer_shelf.sentiment',
    )
    expect(f.action).toMatch(/no gap/i)
  })

  it('flags a concerning negative share (>=15%)', () => {
    const f = findFinding(
      runRulebook(
        answerShelfRulebook,
        snapshot({ mentionCount: 20, sentimentCounts: { positive: 10, neutral: 5, negative: 5 } }),
      ),
      'answer_shelf.sentiment',
    )
    expect(f.action).toMatch(/recurring complaint/i)
  })
})

describe('citedDomainsRule', () => {
  it('is insufficient with no cited domains', () => {
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot({ topCitedDomains: [] })),
      'answer_shelf.cited_domains',
    )
    expect(f.status).toBe('insufficient')
  })

  it('reports the top domains, capped at 6', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ domain: `site${i}.com`, count: 10 - i }))
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot({ topCitedDomains: many })),
      'answer_shelf.cited_domains',
    )
    expect(f.evidence?.metrics.topDomainCount).toBe(6)
    expect(f.evidence?.metrics.topDomain).toBe('site0.com')
  })
})

describe('competitorDeltaRule', () => {
  it('is insufficient with no share-of-voice figure', () => {
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot({ shareOfVoicePct: null })),
      'answer_shelf.competitor_delta',
    )
    expect(f.status).toBe('insufficient')
  })

  it('is insufficient with no competitors configured', () => {
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot({ competitorShares: [] })),
      'answer_shelf.competitor_delta',
    )
    expect(f.status).toBe('insufficient')
  })

  it('reports the gap to the leading competitor', () => {
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot()),
      'answer_shelf.competitor_delta',
    )
    expect(f.evidence?.metrics.topCompetitor).toBe('Rival Co.')
    expect(f.evidence?.metrics.gapPct).toBe(28) // 40 - 12
  })

  it('reports no gap when the brand leads its competitors', () => {
    const f = findFinding(
      runRulebook(
        answerShelfRulebook,
        snapshot({
          shareOfVoicePct: 50,
          competitorShares: [{ brand: 'Rival Co.', mentionCount: 10, shareOfVoicePct: 10 }],
        }),
      ),
      'answer_shelf.competitor_delta',
    )
    expect(f.action).toMatch(/no gap/i)
  })
})

describe('weekOverWeekTrendRule', () => {
  it('is insufficient with no baseline', () => {
    const f = findFinding(
      runRulebook(answerShelfRulebook, snapshot({ baselineShareOfVoicePct: null })),
      'answer_shelf.week_over_week_trend',
    )
    expect(f.status).toBe('insufficient')
    expect(f.insufficientReason).toContain('first battery run')
  })

  it('flags a declining trend', () => {
    const f = findFinding(
      runRulebook(
        answerShelfRulebook,
        snapshot({ shareOfVoicePct: 8, baselineShareOfVoicePct: 15 }),
      ),
      'answer_shelf.week_over_week_trend',
    )
    expect(f.evidence?.metrics.deltaPct).toBe(-7)
    expect(f.action).toMatch(/investigate the decline/i)
  })

  it('reports no gap for a flat or improving trend', () => {
    const f = findFinding(
      runRulebook(
        answerShelfRulebook,
        snapshot({ shareOfVoicePct: 15, baselineShareOfVoicePct: 12 }),
      ),
      'answer_shelf.week_over_week_trend',
    )
    expect(f.action).toMatch(/no gap/i)
  })
})
