import { prisma } from '@ss/db'
import { backfillStore, analyzeStore } from '@ss/jobs'
import { RealShopifyReader } from '@ss/integrations'
import { createLlmClient } from '@ss/engine'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

/** A SYNCING store with no heartbeat past this is treated as stale and may be restarted. */
export const STUCK_AFTER_MS = 15 * 60 * 1000

/**
 * Atomically claim and run a background sync for an ALREADY-AUTHORIZED store. Callers own the
 * tenant/demo/session checks — this module implements only the race-free claim and the after()
 * pipeline. Used by both the syncStoreAction server action and the OAuth callback route
 * (server actions cannot be invoked from route handlers, hence the shared plain module).
 * after() is stable in Next 15 for both Server Actions and Route Handlers.
 */
export async function startStoreSync(
  storeId: string,
  shop: string,
  token: string,
): Promise<{ started: boolean }> {
  // Atomic claim (no check-then-write race): flip to SYNCING only if not already running or
  // the running job is stale (>15min, e.g. killed by a deploy).
  const stale = new Date(Date.now() - STUCK_AFTER_MS)
  const claimed = await prisma.store.updateMany({
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
  if (claimed.count === 0) return { started: false }

  after(async () => {
    try {
      await backfillStore(prisma, storeId, new RealShopifyReader(), { shop, token })
      // backfillStore flips status to READY internally — re-assert SYNCING for the analysis leg
      // so the UI stays "syncing" until the moves actually exist.
      await prisma.store.update({ where: { id: storeId }, data: { syncStatus: 'SYNCING' } })
      await analyzeStore(prisma, storeId, { llm: createLlmClient() })
      await prisma.store.update({
        where: { id: storeId },
        data: { syncStatus: 'READY', lastSyncedAt: new Date(), syncError: null },
      })
      try {
        revalidatePath('/connections')
        revalidatePath('/app')
      } catch {
        // Cache revalidation is a hint; never let it flip a successful sync to ERROR.
      }
    } catch (err) {
      await prisma.store.update({
        where: { id: storeId },
        data: { syncStatus: 'ERROR', syncError: String((err as Error).message).slice(0, 500) },
      })
    }
  })

  return { started: true }
}
