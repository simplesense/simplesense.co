import type { Finding, Rulebook } from './types'

/**
 * Runs every rule in a rulebook against one snapshot. Pure — no I/O, no LLM calls.
 * A rule that throws is a bug in the rule (rules must render `insufficient` for
 * missing data, never throw), so this deliberately does not catch per-rule errors —
 * let them fail loudly rather than silently drop a finding.
 */
export function runRulebook<TSnapshot>(
  rulebook: Rulebook<TSnapshot>,
  snapshot: TSnapshot,
): Finding[] {
  return rulebook.rules.map((rule) => {
    const result = rule.detect(snapshot)
    return {
      ruleId: rule.id,
      title: rule.title,
      severity: rule.severity,
      citation: rule.citation,
      remediationTemplate: rule.remediationTemplate,
      ruleVersion: rule.version,
      addedBecause: rule.addedBecause,
      ...result,
    }
  })
}
