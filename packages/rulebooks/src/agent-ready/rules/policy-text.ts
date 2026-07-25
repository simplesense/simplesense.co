import type { Rule } from '../../types'
import type { AgentReadySnapshot } from '../types'

/** A page that's mostly a scanned image or a single "see attached" line isn't machine-readable. */
const MIN_POLICY_TEXT_CHARS = 200

/** Founding rule #2: is the shipping/returns policy reachable as real text, not an image? */
export const policyTextRule: Rule<AgentReadySnapshot> = {
  id: 'agent_ready.policy_text',
  title: 'Shipping/returns policy as text',
  severity: 'high',
  citation: {
    label:
      'SimpleSense AgentReady benchmark v0 — plan §4 M2 rubric: "policies as text, not images"',
  },
  remediationTemplate:
    'Publish the shipping/returns policy as real page text (not an embedded image or PDF-only link) at a discoverable URL.',
  version: '0.1.0',
  addedBecause:
    "Founding rule — an agent parsing a page can't read policy terms baked into a JPEG; this is one of the plan's explicitly named checks.",
  detect(snapshot) {
    if (!snapshot.productPage.fetchedOk) {
      return {
        status: 'insufficient',
        insufficientReason: 'The product page could not be fetched.',
      }
    }
    const { policyPage } = snapshot
    if (!policyPage.found) {
      return {
        status: 'triggered',
        passed: false,
        evidence: {
          summary: 'No shipping/returns/refund policy link found on the product page.',
          metrics: { found: false },
        },
        action:
          'Add a clearly-labeled link to a shipping/returns policy page from the product page.',
      }
    }
    if (!policyPage.fetchedOk) {
      return {
        status: 'triggered',
        passed: false,
        evidence: {
          summary: 'A policy link was found, but the linked page could not be fetched.',
          metrics: { found: true, fetchedOk: false },
        },
        action: 'Check the policy link — it currently 404s, redirects incorrectly, or times out.',
      }
    }
    const chars = policyPage.visibleTextLength ?? 0
    if (chars < MIN_POLICY_TEXT_CHARS) {
      return {
        status: 'triggered',
        passed: false,
        evidence: {
          summary: `Policy page found but has only ${chars} characters of visible text — likely an image, a stub, or JS-rendered content this static scan can't read.`,
          metrics: { found: true, fetchedOk: true, visibleTextChars: chars },
        },
        action:
          'Publish the policy as real page text — at least a few short paragraphs, not an image or a stub page.',
      }
    }
    return {
      status: 'triggered',
      passed: true,
      evidence: {
        summary: `Policy page found with ${chars} characters of visible text.`,
        metrics: { found: true, fetchedOk: true, visibleTextChars: chars },
      },
      action: 'No gap here — policy is reachable and text-readable.',
    }
  },
}
