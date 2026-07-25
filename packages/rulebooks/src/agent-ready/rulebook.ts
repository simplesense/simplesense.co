import type { Rulebook } from '../types'
import type { AgentReadySnapshot } from './types'
import { productSchemaRule } from './rules/product-schema'
import { policyTextRule } from './rules/policy-text'
import { robotsAgentAccessRule } from './rules/robots-agent-access'
import { loginWallRule } from './rules/login-wall'
import { captchaGateRule } from './rules/captcha-gate'
import { renderTransparencyRule } from './rules/render-transparency'

/**
 * M2 AgentReady, v0 — static-fetch rubric (no S1/Playwright dependency; see
 * PARKING_LOT.md). Bump this version whenever a rule is added, removed, or its
 * detection logic/thresholds change.
 */
export const agentReadyRulebook: Rulebook<AgentReadySnapshot> = {
  module: 'agent-ready',
  version: '0.1.0',
  rules: [
    productSchemaRule,
    policyTextRule,
    robotsAgentAccessRule,
    loginWallRule,
    captchaGateRule,
    renderTransparencyRule,
  ],
}
