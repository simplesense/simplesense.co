import type { Rulebook } from '../types'
import type { ReturnsSnapshot } from './types'
import { entityResolutionRule } from './rules/entity-resolution'
import { serialRefunderRule } from './rules/serial-refunder'
import { bracketingRule } from './rules/bracketing'
import { wardrobingRule } from './rules/wardrobing'
import { highReturnSkuRule } from './rules/high-return-sku'
import { policyTierRule } from './rules/policy-tier'

/**
 * M5 ReturnLens, v0 — deterministic metrics first, matching M8's own precedent. Bump
 * this version whenever a rule is added, removed, or its detection logic/thresholds
 * change.
 */
export const returnLensRulebook: Rulebook<ReturnsSnapshot> = {
  module: 'return-lens',
  version: '0.1.0',
  rules: [
    entityResolutionRule,
    serialRefunderRule,
    bracketingRule,
    wardrobingRule,
    highReturnSkuRule,
    policyTierRule,
  ],
}
