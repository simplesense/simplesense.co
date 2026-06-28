import { Prisma, type PrismaClient, type Recommendation, loadNormalizedStore } from '@ss/db'
import { runAnalyzers, detectSignals } from '@ss/core'
import { runEngine, type LlmClient } from '@ss/engine'
import { SIGNAL_THRESHOLDS, ANALYSIS_WINDOW_MONTHS } from '@ss/config'

export interface AnalyzeResult {
  runId: string
  recommendationCount: number
  rejectedCount: number
  model?: string
}

/**
 * Analyze a store and PERSIST the run: load normalized data → analyzers → signals →
 * grounded engine → write AnalysisRun + Metrics + Recommendations. The single LLM call
 * is the engine's; everything else is deterministic. Returns null if the store is missing.
 */
export async function analyzeStore(
  db: PrismaClient,
  storeId: string,
  opts: { llm: LlmClient; now?: Date },
): Promise<AnalyzeResult | null> {
  const now = opts.now ?? new Date()
  const store = await loadNormalizedStore(db, storeId)
  if (!store) return null

  const metrics = runAnalyzers({ store, now, windowMonths: ANALYSIS_WINDOW_MONTHS })
  const signals = detectSignals(metrics, SIGNAL_THRESHOLDS)
  const result = await runEngine({ signals, metrics }, { llm: opts.llm })

  const run = await db.analysisRun.create({ data: { storeId, status: 'RUNNING' } })

  if (metrics.length) {
    await db.metric.createMany({
      data: metrics.map((m) => ({
        runId: run.id,
        key: m.key,
        valueNumeric: m.valueNumeric,
        valueJson: m.valueJson === undefined ? undefined : (m.valueJson as Prisma.InputJsonValue),
        unit: m.unit,
        window: m.window,
      })),
    })
  }

  for (const r of result.recommendations) {
    await db.recommendation.create({
      data: {
        runId: run.id,
        storeId,
        category: r.category,
        title: r.title,
        rationale: r.rationale,
        evidenceMetricIds: r.evidenceMetricIds,
        impactLow: r.impactLow,
        impactHigh: r.impactHigh,
        impactUnit: r.impactUnit,
        effort: r.effort,
        confidence: r.confidence,
        rankScore: r.rankScore,
        status: 'NEW',
        suggestedExecution: r.suggestedExecution as Prisma.InputJsonValue,
      },
    })
  }

  await db.analysisRun.update({
    where: { id: run.id },
    data: { status: 'DONE', finishedAt: new Date() },
  })

  return {
    runId: run.id,
    recommendationCount: result.recommendations.length,
    rejectedCount: result.rejected.length,
    model: result.model,
  }
}

/** Most recent completed run for a store (or null). */
export async function latestRunId(db: PrismaClient, storeId: string): Promise<string | null> {
  const run = await db.analysisRun.findFirst({
    where: { storeId, status: 'DONE' },
    orderBy: { startedAt: 'desc' },
    select: { id: true },
  })
  return run?.id ?? null
}

/** Recommendations from the latest completed run, ranked. Caller must own the store. */
export async function latestRecommendations(
  db: PrismaClient,
  storeId: string,
): Promise<Recommendation[]> {
  const runId = await latestRunId(db, storeId)
  if (!runId) return []
  return db.recommendation.findMany({ where: { runId }, orderBy: { rankScore: 'desc' } })
}

/**
 * OPEN moves from the latest run (status NEW or VIEWED), ranked — what the dashboard
 * shows. Applied/dismissed moves are excluded so those actions persist across reloads.
 */
export async function openRecommendations(
  db: PrismaClient,
  storeId: string,
): Promise<Recommendation[]> {
  const runId = await latestRunId(db, storeId)
  if (!runId) return []
  return db.recommendation.findMany({
    where: { runId, status: { in: ['NEW', 'VIEWED'] } },
    orderBy: { rankScore: 'desc' },
  })
}

/** All metrics from the latest completed run (for detail screens). */
export async function latestMetrics(db: PrismaClient, storeId: string) {
  const runId = await latestRunId(db, storeId)
  if (!runId) return []
  return db.metric.findMany({ where: { runId } })
}

/** A metric value from the latest run (for KPI tiles). */
export async function latestMetricValue(
  db: PrismaClient,
  storeId: string,
  key: string,
): Promise<number | null> {
  const runId = await latestRunId(db, storeId)
  if (!runId) return null
  const m = await db.metric.findFirst({ where: { runId, key }, select: { valueNumeric: true } })
  return m?.valueNumeric ?? null
}
