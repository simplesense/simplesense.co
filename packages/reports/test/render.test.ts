import { describe, it, expect } from 'vitest'
import { renderReportHtml } from '../src/render'
import type { Finding } from '@ss/rulebooks'
import type { Report } from '../src/types'

function finding(over: Partial<Finding> = {}): Finding {
  return {
    ruleId: 'test.rule',
    title: 'Test Finding',
    severity: 'medium',
    citation: { label: 'Test citation' },
    remediationTemplate: 'template',
    ruleVersion: '1.0.0',
    addedBecause: 'test',
    status: 'triggered',
    evidence: { summary: 'Something was observed.', metrics: {} },
    action: 'Do the thing.',
    ...over,
  }
}

function report(over: Partial<Report> = {}): Report {
  return {
    meta: {
      module: 'retention-x-ray',
      moduleVersion: '0.1.0',
      moduleTitle: 'Retention X-Ray',
      clientName: 'Acme Co.',
      generatedAt: '2026-07-23T00:00:00.000Z',
    },
    findings: [finding()],
    ...over,
  }
}

describe('renderReportHtml', () => {
  it('includes the client name, module title, and generated date in the cover', () => {
    const html = renderReportHtml(report())
    expect(html).toContain('Acme Co.')
    expect(html).toContain('Retention X-Ray')
    expect(html).toContain('July 23, 2026')
  })

  it('renders a triggered finding with evidence, action, and citation', () => {
    const html = renderReportHtml(report({ findings: [finding()] }))
    expect(html).toContain('Test Finding')
    expect(html).toContain('Something was observed.')
    expect(html).toContain('Do the thing.')
    expect(html).toContain('Test citation')
  })

  it('renders a dollar frame with the range and its stated basis', () => {
    const html = renderReportHtml(
      report({
        findings: [
          finding({ dollarFrame: { low: 200, high: 400, basis: 'computed from X and Y' } }),
        ],
      }),
    )
    expect(html).toContain('$200')
    expect(html).toContain('$400')
    expect(html).toContain('computed from X and Y')
  })

  it('renders insufficient findings honestly, without fabricated evidence', () => {
    const html = renderReportHtml(
      report({
        findings: [
          finding({
            status: 'insufficient',
            evidence: undefined,
            action: undefined,
            insufficientReason: 'no data pulled',
          }),
        ],
      }),
    )
    expect(html).toContain('insufficient data')
    expect(html).toContain('no data pulled')
  })

  it('sorts triggered findings by severity, with insufficient findings last', () => {
    const html = renderReportHtml(
      report({
        findings: [
          finding({ ruleId: 'r1', title: 'Low one', severity: 'low' }),
          finding({ ruleId: 'r2', title: 'Critical one', severity: 'critical' }),
          finding({
            ruleId: 'r3',
            title: 'Missing one',
            status: 'insufficient',
            evidence: undefined,
            action: undefined,
            insufficientReason: 'x',
          }),
          finding({ ruleId: 'r4', title: 'High one', severity: 'high' }),
        ],
      }),
    )
    const order = ['Critical one', 'High one', 'Low one', 'Missing one'].map((t) => html.indexOf(t))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('escapes HTML in client-supplied text (XSS-safety)', () => {
    const html = renderReportHtml(
      report({ meta: { ...report().meta, clientName: '<script>alert(1)</script>' } }),
    )
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('appends the disclaimer footer when provided', () => {
    const html = renderReportHtml(report(), 'This is not legal advice.')
    expect(html).toContain('This is not legal advice.')
  })

  it('omits the disclaimer block when none is provided', () => {
    const html = renderReportHtml(report())
    expect(html).not.toContain('class="disclaimer"')
  })
})
