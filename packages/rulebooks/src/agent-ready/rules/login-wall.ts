import type { Rule } from '../../types'
import type { AgentReadySnapshot } from '../types'

/** Founding rule #4: is the product page itself gated behind a login? */
export const loginWallRule: Rule<AgentReadySnapshot> = {
  id: 'agent_ready.login_wall',
  title: 'Login-walled product page',
  severity: 'critical',
  citation: {
    label: 'SimpleSense AgentReady benchmark v0 — plan §4 M2 rubric: "agent-hostile signals"',
  },
  remediationTemplate:
    'Make product pages publicly viewable without authentication — gate checkout, not browsing, behind login.',
  version: '0.1.0',
  addedBecause:
    "Founding rule — an agent has no session/credentials; a login-walled PDP is invisible to it regardless of how good the page's own markup is.",
  detect(snapshot) {
    if (!snapshot.productPage.fetchedOk) {
      return {
        status: 'insufficient',
        insufficientReason: 'The product page could not be fetched.',
      }
    }
    if (snapshot.productPage.looksLoginWalled) {
      return {
        status: 'triggered',
        passed: false,
        evidence: {
          summary: `The product page ${snapshot.productPage.status ? `returned HTTP ${snapshot.productPage.status} or ` : ''}redirected to what looks like a login page.`,
          metrics: { looksLoginWalled: true, status: snapshot.productPage.status },
        },
        action: 'Make this product page viewable without signing in.',
      }
    }
    return {
      status: 'triggered',
      passed: true,
      evidence: {
        summary: 'The product page loaded without requiring authentication.',
        metrics: { looksLoginWalled: false, status: snapshot.productPage.status },
      },
      action: 'No gap here — page is publicly viewable.',
    }
  },
}
