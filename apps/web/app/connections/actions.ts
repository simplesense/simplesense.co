'use server'
import { prisma, disconnectStore, getOrgStore, DEMO } from '@ss/db'
import { backfillStore, analyzeStore } from '@ss/jobs'
import { RealShopifyReader, decryptSecret } from '@ss/integrations'
import { createLlmClient } from '@ss/engine'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { getSession } from '@/lib/auth'

/** A SYNCING store with no heartbeat past this is treated as stale and may be restarted. */
const STUCK_AFTER_MS = 15 * 60 * 1000

/** Disconnect + purge a store's data, tenant-scoped (§11.1). */
export async function disconnectStoreAction(storeId: string): Promise<{ ok: boolean }> {
  const { orgId } = await getSession()
  // The shared demo store is everyone's read-only showcase — never purgeable via an action
  // (the unauthenticated fallback session resolves to the demo org, which "owns" it).
  if (storeId === DEMO.storeId || orgId === DEMO.orgId) return { ok: false }
  const ok = await disconnectStore(prisma, orgId, storeId)
  revalidatePath('/connections')
  revalidatePath('/app')
  return { ok }
}

export interface SyncTrigger {
  ok: boolean
  error?: string
  /** true = a background sync was started; false = one was already running. */
  started?: boolean
}

/**
 * Kick off a background sync of a connected store (tenant-scoped). The heavy work — backfill
 * from Shopify + grounded analysis — runs OFF the request path via `after()`, so a store with
 * tens of thousands of orders can't time out the HTTP request. Status is persisted to
 * Store.syncStatus and polled by the UI (getSyncStatus). The backfill is idempotent, so a job
 * killed by a deploy/restart simply completes on the next Sync. A Fly machine is kept warm
 * (min_machines_running=1) so in-flight work isn't stopped.
 */
export async function syncStoreAction(storeId: string): Promise<SyncTrigger> {
  const { orgId } = await getSession()
  // Demo store is a shared read-only showcase — never syncable (it has no token anyway).
  if (storeId === DEMO.storeId || orgId === DEMO.orgId) return { ok: false, error: 'demo store' }
  const store = await getOrgStore(prisma, orgId, storeId)
  if (!store || !store.accessTokenEnc) return { ok: false, error: 'not connected' }

  const token = decryptSecret(store.accessTokenEnc)
  const shop = store.shopDomain

  // Atomic claim (no check-then-write race): flip to SYNCING only if not already running or
  // the running job is stale (>15min, e.g. killed by a deploy). If another concurrent call
  // won the claim, count === 0 and we simply report "already running".
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
  if (claimed.count === 0) return { ok: true, started: false }

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
      revalidatePath('/connections')
      revalidatePath('/app')
    } catch (err) {
      await prisma.store.update({
        where: { id: storeId },
        data: { syncStatus: 'ERROR', syncError: String((err as Error).message).slice(0, 500) },
      })
    }
  })

  return { ok: true, started: true }
}

export interface SyncState {
  status: 'PENDING' | 'SYNCING' | 'READY' | 'ERROR' | 'UNKNOWN'
  orders: number
  error: string | null
}

/** Poll the current sync state of a store the session's org owns (drives the SyncButton). */
export async function getSyncStatus(storeId: string): Promise<SyncState> {
  const { orgId } = await getSession()
  const store = await getOrgStore(prisma, orgId, storeId)
  if (!store) return { status: 'UNKNOWN', orders: 0, error: null }
  const orders = await prisma.order.count({ where: { storeId } })
  return { status: store.syncStatus, orders, error: store.syncError ?? null }
}
