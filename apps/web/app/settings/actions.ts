'use server'
import { prisma, getOrgStore } from '@ss/db'
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
  const storeId = await ownStoreId(orgId)
  if (!storeId) return { ok: false }
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
