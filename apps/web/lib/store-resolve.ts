import { prisma, DEMO } from '@ss/db'

/**
 * The store the app should show for an org: the one with the most recent completed
 * analysis run (a real connected store once it's synced), falling back to the demo store.
 * Tenant-scoped by the run's store.orgId.
 */
export async function resolveStoreId(orgId: string): Promise<string> {
  const run = await prisma.analysisRun.findFirst({
    where: { status: 'DONE', store: { orgId } },
    orderBy: { startedAt: 'desc' },
    select: { storeId: true },
  })
  return run?.storeId ?? DEMO.storeId
}
