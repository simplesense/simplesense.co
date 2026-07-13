import { describe, it, expect, vi } from 'vitest'
import type { PrismaClient } from '@ss/db'
import { DEMO } from '@ss/db'
import type { ShopifyReader } from '@ss/integrations'

vi.mock('../src/analyze', () => ({ analyzeStore: vi.fn(() => Promise.resolve(null)) }))
vi.mock('../src/backfill', () => ({ backfillStore: vi.fn() }))

import { analyzeStore } from '../src/analyze'
import { backfillStore } from '../src/backfill'
import {
  findDueOutcomes,
  measureDueOutcomes,
  selectStoresToRefresh,
  runTick,
  type DueOutcomeRow,
} from '../src/tick'

const DAY_MS = 86_400_000
const NOW = new Date('2026-07-13T00:00:00Z')

describe('findDueOutcomes', () => {
  it('returns due rows, filters not-yet-due, resolves trackedKey via recommendation relation', async () => {
    const rows = [
      {
        id: 'due1',
        implementedAt: new Date(NOW.getTime() - 31 * DAY_MS),
        measurementWindowDays: 30,
        baselineValue: 0.7,
        recommendation: { storeId: 's1', evidenceMetricIds: ['pareto.top20_revenue_share'] },
      },
      {
        id: 'notdue1',
        implementedAt: new Date(NOW.getTime() - 5 * DAY_MS),
        measurementWindowDays: 30,
        baselineValue: 0.5,
        recommendation: { storeId: 's2', evidenceMetricIds: ['some.key'] },
      },
      {
        id: 'due2',
        implementedAt: new Date(NOW.getTime() - 31 * DAY_MS),
        measurementWindowDays: 30,
        baselineValue: null,
        recommendation: { storeId: 's3', evidenceMetricIds: [] },
      },
    ]
    const db = {
      recommendationOutcome: { findMany: () => Promise.resolve(rows) },
    } as unknown as PrismaClient

    const due = await findDueOutcomes(db, NOW)
    expect(due.map((d) => d.id)).toEqual(['due1', 'due2'])
    expect(due[0]!.trackedKey).toBe('pareto.top20_revenue_share')
    expect(due[1]!.trackedKey).toBeNull()
    expect(due[0]!.storeId).toBe('s1')
  })
})

function dueRow(overrides: Partial<DueOutcomeRow> = {}): DueOutcomeRow {
  return {
    id: 'oc1',
    implementedAt: new Date(NOW.getTime() - 31 * DAY_MS),
    measurementWindowDays: 30,
    baselineValue: 0.7,
    storeId: 's1',
    trackedKey: 'pareto.top20_revenue_share',
    ...overrides,
  }
}

describe('measureDueOutcomes', () => {
  it('defers when the latest DONE run started before the window closed', async () => {
    const updateMany = vi.fn()
    const db = {
      analysisRun: {
        findFirst: () =>
          Promise.resolve({ id: 'run1', startedAt: new Date(NOW.getTime() - 32 * DAY_MS) }),
      },
      metric: { findFirst: () => Promise.resolve(null) },
      recommendationOutcome: { updateMany },
    } as unknown as PrismaClient

    const result = await measureDueOutcomes(db, [dueRow()], NOW)
    expect(result).toEqual({ measured: 0, inconclusive: 0, deferred: 1 })
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('measures against a genuine post-window run and computes lift', async () => {
    const updateMany = vi.fn(() => Promise.resolve({ count: 1 }))
    const db = {
      analysisRun: {
        findFirst: () =>
          Promise.resolve({ id: 'run2', startedAt: new Date(NOW.getTime() - 1 * DAY_MS) }),
      },
      metric: { findFirst: () => Promise.resolve({ valueNumeric: 0.84 }) },
      recommendationOutcome: { updateMany },
    } as unknown as PrismaClient

    const result = await measureDueOutcomes(db, [dueRow({ baselineValue: 0.7 })], NOW)
    expect(result).toEqual({ measured: 1, inconclusive: 0, deferred: 0 })
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'oc1', status: 'SCHEDULED' },
      data: expect.objectContaining({
        measuredValue: 0.84,
        status: 'MEASURED',
        liftValue: expect.closeTo(0.14, 4),
      }),
    })
  })

  it('does not bump counters when a concurrent tick already claimed the row (count 0)', async () => {
    const updateMany = vi.fn(() => Promise.resolve({ count: 0 }))
    const db = {
      analysisRun: {
        findFirst: () =>
          Promise.resolve({ id: 'run2', startedAt: new Date(NOW.getTime() - 1 * DAY_MS) }),
      },
      metric: { findFirst: () => Promise.resolve({ valueNumeric: 0.84 }) },
      recommendationOutcome: { updateMany },
    } as unknown as PrismaClient

    const result = await measureDueOutcomes(db, [dueRow()], NOW)
    expect(result).toEqual({ measured: 0, inconclusive: 0, deferred: 0 })
    expect(updateMany).toHaveBeenCalledTimes(1)
  })

  it('resolves a missing tracked metric to INCONCLUSIVE with measuredValue null (no fabricated 0)', async () => {
    const updateMany = vi.fn(() => Promise.resolve({ count: 1 }))
    const db = {
      analysisRun: {
        findFirst: () =>
          Promise.resolve({ id: 'run2', startedAt: new Date(NOW.getTime() - 1 * DAY_MS) }),
      },
      metric: { findFirst: () => Promise.resolve(null) },
      recommendationOutcome: { updateMany },
    } as unknown as PrismaClient

    const result = await measureDueOutcomes(db, [dueRow()], NOW)
    expect(result).toEqual({ measured: 0, inconclusive: 1, deferred: 0 })
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'oc1', status: 'SCHEDULED' },
      data: expect.objectContaining({ measuredValue: null, status: 'INCONCLUSIVE' }),
    })
  })
})

describe('selectStoresToRefresh', () => {
  it('skips DEMO.storeId even when stale, caps at maxStores, orders due-outcome stores first', async () => {
    const staleRun = { id: 'r', startedAt: new Date(NOW.getTime() - 10 * DAY_MS) }
    const freshRun = { id: 'r', startedAt: new Date(NOW.getTime() - 2 * DAY_MS) }
    const db = {
      analysisRun: {
        findFirst: ({ where }: { where: { storeId: string } }) => {
          if (where.storeId === 'due-store') return Promise.resolve(staleRun)
          if (where.storeId === 'fresh-store') return Promise.resolve(freshRun)
          return Promise.resolve(staleRun)
        },
      },
      store: {
        // Mirrors the production `where: { id: { not: DEMO.storeId }, ... } }` — a real
        // Prisma query never returns the demo store here, so the mock must not either.
        findMany: ({ where }: { where: { id: { not: string } } }) =>
          Promise.resolve(
            [
              { id: DEMO.storeId },
              { id: 'stale-store-a' },
              { id: 'stale-store-b' },
              { id: 'fresh-store' },
            ].filter((s) => s.id !== where.id.not),
          ),
      },
    } as unknown as PrismaClient

    const due = [
      dueRow({ storeId: 'due-store', implementedAt: new Date(NOW.getTime() - 31 * DAY_MS) }),
    ]
    const picked = await selectStoresToRefresh(db, due, NOW, 2)
    expect(picked).toEqual(['due-store', 'stale-store-a'])
    expect(picked).not.toContain(DEMO.storeId)
    expect(picked).not.toContain('fresh-store')
  })

  it('does not select a READY store whose latest run is only 2 days old, but does select an 8-day-old one', async () => {
    const db = {
      analysisRun: {
        findFirst: ({ where }: { where: { storeId: string } }) => {
          if (where.storeId === 'two-day') {
            return Promise.resolve({ id: 'r', startedAt: new Date(NOW.getTime() - 2 * DAY_MS) })
          }
          return Promise.resolve({ id: 'r', startedAt: new Date(NOW.getTime() - 8 * DAY_MS) })
        },
      },
      store: {
        findMany: () => Promise.resolve([{ id: 'two-day' }, { id: 'eight-day' }]),
      },
    } as unknown as PrismaClient

    const picked = await selectStoresToRefresh(db, [], NOW, 5)
    expect(picked).toEqual(['eight-day'])
  })
})

describe('runTick', () => {
  it('isolates per-store refresh errors and still runs measurement', async () => {
    const updateMany = vi.fn(() => Promise.resolve({ count: 1 }))
    const db = {
      recommendationOutcome: { findMany: () => Promise.resolve([]), updateMany },
      store: {
        findMany: () => Promise.resolve([{ id: 'store-a' }, { id: 'store-b' }]),
      },
      analysisRun: {
        findFirst: () =>
          Promise.resolve({ id: 'r', startedAt: new Date(NOW.getTime() - 8 * DAY_MS) }),
      },
    } as unknown as PrismaClient

    const refresh = vi.fn((storeId: string) => {
      if (storeId === 'store-a') return Promise.reject(new Error('boom'))
      return Promise.resolve('refreshed' as const)
    })

    const result = await runTick(db, {
      llm: {} as never,
      now: NOW,
      maxStores: 5,
      refresh,
    })
    expect(result.refreshErrors).toBe(1)
    expect(result.refreshed).toBe(1)
    expect(refresh).toHaveBeenCalledTimes(2)
  })
})

// The tests above all inject opts.refresh, which bypasses runTick's production refresh path
// (defaultRefresh) entirely. These exercise defaultRefresh itself — the atomic SYNCING claim
// (identical shape to apps/web/lib/sync-runner.ts's startStoreSync) and the
// backfill → re-assert SYNCING → analyze → READY pipeline — mirroring sync-runner.test.ts.
interface StoreUpdateManyArgs {
  where: { id: string; OR: unknown[] }
  data: Record<string, unknown>
}
interface StoreUpdateArgs {
  where: { id: string }
  data: Record<string, unknown>
}
const mockStoreUpdateMany = (count: number) =>
  vi.fn((_args: StoreUpdateManyArgs) => Promise.resolve({ count }))
const mockStoreUpdate = () => vi.fn((_args: StoreUpdateArgs) => Promise.resolve({}))

describe('runTick — production defaultRefresh pipeline (no injected refresh)', () => {
  it('claims atomically with the stale-recovery OR clause, then runs backfill → re-assert SYNCING → analyze → READY', async () => {
    vi.clearAllMocks()
    const storeUpdateMany = mockStoreUpdateMany(1)
    const storeUpdate = mockStoreUpdate()
    const decryptToken = vi.fn(() => 'plain-token')
    const reader = {} as ShopifyReader
    const db = {
      recommendationOutcome: { findMany: () => Promise.resolve([]) },
      store: {
        findMany: () => Promise.resolve([{ id: 'store-x' }]),
        findUnique: () =>
          Promise.resolve({ shopDomain: 'x.myshopify.com', accessTokenEnc: 'enc-token' }),
        updateMany: storeUpdateMany,
        update: storeUpdate,
      },
      analysisRun: { findFirst: () => Promise.resolve(null) },
    } as unknown as PrismaClient

    const result = await runTick(db, {
      llm: {} as never,
      reader,
      decryptToken,
      now: NOW,
      maxStores: 5,
    })

    expect(result).toMatchObject({ refreshed: 1, refreshErrors: 0, skippedSyncing: 0 })
    const claimArg = storeUpdateMany.mock.calls[0]![0]!
    expect(claimArg.where).toMatchObject({ id: 'store-x' })
    expect(claimArg.where!.OR).toHaveLength(3)
    expect(claimArg.data).toMatchObject({ syncStatus: 'SYNCING', syncError: null })
    expect(vi.mocked(backfillStore)).toHaveBeenCalledWith(db, 'store-x', reader, {
      shop: 'x.myshopify.com',
      token: 'plain-token',
    })
    expect(decryptToken).toHaveBeenCalledWith('enc-token')
    expect(vi.mocked(analyzeStore)).toHaveBeenCalledTimes(1)
    // 1st update re-asserts SYNCING (backfillStore flips READY internally), 2nd lands READY.
    expect(storeUpdate.mock.calls[0]![0]!.data).toMatchObject({ syncStatus: 'SYNCING' })
    expect(storeUpdate.mock.calls[1]![0]!.data).toMatchObject({
      syncStatus: 'READY',
      syncError: null,
    })
  })

  it('skips the store when the atomic claim loses (count 0) — no backfill/analyze, counted as skippedSyncing', async () => {
    vi.clearAllMocks()
    const storeUpdateMany = mockStoreUpdateMany(0)
    const storeUpdate = mockStoreUpdate()
    const db = {
      recommendationOutcome: { findMany: () => Promise.resolve([]) },
      store: {
        findMany: () => Promise.resolve([{ id: 'store-x' }]),
        findUnique: () =>
          Promise.resolve({ shopDomain: 'x.myshopify.com', accessTokenEnc: 'enc-token' }),
        updateMany: storeUpdateMany,
        update: storeUpdate,
      },
      analysisRun: { findFirst: () => Promise.resolve(null) },
    } as unknown as PrismaClient

    const result = await runTick(db, { llm: {} as never, now: NOW, maxStores: 5 })

    expect(result).toMatchObject({ refreshed: 0, refreshErrors: 0, skippedSyncing: 1 })
    expect(vi.mocked(backfillStore)).not.toHaveBeenCalled()
    expect(vi.mocked(analyzeStore)).not.toHaveBeenCalled()
    expect(storeUpdate).not.toHaveBeenCalled()
  })

  it('writes syncStatus ERROR with a 500-char-truncated message when analyzeStore throws', async () => {
    vi.clearAllMocks()
    vi.mocked(analyzeStore).mockRejectedValueOnce(new Error('boom '.repeat(200)))
    const storeUpdateMany = mockStoreUpdateMany(1)
    const storeUpdate = mockStoreUpdate()
    const db = {
      recommendationOutcome: { findMany: () => Promise.resolve([]) },
      store: {
        findMany: () => Promise.resolve([{ id: 'store-x' }]),
        findUnique: () =>
          Promise.resolve({ shopDomain: 'x.myshopify.com', accessTokenEnc: 'enc-token' }),
        updateMany: storeUpdateMany,
        update: storeUpdate,
      },
      analysisRun: { findFirst: () => Promise.resolve(null) },
    } as unknown as PrismaClient

    const result = await runTick(db, {
      llm: {} as never,
      reader: {} as ShopifyReader,
      decryptToken: () => 'tok',
      now: NOW,
      maxStores: 5,
    })

    expect(result).toMatchObject({ refreshed: 0, refreshErrors: 1 })
    const lastUpdate = storeUpdate.mock.calls.at(-1)![0]!
    expect(lastUpdate.data).toMatchObject({ syncStatus: 'ERROR' })
    expect((lastUpdate.data as { syncError: string }).syncError.length).toBeLessThanOrEqual(500)
  })

  it('skips backfillStore (but still analyzes) when reader/decryptToken are not supplied', async () => {
    vi.clearAllMocks()
    const storeUpdateMany = mockStoreUpdateMany(1)
    const storeUpdate = mockStoreUpdate()
    const db = {
      recommendationOutcome: { findMany: () => Promise.resolve([]) },
      store: {
        findMany: () => Promise.resolve([{ id: 'store-x' }]),
        findUnique: () =>
          Promise.resolve({ shopDomain: 'x.myshopify.com', accessTokenEnc: 'enc-token' }),
        updateMany: storeUpdateMany,
        update: storeUpdate,
      },
      analysisRun: { findFirst: () => Promise.resolve(null) },
    } as unknown as PrismaClient

    const result = await runTick(db, { llm: {} as never, now: NOW, maxStores: 5 })

    expect(result.refreshed).toBe(1)
    expect(vi.mocked(backfillStore)).not.toHaveBeenCalled()
    expect(vi.mocked(analyzeStore)).toHaveBeenCalledTimes(1)
  })
})
