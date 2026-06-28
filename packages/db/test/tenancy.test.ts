import { describe, it, expect } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { orgStoreIds, getOrgStore, recommendationsForOrgStore } from '../src/tenancy'

/**
 * Tenant-isolation proof (Prime Directives #2/#3, §15). Uses an in-memory fake that
 * honors the exact where-clauses the helpers issue, so the test is deterministic and
 * runs in CI with no database. It proves a query scoped to org A cannot read org B's rows.
 */
const stores = [
  { id: 'storeA', orgId: 'orgA' },
  { id: 'storeB', orgId: 'orgB' },
]
const recommendations = [
  { id: 'recA1', storeId: 'storeA', rankScore: 9 },
  { id: 'recA2', storeId: 'storeA', rankScore: 5 },
  { id: 'recB1', storeId: 'storeB', rankScore: 7 },
]

const fakeDb = {
  store: {
    findMany: ({ where }: { where: { orgId: string } }) =>
      Promise.resolve(stores.filter((s) => s.orgId === where.orgId)),
    findFirst: ({ where }: { where: { id: string; orgId: string } }) =>
      Promise.resolve(stores.find((s) => s.id === where.id && s.orgId === where.orgId) ?? null),
  },
  recommendation: {
    findMany: ({ where }: { where: { storeId: string } }) =>
      Promise.resolve(recommendations.filter((r) => r.storeId === where.storeId)),
  },
} as unknown as PrismaClient

describe('tenant isolation', () => {
  it('orgStoreIds returns only the org’s own stores', async () => {
    expect(await orgStoreIds(fakeDb, 'orgA')).toEqual(['storeA'])
    expect(await orgStoreIds(fakeDb, 'orgB')).toEqual(['storeB'])
  })

  it('getOrgStore refuses another org’s store', async () => {
    expect(await getOrgStore(fakeDb, 'orgA', 'storeA')).not.toBeNull()
    expect(await getOrgStore(fakeDb, 'orgA', 'storeB')).toBeNull() // B is orgB's
  })

  it('org A cannot read org B’s recommendations (no cross-tenant leak)', async () => {
    const aReadsOwn = await recommendationsForOrgStore(fakeDb, 'orgA', 'storeA')
    expect(aReadsOwn.map((r) => r.id)).toEqual(['recA1', 'recA2'])

    const aReadsB = await recommendationsForOrgStore(fakeDb, 'orgA', 'storeB')
    expect(aReadsB).toEqual([]) // the critical assertion: no leak of org B's rows
  })
})
