import type { Rule } from '../../types'
import type { AgentReadySnapshot } from '../types'

/**
 * v0 methodology threshold, not a hard spec: below this, a static fetch reads mostly
 * empty markup — usually a client-side-rendered app shell.
 */
const MIN_VISIBLE_TEXT_CHARS = 500

/**
 * Founding rule #6: is there enough content in the raw HTML to be machine-readable at
 * all? This is the closest a static-fetch-only scanner can honestly get to the plan's
 * "JS-only price rendering" signal — it cannot execute JavaScript (that needs S1's
 * headless-browser crawler, deferred), so it reports what it can actually observe
 * (how much text survives a static fetch) rather than asserting a diagnosis it can't
 * verify. Low text + no product schema is *consistent with* client-side rendering, not
 * proof of it — the finding text says so explicitly.
 */
export const renderTransparencyRule: Rule<AgentReadySnapshot> = {
  id: 'agent_ready.render_transparency',
  title: 'Static-fetch content coverage',
  severity: 'medium',
  citation: {
    label:
      'SimpleSense AgentReady benchmark v0 — proxy signal for the plan\'s "JS-only price rendering" check',
  },
  remediationTemplate:
    'Server-render (or statically prerender) product content — at minimum the JSON-LD Product block — so it is present without executing JavaScript.',
  version: '0.1.0',
  addedBecause:
    "Founding rule — most agent crawlers (and this scanner itself) don't execute JavaScript; content that only appears after client-side rendering is invisible to them.",
  detect(snapshot) {
    if (!snapshot.productPage.fetchedOk) {
      return {
        status: 'insufficient',
        insufficientReason: 'The product page could not be fetched.',
      }
    }
    const chars = snapshot.productPage.visibleTextLength ?? 0
    if (chars < MIN_VISIBLE_TEXT_CHARS && !snapshot.productPage.productSchema.found) {
      return {
        status: 'triggered',
        passed: false,
        evidence: {
          summary: `Only ${chars} characters of visible text and no structured Product data found in the static HTML — consistent with client-side rendering, though this scan cannot execute JavaScript to confirm it.`,
          metrics: { visibleTextChars: chars, productSchemaFound: false },
        },
        action:
          'Verify manually whether this page requires JavaScript to render its content; if so, server-render or prerender at least the Product JSON-LD.',
      }
    }
    return {
      status: 'triggered',
      passed: true,
      evidence: {
        summary: `${chars} characters of visible text found in the static HTML${snapshot.productPage.productSchema.found ? ', including structured Product data' : ''}.`,
        metrics: {
          visibleTextChars: chars,
          productSchemaFound: snapshot.productPage.productSchema.found,
        },
      },
      action: 'No gap here — meaningful content is present without executing JavaScript.',
    }
  },
}
