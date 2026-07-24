export type {
  Severity,
  Citation,
  Evidence,
  DollarFrame,
  DetectionResult,
  Finding,
  Rule,
  Rulebook,
} from './types'
export { runRulebook } from './engine'
export * as retentionXRay from './retention-x-ray'
// Also re-exported at the top level for convenience — adapters typically only need one module's types.
export { retentionXRayRulebook } from './retention-x-ray/rulebook'
export type {
  CanonicalFlowType,
  FlowSummary,
  CampaignSummary,
  ListHealth,
  CadenceStats,
  SegmentArchitecture,
  KlaviyoAccountSnapshot,
} from './retention-x-ray/types'
