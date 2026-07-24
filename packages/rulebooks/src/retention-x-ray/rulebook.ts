import type { Rulebook } from '../types'
import type { KlaviyoAccountSnapshot } from './types'
import { flowCoverageRule } from './rules/flow-coverage'
import { revenuePerFlowRule } from './rules/revenue-per-flow'
import { cadenceFatigueRule } from './rules/cadence-fatigue'
import { listHealthRule } from './rules/list-health'
import { segmentArchitectureRule } from './rules/segment-architecture'
import { discountDependencyRule } from './rules/discount-dependency'

/**
 * M8 Retention X-Ray, v0 — deterministic metrics first (per
 * COMPOUND_ENGINEERING_PLAN.md §4 M8: "Rulebook v0 (deterministic metrics first,
 * judgment encoded second)"). Bump this version whenever a rule is added, removed,
 * or its detection logic/thresholds change.
 */
export const retentionXRayRulebook: Rulebook<KlaviyoAccountSnapshot> = {
  module: 'retention-x-ray',
  version: '0.1.0',
  rules: [
    flowCoverageRule,
    revenuePerFlowRule,
    cadenceFatigueRule,
    listHealthRule,
    segmentArchitectureRule,
    discountDependencyRule,
  ],
}
