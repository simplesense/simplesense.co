'use server'
import { prisma, disconnectStore, getOrgStore, DEMO } from '@ss/db'
import { decryptSecret } from '@ss/integrations'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { startStoreSync } from '@/lib/sync-runner'

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
 * from Shopify + grounded analysis — runs OFF the request path inside `startStoreSync`
 * (lib/sync-runner), so a store with tens of thousands of orders can't time out the HTTP
 * request. Status is persisted to Store.syncStatus and polled by the UI (getSyncStatus). The
 * backfill is idempotent, so a job killed by a deploy/restart simply completes on the next
 * Sync. A Fly machine is kept warm (min_machines_running=1) so in-flight work isn't stopped.
 */
export async function syncStoreAction(storeId: string): Promise<SyncTrigger> {
  const { orgId } = await getSession()
  // Demo store is a shared read-only showcase — never syncable (it has no token anyway).
  if (storeId === DEMO.storeId || orgId === DEMO.orgId) return { ok: false, error: 'demo store' }
  const store = await getOrgStore(prisma, orgId, storeId)
  if (!store || !store.accessTokenEnc) return { ok: false, error: 'not connected' }

  const { started } = await startStoreSync(
    storeId,
    store.shopDomain,
    decryptSecret(store.accessTokenEnc),
  )
  return { ok: true, started }
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
