import { describe, it, expect } from 'vitest'
import { analyzeAnswerShelf } from '../../src/answer-shelf/derive'
import type { PromptResponse } from '../../src/answer-shelf/types'

function response(over: Partial<PromptResponse> = {}): PromptResponse {
  return {
    promptId: 'p1',
    model: 'claude',
    sampledAt: '2026-07-01T00:00:00Z',
    mentionsBrand: false,
    brandMentionRank: null,
    sentiment: null,
    citedDomains: [],
    competitorMentions: {},
    ...over,
  }
}

function mentioning(over: Partial<PromptResponse> = {}): PromptResponse {
  return response({ mentionsBrand: true, brandMentionRank: 2, sentiment: 'positive', ...over })
}

describe('analyzeAnswerShelf — share of voice', () => {
  it('is null below the sampling floor (20 responses)', () => {
    const responses = Array.from({ length: 19 }, () => mentioning())
    const snap = analyzeAnswerShelf('Acme', [], 30, responses, null)
    expect(snap.shareOfVoicePct).toBeNull()
    expect(snap.totalResponses).toBe(19)
  })

  it('computes a percentage once the floor is met', () => {
    // 25 responses, 3 mention the brand -> 12%
    const responses = [
      ...Array.from({ length: 3 }, () => mentioning()),
      ...Array.from({ length: 22 }, () => response()),
    ]
    const snap = analyzeAnswerShelf('Acme', [], 30, responses, null)
    expect(snap.mentionCount).toBe(3)
    expect(snap.shareOfVoicePct).toBe(12)
  })
})

describe('analyzeAnswerShelf — first-mention rate', () => {
  it('is null below the mention floor (5 mentioning responses)', () => {
    const responses = [
      ...Array.from({ length: 4 }, () => mentioning({ brandMentionRank: 1 })),
      ...Array.from({ length: 20 }, () => response()),
    ]
    const snap = analyzeAnswerShelf('Acme', [], 30, responses, null)
    expect(snap.firstMentionRatePct).toBeNull()
  })

  it('computes the rate once the floor is met', () => {
    // 8 mentioning, 2 of them rank 1 -> 25%
    const responses = [
      ...Array.from({ length: 2 }, () => mentioning({ brandMentionRank: 1 })),
      ...Array.from({ length: 6 }, () => mentioning({ brandMentionRank: 3 })),
      ...Array.from({ length: 20 }, () => response()),
    ]
    const snap = analyzeAnswerShelf('Acme', [], 30, responses, null)
    expect(snap.firstMentionCount).toBe(2)
    expect(snap.firstMentionRatePct).toBe(25)
  })
})

describe('analyzeAnswerShelf — sentiment', () => {
  it('tallies sentiment only across mentioning responses', () => {
    const responses = [
      mentioning({ sentiment: 'positive' }),
      mentioning({ sentiment: 'positive' }),
      mentioning({ sentiment: 'negative' }),
      response({ sentiment: null }),
    ]
    const snap = analyzeAnswerShelf('Acme', [], 30, responses, null)
    expect(snap.sentimentCounts).toEqual({ positive: 2, neutral: 0, negative: 1 })
  })
})

describe('analyzeAnswerShelf — cited domains', () => {
  it('aggregates and sorts by count, most-cited first', () => {
    const responses = [
      mentioning({ citedDomains: ['acme.com', 'reviews.example.com'] }),
      mentioning({ citedDomains: ['acme.com'] }),
      mentioning({ citedDomains: ['blog.example.com'] }),
    ]
    const snap = analyzeAnswerShelf('Acme', [], 30, responses, null)
    expect(snap.topCitedDomains).toEqual([
      { domain: 'acme.com', count: 2 },
      { domain: 'reviews.example.com', count: 1 },
      { domain: 'blog.example.com', count: 1 },
    ])
  })
})

describe('analyzeAnswerShelf — competitor shares', () => {
  it('computes each tracked competitor share of voice across all responses', () => {
    const responses = [
      response({ competitorMentions: { Rival: 1 } }),
      response({ competitorMentions: { Rival: 2 } }),
      response({ competitorMentions: {} }),
      response({ competitorMentions: {} }),
    ]
    const snap = analyzeAnswerShelf('Acme', ['Rival'], 30, responses, null)
    expect(snap.competitorShares).toEqual([
      { brand: 'Rival', mentionCount: 2, shareOfVoicePct: 50 },
    ])
  })
})

describe('analyzeAnswerShelf — baseline trend', () => {
  it('is null when there is no baseline', () => {
    const snap = analyzeAnswerShelf('Acme', [], 30, [mentioning()], null)
    expect(snap.baselineShareOfVoicePct).toBeNull()
  })

  it('computes the baseline share of voice when provided and above the floor', () => {
    const current = Array.from({ length: 20 }, () => response())
    const baseline = [
      ...Array.from({ length: 5 }, () => mentioning()),
      ...Array.from({ length: 20 }, () => response()),
    ]
    const snap = analyzeAnswerShelf('Acme', [], 30, current, baseline)
    expect(snap.baselineShareOfVoicePct).toBe(20) // 5/25
  })
})
