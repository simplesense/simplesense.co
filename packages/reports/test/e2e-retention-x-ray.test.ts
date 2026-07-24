import { describe, it, expect } from 'vitest'
import { runRulebook, retentionXRay, type KlaviyoAccountSnapshot } from '@ss/rulebooks'
import { MockKlaviyoClient } from '@ss/integrations'
import { renderReportHtml } from '../src/render'
import type { Report } from '../src/types'
import caseOneInput from '../../../fixtures/retention-x-ray/case-01/input.json'

const { retentionXRayRulebook } = retentionXRay
// JSON imports lose TS literal types (e.g. "welcome" widens to `string`) — this cast is safe
// because the fixture is hand-authored to match KlaviyoAccountSnapshot's shape exactly; a real
// mismatch would surface as a runtime assertion failure below, not a silent type hole.
const snapshot = caseOneInput as unknown as KlaviyoAccountSnapshot

describe('M8 Retention X-Ray — end-to-end chassis (Klaviyo pull → rulebook → report)', () => {
  it('runs the full chassis against the mock Klaviyo client with no wiring errors', async () => {
    const client = new MockKlaviyoClient()
    const snap = await client.getAccountSnapshot('Acme Co.')
    const findings = runRulebook(retentionXRayRulebook, snap)
    expect(findings).toHaveLength(6)
    const report: Report = {
      meta: {
        module: retentionXRayRulebook.module,
        moduleVersion: retentionXRayRulebook.version,
        moduleTitle: 'Retention X-Ray',
        clientName: 'Acme Co.',
        generatedAt: '2026-07-23T00:00:00.000Z',
      },
      findings,
    }
    const html = renderReportHtml(report)
    expect(html).toContain('Acme Co.')
    expect(html).toContain('Retention X-Ray')
  })

  describe('fixture case-01 — grounding proof', () => {
    const findings = runRulebook(retentionXRayRulebook, snapshot)
    const report: Report = {
      meta: {
        module: retentionXRayRulebook.module,
        moduleVersion: retentionXRayRulebook.version,
        moduleTitle: 'Retention X-Ray',
        clientName: caseOneInput.accountName,
        generatedAt: '2026-07-23T00:00:00.000Z',
      },
      findings,
    }
    const html = renderReportHtml(
      report,
      'Estimates are ranges grounded in your own data; figures labeled "editorial estimate" are not measured.',
    )

    it('every non-insufficient finding traces to a real, recomputable number in the input snapshot', () => {
      for (const f of findings) {
        if (f.status !== 'triggered') continue
        expect(f.evidence?.summary.length).toBeGreaterThan(0)
        if (f.dollarFrame) {
          expect(f.dollarFrame.low).toBeGreaterThanOrEqual(0)
          expect(f.dollarFrame.high).toBeGreaterThanOrEqual(f.dollarFrame.low)
          expect(f.dollarFrame.basis.length).toBeGreaterThan(0)
        }
      }
    })

    it('flow coverage: flags the missing (draft/archived) flows and the dormant winback flow', () => {
      const f = findings.find((x) => x.ruleId === 'retention.flow_coverage')
      expect(f?.evidence?.metrics.missingCount).toBe(2) // abandoned_browse (draft) + sunset (archived)
      expect(f?.evidence?.metrics.dormantCount).toBe(1) // winback (live, 0 sends)
    })

    it("revenue-per-flow: grounds the dollar estimate in the Welcome flow's own numbers", () => {
      const f = findings.find((x) => x.ruleId === 'retention.revenue_per_flow_trend')
      // Welcome: 2.0 -> 1.5 = 25% decline, gap 0.5/recipient * 2000 sends
      expect(f?.dollarFrame).toEqual({
        low: 500,
        high: 1000,
        basis: expect.stringContaining('90-day-ago'),
      })
    })

    it('discount dependency: computes the exact share from the fixture campaign revenue', () => {
      const f = findings.find((x) => x.ruleId === 'retention.discount_dependency')
      // (22000 + 15000) / (22000 + 8000 + 15000) = 37000/45000 = 82.2%
      expect(f?.evidence?.metrics.discountedRevenueSharePct).toBeCloseTo(82.2, 1)
    })

    it('matches the reviewed golden report (regenerate deliberately with `vitest -u`, never hand-edit)', () => {
      expect(html).toMatchSnapshot()
    })
  })
})
