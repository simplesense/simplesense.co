import { describe, it, expect } from 'vitest'
import { renderReportPdf } from '../src/render-pdf'
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

describe('renderReportPdf — real Playwright integration', () => {
  it('produces a real PDF buffer from the rendered report HTML', async () => {
    const buffer = await renderReportPdf(report())
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.length).toBeGreaterThan(1000)
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-')
  }, 30_000)
})
