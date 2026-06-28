'use server'
import { prisma, disconnectStore, getOrgStore } from '@ss/db'
import { backfillStore, analyzeStore } from '@ss/jobs'
import { RealShopifyReader, decryptSecret } from '@ss/integrations'
import { createLlmClient } from '@ss/engine'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

/** Disconnect + purge a store's data, tenant-scoped (§11.1). */
export async function disconnectStoreAction(storeId: string): Promise<{ ok: boolean }> {
  const { orgId } = await getSession()
  const ok = await disconnectStore(prisma, orgId, storeId)
  revalidatePath('/connections')
  revalidatePath('/app')
  return { ok }
}

/**
 * Sync a connected store: decrypt its token, backfill from Shopify (idempotent), then run
 * the grounded analysis. Tenant-scoped. After this, the dashboard resolves to this store.
 */
export async function syncStoreAction(storeId: string): Promise<{ ok: boolean; error?: string }> {
  const { orgId } = await getSession()
  const store = await getOrgStore(prisma, orgId, storeId)
  if (!store || !store.accessTokenEnc) return { ok: false, error: 'not connected' }
  try {
    const token = decryptSecret(store.accessTokenEnc)
    await backfillStore(prisma, storeId, new RealShopifyReader(), { shop: store.shopDomain, token })
    await analyzeStore(prisma, storeId, { llm: createLlmClient() })
    revalidatePath('/connections')
    revalidatePath('/app')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
