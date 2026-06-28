import type { PrismaClient, Recommendation, Store } from '@prisma/client'

/**
 * Tenant-isolation helpers (Prime Directives #2/#3). The invariant: NEVER query a
 * store's data without first proving the store belongs to the requesting org. Every
 * read path goes through one of these; there is no helper that takes a bare storeId
 * without an orgId. The isolation test exercises these against fixture data.
 */

/** The store ids owned by an org. */
export async function orgStoreIds(db: PrismaClient, orgId: string): Promise<string[]> {
  const stores = await db.store.findMany({ where: { orgId }, select: { id: true } })
  return stores.map((s: { id: string }) => s.id)
}

/** A store, but only if it belongs to `orgId`. Returns null for another org's store. */
export async function getOrgStore(
  db: PrismaClient,
  orgId: string,
  storeId: string,
): Promise<Store | null> {
  return db.store.findFirst({ where: { id: storeId, orgId } })
}

/**
 * Recommendations for a store, scoped to the org. If the store is not the org's, returns
 * an empty list — a cross-tenant read can never leak another org's recommendations.
 */
export async function recommendationsForOrgStore(
  db: PrismaClient,
  orgId: string,
  storeId: string,
): Promise<Recommendation[]> {
  const store = await getOrgStore(db, orgId, storeId)
  if (!store) return []
  return db.recommendation.findMany({ where: { storeId }, orderBy: { rankScore: 'desc' } })
}
