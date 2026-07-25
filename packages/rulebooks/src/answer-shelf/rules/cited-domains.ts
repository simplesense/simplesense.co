import type { Rule } from '../../types'
import type { AnswerShelfSnapshot } from '../types'

const TOP_N = 6

/** Founding rule #4: which pages actually earn the mention — feeds M2 fix sprints. */
export const citedDomainsRule: Rule<AnswerShelfSnapshot> = {
  id: 'answer_shelf.cited_domains',
  title: 'Cited-source domains',
  severity: 'medium',
  citation: { label: 'SimpleSense AnswerShelf benchmark v0 — buying-intent prompt battery' },
  remediationTemplate:
    'Strengthen the pages models already cite (structured data, freshness, authority signals); consider an AgentReady scan on the top domain if it isn’t the brand’s own site.',
  version: '0.1.0',
  addedBecause:
    "Founding rule — the plan's explicit AnswerShelf/AgentReady pairing: knowing WHICH pages earn the mention is what makes the fix sprint concrete instead of generic advice.",
  detect(snapshot) {
    if (snapshot.topCitedDomains.length === 0) {
      return {
        status: 'insufficient',
        insufficientReason:
          'No cited-source domains were returned for any mentioning response — either the models sampled don’t surface sources, or the brand wasn’t mentioned with a citation this window.',
      }
    }
    const top = snapshot.topCitedDomains.slice(0, TOP_N)
    return {
      status: 'triggered',
      evidence: {
        summary: `${top.length} distinct domain(s) cited when models mention ${snapshot.brand}, led by ${top[0]!.domain} (${top[0]!.count} citation(s)).`,
        metrics: {
          topDomainCount: top.length,
          topDomain: top[0]!.domain,
          topDomains: top.map((d) => `${d.domain} (${d.count})`).join(', '),
        },
      },
      action: `Prioritize strengthening: ${top.map((d) => d.domain).join(', ')}.`,
    }
  },
}
