'use server'
import { prisma, disconnectStore, getOrgStore } from '@ss/db'
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
  const store = await getOrgStore(prisma, orgId, storeId)
  if (!store || !store.accessTokenEnc) return { ok: false, error: 'not connected' }

  // Don't stack a second sync on top of a healthy in-flight one; a stale one may be restarted.
  if (store.syncStatus === 'SYNCING') {
    const startedAt = store.syncStartedAt?.getTime() ?? 0
    if (Date.now() - startedAt < STUCK_AFTER_MS) return { ok: true, started: false }
  }

  const token = decryptSecret(store.accessTokenEnc)
  const shop = store.shopDomain
  await prisma.store.update({
    where: { id: storeId },
    data: { syncStatus: 'SYNCING', syncStartedAt: new Date(), syncError: null },
  })

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
