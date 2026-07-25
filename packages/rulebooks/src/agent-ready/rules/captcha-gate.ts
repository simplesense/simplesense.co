import type { Rule } from '../../types'
import type { AgentReadySnapshot } from '../types'

/** Founding rule #5: does a CAPTCHA gate the product page itself? */
export const captchaGateRule: Rule<AgentReadySnapshot> = {
  id: 'agent_ready.captcha_gate',
  title: 'CAPTCHA on product page',
  severity: 'high',
  citation: {
    label: 'SimpleSense AgentReady benchmark v0 — plan §4 M2 rubric: "agent-hostile signals"',
  },
  remediationTemplate:
    'Move CAPTCHA challenges to checkout/account flows where they belong, not onto public product pages.',
  version: '0.1.0',
  addedBecause:
    "Founding rule — a CAPTCHA on a PDP blocks automated agents by design, whether or not that was the intent (usually it's bot-mitigation tooling applied too broadly).",
  detect(snapshot) {
    if (!snapshot.productPage.fetchedOk) {
      return {
        status: 'insufficient',
        insufficientReason: 'The product page could not be fetched.',
      }
    }
    if (snapshot.productPage.hasCaptcha) {
      return {
        status: 'triggered',
        passed: false,
        evidence: {
          summary:
            'A CAPTCHA widget (reCAPTCHA/hCaptcha/Turnstile/similar) was detected on the product page.',
          metrics: { hasCaptcha: true },
        },
        action:
          'Remove the CAPTCHA from this product page, or scope your bot-mitigation rules to exclude PDPs.',
      }
    }
    return {
      status: 'triggered',
      passed: true,
      evidence: {
        summary: 'No CAPTCHA widget detected on the product page.',
        metrics: { hasCaptcha: false },
      },
      action: 'No gap here.',
    }
  },
}
