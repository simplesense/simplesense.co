'use server'
import { prisma, disconnectStore } from '@ss/db'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

/** Disconnect + purge a store's data, tenant-scoped (§11.1). */
export async function disconnectStoreAction(storeId: string): Promise<{ ok: boolean }> {
  const { orgId } = await getSession()
  const ok = await disconnectStore(prisma, orgId, storeId)
  revalidatePath('/connections')
  return { ok }
}
