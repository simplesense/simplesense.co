import { chromium } from 'playwright'
import { renderReportHtml } from './render'
import type { Report } from './types'

/**
 * PDF renderer for the shared audit-report schema (S4, COMPOUND_ENGINEERING_PLAN.md §3).
 * Reuses `renderReportHtml`'s self-contained HTML output verbatim — this file's only job
 * is to hand that HTML to a headless Chromium and print it — so the PDF and the HTML/email
 * artifact never drift from each other. Launches a fresh browser per call rather than
 * pooling one (mirrors `@ss/crawler`'s `BrowserPool` launch pattern), since report
 * generation is a low-frequency, one-shot operation, not a hot path worth keeping a
 * browser warm for.
 */
export async function renderReportPdf(report: Report, disclaimer?: string): Promise<Buffer> {
  const html = renderReportHtml(report, disclaimer)
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      await page.setContent(html, { waitUntil: 'load' })
      return await page.pdf({ format: 'Letter', printBackground: true })
    } finally {
      await context.close()
    }
  } finally {
    await browser.close()
  }
}
