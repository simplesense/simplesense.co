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
export * as returnLens from './return-lens'
export * as agentReady from './agent-ready'
export * as answerShelf from './answer-shelf'
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
export { returnLensRulebook } from './return-lens/rulebook'
export { analyzeReturns } from './return-lens/derive'
export type {
  EntitySummary,
  SkuReturnSummary,
  BracketingCandidate,
  WardrobingStats,
  ReturnsSnapshot,
} from './return-lens/types'
export { agentReadyRulebook } from './agent-ready/rulebook'
export { computeAgentReadyScore } from './agent-ready/score'
export type { AgentReadyScore } from './agent-ready/score'
export type {
  ProductOfferSummary,
  ProductSchemaSummary,
  PolicyPageSummary,
  RobotsTxtSummary,
  ProductPageSummary,
  AgentReadySnapshot,
} from './agent-ready/types'
export { answerShelfRulebook } from './answer-shelf/rulebook'
export { analyzeAnswerShelf } from './answer-shelf/derive'
export type {
  Sentiment,
  PromptResponse,
  CompetitorShare,
  CitedDomainCount,
  AnswerShelfSnapshot,
} from './answer-shelf/types'
