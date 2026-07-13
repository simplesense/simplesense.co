/**
 * @ss/jobs — orchestration that touches the DB: analyze-and-persist + read helpers.
 * The Inngest wiring (durable backfill / scheduled re-analysis) lands in Slice 3; these
 * are the plain functions those jobs will call.
 */
export {
  analyzeStore,
  latestRunId,
  latestRecommendations,
  openRecommendations,
  latestMetrics,
  latestMetricValue,
  type AnalyzeResult,
} from './analyze'
export { collectStore, backfillStore, type BackfillResult } from './backfill'
export { scheduleOutcome, measureOutcome, listOutcomes } from './outcome'
export {
  runTick,
  findDueOutcomes,
  measureDueOutcomes,
  selectStoresToRefresh,
  MAX_STORES_PER_TICK,
  REANALYZE_AFTER_DAYS,
  type TickResult,
  type TickOpts,
  type DueOutcomeRow,
} from './tick'
