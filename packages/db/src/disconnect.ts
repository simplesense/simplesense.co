import type { PrismaClient } from '@prisma/client'

/**
 * Disconnect a store and PURGE its ingested + derived data (§11.1 data-deletion-on-
 * disconnect). Tenant-scoped: only the owning org can disconnect. Children are deleted
 * before parents to respect FKs; the Store row is kept (token cleared, status reset) so it
 * can be reconnected. Returns false if the store isn't the org's.
 */
export async function disconnectStore(
  db: PrismaClient,
  orgId: string,
  storeId: string,
): Promise<boolean> {
  const store = await db.store.findFirst({ where: { id: storeId, orgId }, select: { id: true } })
  if (!store) return false

  await db.recommendation.deleteMany({ where: { storeId } })
  await db.metric.deleteMany({ where: { run: { storeId } } })
  await db.analysisRun.deleteMany({ where: { storeId } })
  await db.audit.deleteMany({ where: { storeId } })
  await db.orderLineItem.deleteMany({ where: { order: { storeId } } })
  await db.order.deleteMany({ where: { storeId } })
  await db.customer.deleteMany({ where: { storeId } })
  await db.product.deleteMany({ where: { storeId } })
  await db.storeLocation.deleteMany({ where: { storeId } })

  await db.store.update({
    where: { id: storeId },
    data: { accessTokenEnc: null, syncStatus: 'PENDING', lastSyncedAt: null },
  })
  return true
}
