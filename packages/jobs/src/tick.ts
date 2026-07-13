import { computeLift } from '@ss/core'
import { DEMO, type PrismaClient } from '@ss/db'
import type { LlmClient } from '@ss/engine'
import type { ShopifyReader } from '@ss/integrations'
import { analyzeStore } from './analyze'
import { backfillStore } from './backfill'

/** LLM re-analysis costs money — hard cap the number of stores refreshed per tick. */
export const MAX_STORES_PER_TICK = 5
/** A store whose latest DONE run is older than this gets re-analyzed ("weekly moves"). */
export const REANALYZE_AFTER_DAYS = 7
/** Mirror of the sync stale-takeover in apps/web/lib/sync-runner.ts's STUCK_AFTER_MS. */
const STUCK_AFTER_MS = 15 * 60 * 1000
const DAY_MS = 86_400_000

export interface DueOutcomeRow {
  id: string
  implementedAt: Date
  measurementWindowDays: number
  baselineValue: number | null
  storeId: string
  trackedKey: string | null
}

export interface TickResult {
  refreshed: number
  refreshErrors: number
  skippedSyncing: number
  measured: number
  inconclusive: number
  deferred: number
}

/** SCHEDULED outcomes whose window has closed. Dueness has no DB column — computed in JS. */
export async function findDueOutcomes(db: PrismaClient, now: Date): Promise<DueOutcomeRow[]> {
  const scheduled = await db.recommendationOutcome.findMany({
    where: { status: 'SCHEDULED' },
    select: {
      id: true,
      implementedAt: true,
      measurementWindowDays: true,
      baselineValue: true,
      recommendation: { select: { storeId: true, evidenceMetricIds: true } },
    },
  })
  return scheduled
    .filter((o) => o.implementedAt.getTime() + o.measurementWindowDays * DAY_MS <= now.getTime())
    .map((o) => ({
      id: o.id,
      implementedAt: o.implementedAt,
      measurementWindowDays: o.measurementWindowDays,
      baselineValue: o.baselineValue,
      storeId: o.recommendation.storeId,
      trackedKey: o.recommendation.evidenceMetricIds[0] ?? null,
    }))
}

/** Do not reuse latestRunId — we need startedAt for the post-window check. */
async function latestDoneRun(db: PrismaClient, storeId: string) {
  return db.analysisRun.findFirst({
    where: { storeId, status: 'DONE' },
    orderBy: { startedAt: 'desc' },
    select: { id: true, startedAt: true },
  })
}

/**
 * GROUNDING + IDEMPOTENCY core. Only measure against a run started at/after the window
 * close; write via a conditional updateMany claim (same pattern as the sync lock) so a
 * second tick can never double-measure.
 */
export async function measureDueOutcomes(
  db: PrismaClient,
  due: DueOutcomeRow[],
  _now: Date,
): Promise<Pick<TickResult, 'measured' | 'inconclusive' | 'deferred'>> {
  let measured = 0,
    inconclusive = 0,
    deferred = 0
  for (const o of due) {
    try {
      const dueAt = new Date(o.implementedAt.getTime() + o.measurementWindowDays * DAY_MS)
      const run = await latestDoneRun(db, o.storeId)
      // GROUNDING: never measure against the same (pre-window) run that produced the
      // baseline — wait for a run started after the window closed.
      if (!run || run.startedAt.getTime() < dueAt.getTime()) {
        deferred += 1
        continue
      }
      const metric = o.trackedKey
        ? await db.metric.findFirst({
            where: { runId: run.id, key: o.trackedKey },
            select: { valueNumeric: true },
          })
        : null
      const measuredValue = metric?.valueNumeric ?? null
      const r = computeLift(o.baselineValue, measuredValue)
      // Idempotent claim: only the tick that still sees SCHEDULED wins (count === 1).
      const claimed = await db.recommendationOutcome.updateMany({
        where: { id: o.id, status: 'SCHEDULED' },
        data: {
          measuredValue,
          liftValue: r.liftValue,
          liftConfidence: r.liftConfidence,
          status: r.status,
        },
      })
      if (claimed.count === 1) r.status === 'MEASURED' ? (measured += 1) : (inconclusive += 1)
    } catch (err) {
      console.error('[tick] measure failed outcome=%s: %s', o.id, (err as Error).message)
    }
  }
  return { measured, inconclusive, deferred }
}

/**
 * Union of (a) stores of due outcomes lacking a post-window run and (b) READY stores with
 * a stale latest run; due-outcome stores first; demo excluded.
 */
export async function selectStoresToRefresh(
  db: PrismaClient,
  due: DueOutcomeRow[],
  now: Date,
  maxStores: number,
): Promise<string[]> {
  const picked: string[] = []
  const seen = new Set<string>()
  // (a) due outcomes that can't be measured yet — need a post-window run first
  for (const o of due) {
    if (o.storeId === DEMO.storeId || seen.has(o.storeId)) continue
    const dueAt = o.implementedAt.getTime() + o.measurementWindowDays * DAY_MS
    const run = await latestDoneRun(db, o.storeId)
    if (!run || run.startedAt.getTime() < dueAt) {
      seen.add(o.storeId)
      picked.push(o.storeId)
    }
  }
  // (b) weekly refresh: READY, token-connected, non-demo, latest DONE run > 7d old
  const candidates = await db.store.findMany({
    // Demo store is skipped deliberately: it is a static seeded showcase and each
    // re-analysis is a paid LLM call — refreshing it weekly buys nothing.
    where: { id: { not: DEMO.storeId }, syncStatus: 'READY', accessTokenEnc: { not: null } },
    select: { id: true },
  })
  const staleBefore = now.getTime() - REANALYZE_AFTER_DAYS * DAY_MS
  for (const s of candidates) {
    if (seen.has(s.id)) continue
    const run = await latestDoneRun(db, s.id)
    if (!run || run.startedAt.getTime() < staleBefore) {
      seen.add(s.id)
      picked.push(s.id)
    }
  }
  return picked.slice(0, maxStores)
}

export interface TickOpts {
  llm: LlmClient
  reader?: ShopifyReader
  decryptToken?: (enc: string) => string
  now?: Date
  maxStores?: number
  /** Test seam — replaces the default claim+backfill+analyze per-store refresh. */
  refresh?: (storeId: string) => Promise<'refreshed' | 'skipped'>
}

/**
 * Scheduler tick: (1) refresh due-outcome / stale stores (capped, atomic SYNCING claim so
 * it never collides with a user-clicked sync), then (2) measure due outcomes against a
 * genuinely post-window run.
 */
export async function runTick(db: PrismaClient, opts: TickOpts): Promise<TickResult> {
  const now = opts.now ?? new Date()
  const maxStores = opts.maxStores ?? MAX_STORES_PER_TICK
  const due = await findDueOutcomes(db, now)
  const stores = await selectStoresToRefresh(db, due, now, maxStores)

  const defaultRefresh = async (storeId: string): Promise<'refreshed' | 'skipped'> => {
    // Atomic claim — identical shape to syncStoreAction; loses to an in-flight user sync.
    const stale = new Date(now.getTime() - STUCK_AFTER_MS)
    const claimed = await db.store.updateMany({
      where: {
        id: storeId,
        OR: [
          { syncStatus: { not: 'SYNCING' } },
          { syncStartedAt: null },
          { syncStartedAt: { lt: stale } },
        ],
      },
      data: { syncStatus: 'SYNCING', syncStartedAt: new Date(), syncError: null },
    })
    if (claimed.count === 0) return 'skipped'
    try {
      const store = await db.store.findUnique({
        where: { id: storeId },
        select: { shopDomain: true, accessTokenEnc: true },
      })
      if (store?.accessTokenEnc && opts.reader && opts.decryptToken) {
        // Fresh data first — re-analyzing stale rows would replay the baseline numbers.
        await backfillStore(db, storeId, opts.reader, {
          shop: store.shopDomain,
          token: opts.decryptToken(store.accessTokenEnc),
        })
        // backfillStore flips READY internally — re-assert SYNCING for the analysis leg
        // (same dance as startStoreSync, apps/web/lib/sync-runner.ts).
        await db.store.update({ where: { id: storeId }, data: { syncStatus: 'SYNCING' } })
      }
      await analyzeStore(db, storeId, { llm: opts.llm })
      await db.store.update({
        where: { id: storeId },
        data: { syncStatus: 'READY', lastSyncedAt: new Date(), syncError: null },
      })
      return 'refreshed'
    } catch (err) {
      await db.store.update({
        where: { id: storeId },
        data: { syncStatus: 'ERROR', syncError: String((err as Error).message).slice(0, 500) },
      })
      throw err
    }
  }
  const refresh = opts.refresh ?? defaultRefresh

  let refreshed = 0,
    refreshErrors = 0,
    skippedSyncing = 0
  for (const storeId of stores) {
    try {
      const r = await refresh(storeId)
      r === 'refreshed' ? (refreshed += 1) : (skippedSyncing += 1)
    } catch (err) {
      refreshErrors += 1
      console.error('[tick] refresh failed store=%s: %s', storeId, (err as Error).message)
    }
  }

  const m = await measureDueOutcomes(db, due, now)
  return { refreshed, refreshErrors, skippedSyncing, ...m }
}
