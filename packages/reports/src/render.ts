import type { Finding, Severity } from '@ss/rulebooks'
import type { Report } from './types'

/**
 * Pure HTML renderer for the shared audit-report schema (S4, COMPOUND_ENGINEERING_PLAN.md
 * §3). Self-contained (inline CSS, no external assets, no build step) so a report opens
 * correctly as a standalone .html file or an email attachment. PDF output is handled by
 * `renderReportPdf` in ./render-pdf.ts, which prints this same HTML through a headless
 * Chromium rather than duplicating the layout.
 * Colors mirror the SimpleSense design system (packages/ui/src/tokens/colors.css) but are
 * inlined here rather than imported, since this is a standalone distributable artifact,
 * not an app-shell component consuming the live token stylesheet.
 */

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}
const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#c8442e',
  high: '#cd8420',
  medium: '#0871e7',
  low: '#4a4234',
  info: '#837a68',
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function renderFinding(f: Finding): string {
  const color = SEVERITY_COLOR[f.severity]
  if (f.status === 'insufficient') {
    return `
    <div class="finding insufficient">
      <div class="finding-head">
        <span class="badge" style="background:#ece7dc;color:#837a68">insufficient data</span>
        <h3>${escapeHtml(f.title)}</h3>
      </div>
      <p class="note">Could not be assessed: ${escapeHtml(f.insufficientReason ?? 'data not available')}.</p>
    </div>`
  }
  const dollarHtml = f.dollarFrame
    ? `<div class="dollar-frame">
        <span class="dollar-range">${money(f.dollarFrame.low)}–${money(f.dollarFrame.high)}</span>
        <span class="dollar-basis">${escapeHtml(f.dollarFrame.basis)}</span>
      </div>`
    : ''
  return `
    <div class="finding">
      <div class="finding-head">
        <span class="badge" style="background:${color}1a;color:${color}">${escapeHtml(f.severity)}</span>
        <h3>${escapeHtml(f.title)}</h3>
      </div>
      <p class="evidence">${escapeHtml(f.evidence?.summary ?? '')}</p>
      ${dollarHtml}
      <p class="action"><strong>Next step:</strong> ${escapeHtml(f.action ?? '')}</p>
      <p class="citation">${escapeHtml(f.citation.label)}</p>
    </div>`
}

export function renderReportHtml(report: Report, disclaimer?: string): string {
  const { meta, findings } = report
  const sorted = [...findings].sort((a, b) => {
    if (a.status === 'insufficient' && b.status !== 'insufficient') return 1
    if (a.status !== 'insufficient' && b.status === 'insufficient') return -1
    return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  })
  // Explicit UTC: without it, toLocaleDateString uses the server's local timezone, which can
  // roll a UTC-midnight date back to the previous day depending on where this renders.
  const generated = new Date(meta.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
  const findingsCount = findings.filter((f) => f.status === 'triggered').length
  const insufficientCount = findings.filter((f) => f.status === 'insufficient').length

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(meta.moduleTitle)} — ${escapeHtml(meta.clientName)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; background: #f4f1ea; color: #211c15; margin: 0; padding: 0; }
  .page { max-width: 760px; margin: 0 auto; padding: 56px 32px; }
  .cover { text-align: center; padding-bottom: 40px; border-bottom: 1px solid #e4ddcf; margin-bottom: 40px; }
  .cover .eyebrow { font-family: Helvetica, Arial, sans-serif; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #c25a3c; margin-bottom: 12px; }
  .cover h1 { font-size: 34px; font-weight: 400; margin: 0 0 12px; }
  .cover .sub { font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #4a4234; }
  .methodology { font-family: Helvetica, Arial, sans-serif; font-size: 13.5px; color: #4a4234; line-height: 1.6; background: #fffdf9; border: 1px solid #e4ddcf; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; }
  .finding { background: #fffdf9; border: 1px solid #e4ddcf; border-radius: 8px; padding: 20px 24px; margin-bottom: 16px; }
  .finding.insufficient { opacity: 0.75; }
  .finding-head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .finding-head h3 { font-size: 18px; font-weight: 400; margin: 0; }
  .badge { font-family: Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; }
  .evidence { font-size: 15px; line-height: 1.6; margin: 0 0 10px; }
  .dollar-frame { background: #e2f1e9; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; }
  .dollar-range { font-family: Helvetica, Arial, sans-serif; font-size: 17px; font-weight: 700; color: #1f8a5b; }
  .dollar-basis { display: block; font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #4a4234; margin-top: 2px; }
  .action { font-family: Helvetica, Arial, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0 0 8px; }
  .citation { font-family: Helvetica, Arial, sans-serif; font-size: 11.5px; color: #837a68; margin: 0; }
  .note { font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #837a68; margin: 0; }
  .disclaimer { font-family: Helvetica, Arial, sans-serif; font-size: 11.5px; color: #837a68; line-height: 1.6; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e4ddcf; }
</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <div class="eyebrow">${escapeHtml(meta.moduleTitle)}</div>
    <h1>${escapeHtml(meta.clientName)}</h1>
    <div class="sub">Generated ${escapeHtml(generated)} · ${findingsCount} finding(s)${insufficientCount ? `, ${insufficientCount} not assessable` : ''}</div>
  </div>
  <div class="methodology">
    Every figure in this report is computed directly from your own connected data. Where the
    data needed to assess something wasn't available, it's marked "insufficient" — never
    estimated to fill the gap. Dollar ranges are conservative and traced to your own numbers;
    ranges marked "editorial estimate" are explicitly labeled as such rather than presented as
    measured.
  </div>
  ${sorted.map(renderFinding).join('\n')}
  ${disclaimer ? `<div class="disclaimer">${escapeHtml(disclaimer)}</div>` : ''}
</div>
</body>
</html>`
}
