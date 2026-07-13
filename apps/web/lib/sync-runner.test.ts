import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@ss/db', () => ({
  prisma: { store: { updateMany: vi.fn(), update: vi.fn() } },
}))
vi.mock('@ss/jobs', () => ({ backfillStore: vi.fn(), analyzeStore: vi.fn() }))
vi.mock('@ss/integrations', () => ({ RealShopifyReader: vi.fn() }))
vi.mock('@ss/engine', () => ({ createLlmClient: vi.fn(() => ({})) }))
vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { prisma } from '@ss/db'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { backfillStore, analyzeStore } from '@ss/jobs'
import { startStoreSync } from './sync-runner'

const updateMany = vi.mocked(prisma.store.updateMany)
const update = vi.mocked(prisma.store.update)
const afterMock = vi.mocked(after)

/** Run the callback captured by after() (the background pipeline). */
async function runPipeline(): Promise<void> {
  const cb = afterMock.mock.calls[0]![0] as () => Promise<void>
  await cb()
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('startStoreSync', () => {
  it('reports started:false and schedules nothing when the claim loses', async () => {
    updateMany.mockResolvedValue({ count: 0 } as never)
    const r = await startStoreSync('s1', 'x.myshopify.com', 'tok')
    expect(r).toEqual({ started: false })
    expect(afterMock).not.toHaveBeenCalled()
  })

  it('claims atomically with the stale-recovery OR clause and starts the pipeline', async () => {
    updateMany.mockResolvedValue({ count: 1 } as never)
    const r = await startStoreSync('s1', 'x.myshopify.com', 'tok')
    expect(r).toEqual({ started: true })
    const arg = updateMany.mock.calls[0]![0]!
    expect(arg.where).toMatchObject({ id: 's1' })
    expect(arg.where!.OR).toHaveLength(3)
    expect(arg.data).toMatchObject({ syncStatus: 'SYNCING', syncError: null })
    expect(afterMock).toHaveBeenCalledTimes(1)
  })

  it('pipeline: backfill → re-assert SYNCING → analyze → READY, then revalidates both paths', async () => {
    updateMany.mockResolvedValue({ count: 1 } as never)
    await startStoreSync('s1', 'x.myshopify.com', 'tok')
    await runPipeline()
    expect(vi.mocked(backfillStore)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(analyzeStore)).toHaveBeenCalledTimes(1)
    // 1st update re-asserts SYNCING (backfillStore flips READY internally), 2nd lands READY
    expect(update.mock.calls[0]![0]!.data).toMatchObject({ syncStatus: 'SYNCING' })
    expect(update.mock.calls[1]![0]!.data).toMatchObject({ syncStatus: 'READY', syncError: null })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/connections')
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/app')
  })

  it('pipeline failure writes ERROR with a 500-char-truncated message', async () => {
    updateMany.mockResolvedValue({ count: 1 } as never)
    vi.mocked(backfillStore).mockRejectedValueOnce(new Error('boom '.repeat(200)))
    await startStoreSync('s1', 'x.myshopify.com', 'tok')
    await runPipeline()
    const last = update.mock.calls.at(-1)![0]!
    expect(last.data).toMatchObject({ syncStatus: 'ERROR' })
    expect((last.data as { syncError: string }).syncError.length).toBeLessThanOrEqual(500)
  })

  it('a revalidatePath failure does NOT flip a successful sync to ERROR', async () => {
    updateMany.mockResolvedValue({ count: 1 } as never)
    vi.mocked(revalidatePath).mockImplementationOnce(() => {
      throw new Error('no request scope')
    })
    await startStoreSync('s1', 'x.myshopify.com', 'tok')
    await runPipeline()
    expect(update.mock.calls.at(-1)![0]!.data).toMatchObject({ syncStatus: 'READY' })
  })
})
