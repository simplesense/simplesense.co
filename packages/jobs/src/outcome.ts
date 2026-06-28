import { ATTRIBUTION_WINDOW_DAYS } from '@ss/config'
import { computeLift } from '@ss/core'
import type { PrismaClient, RecommendationOutcome } from '@ss/db'
import { latestMetricValue } from './analyze'

/**
 * When a move is implemented, capture the baseline of its tracked metric (its first cited
 * evidence metric) and schedule a measurement after the attribution window (§8.6). Returns
 * the SCHEDULED outcome, or null if the recommendation is missing.
 */
export async function scheduleOutcome(
  db: PrismaClient,
  recommendationId: string,
  opts: { now?: Date; windowDays?: number } = {},
): Promise<RecommendationOutcome | null> {
  const now = opts.now ?? new Date()
  const rec = await db.recommendation.findUnique({
    where: { id: recommendationId },
    select: { storeId: true, evidenceMetricIds: true },
  })
  if (!rec) return null
  const trackedKey = rec.evidenceMetricIds[0]
  const baseline = trackedKey ? await latestMetricValue(db, rec.storeId, trackedKey) : null

  return db.recommendationOutcome.create({
    data: {
      recommendationId,
      implementedAt: now,
      measurementWindowDays: opts.windowDays ?? ATTRIBUTION_WINDOW_DAYS,
      baselineValue: baseline,
      status: 'SCHEDULED',
    },
  })
}

/**
 * After the window, record the measured value and compute the grounded lift/confidence
 * (or INCONCLUSIVE). `measuredValue` is the tracked metric's value from a post-window run.
 */
export async function measureOutcome(
  db: PrismaClient,
  outcomeId: string,
  measuredValue: number | null,
): Promise<RecommendationOutcome | null> {
  const outcome = await db.recommendationOutcome.findUnique({
    where: { id: outcomeId },
    select: { baselineValue: true },
  })
  if (!outcome) return null
  const r = computeLift(outcome.baselineValue, measuredValue)
  return db.recommendationOutcome.update({
    where: { id: outcomeId },
    data: {
      measuredValue,
      liftValue: r.liftValue,
      liftConfidence: r.liftConfidence,
      status: r.status,
    },
  })
}

/** Outcomes for a store (tenant boundary enforced by the caller), newest first. */
export async function listOutcomes(db: PrismaClient, storeId: string) {
  return db.recommendationOutcome.findMany({
    where: { recommendation: { storeId } },
    include: { recommendation: { select: { title: true, category: true, impactUnit: true } } },
    orderBy: { implementedAt: 'desc' },
  })
}
