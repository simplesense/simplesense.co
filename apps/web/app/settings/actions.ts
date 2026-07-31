'use server'
import { prisma, getOrgStore, DEMO } from '@ss/db'
import { analyzeStore } from '@ss/jobs'
import { createLlmClient } from '@ss/engine'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { ownStoreId } from '@/lib/store-resolve'

/**
 * Update store settings (physical retail toggle + free-ship threshold) and re-analyze so
 * the geo branch (BOPIS vs regional) and the AOV/free-ship move reflect the change.
 * Tenant-scoped.
 */
export async function updateStoreSettings(input: {
  hasPhysicalLocations: boolean
  freeShippingThreshold: number | null
}): Promise<{ ok: boolean }> {
  const { orgId } = await getSession()
  // The shared demo store is a READ-ONLY showcase. This was the one mutating server
  // action missing the guard its siblings all have (found 2026-07-31): a server action
  // is a directly-invokable endpoint, so rendering it on an authenticated page is not
  // itself protection. Without this, any visitor in a deployment where Clerk is absent
  // (middleware becomes a pass-through) could flip the geo/free-ship inputs on the store
  // every prospect sees — and trigger a full LLM re-analysis on each call.
  if (orgId === DEMO.orgId) return { ok: false }
  const storeId = await ownStoreId(orgId)
  if (!storeId) return { ok: false }
  if (storeId === DEMO.storeId) return { ok: false }
  const store = await getOrgStore(prisma, orgId, storeId)
  if (!store) return { ok: false }

  await prisma.store.update({
    where: { id: storeId },
    data: {
      hasPhysicalLocations: input.hasPhysicalLocations,
      freeShippingThreshold: input.freeShippingThreshold,
    },
  })
  await analyzeStore(prisma, storeId, { llm: createLlmClient() })
  revalidatePath('/settings')
  revalidatePath('/app')
  revalidatePath('/monitoring')
  return { ok: true }
}
