import { prisma, DEMO, type Store } from '@ss/db'

/**
 * The store the app should show for an org: the one with the most recent completed
 * analysis run (a real connected+synced store), falling back to the shared demo store as a
 * read-only showcase for new orgs. Tenant-scoped by the run's store.orgId; the demo store
 * is intentionally shared (seed data, no PII).
 */
export async function resolveActiveStore(
  orgId: string,
): Promise<{ store: Store; isDemo: boolean }> {
  const run = await prisma.analysisRun.findFirst({
    where: { status: 'DONE', store: { orgId } },
    orderBy: { startedAt: 'desc' },
    select: { storeId: true },
  })
  if (run) {
    const store = await prisma.store.findUnique({ where: { id: run.storeId } })
    if (store) return { store, isDemo: false }
  }
  const demo = await prisma.store.findUnique({ where: { id: DEMO.storeId } })
  if (!demo) throw new Error('demo store missing — run `pnpm --filter @ss/db seed`')
  return { store: demo, isDemo: true }
}

/** The org's own store id (most recent), or null if they haven't connected one. */
export async function ownStoreId(orgId: string): Promise<string | null> {
  const s = await prisma.store.findFirst({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
  return s?.id ?? null
}
