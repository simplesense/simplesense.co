import type { Rulebook } from '../types'
import type { AnswerShelfSnapshot } from './types'
import { shareOfVoiceRule } from './rules/share-of-voice'
import { firstMentionRateRule } from './rules/first-mention-rate'
import { sentimentRule } from './rules/sentiment'
import { citedDomainsRule } from './rules/cited-domains'
import { competitorDeltaRule } from './rules/competitor-delta'
import { weekOverWeekTrendRule } from './rules/week-over-week-trend'

/**
 * M1 AnswerShelf, v0 — deterministic aggregation over LLM battery responses, matching
 * M8/M5's own precedent. Bump this version whenever a rule is added, removed, or its
 * detection logic/thresholds change.
 */
export const answerShelfRulebook: Rulebook<AnswerShelfSnapshot> = {
  module: 'answer-shelf',
  version: '0.1.0',
  rules: [
    shareOfVoiceRule,
    firstMentionRateRule,
    sentimentRule,
    citedDomainsRule,
    competitorDeltaRule,
    weekOverWeekTrendRule,
  ],
}
