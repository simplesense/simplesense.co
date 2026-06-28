import { describe, it, expect } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { disconnectStore } from '../src/disconnect'

function makeFake() {
  const calls: string[] = []
  const del = (name: string) => () => {
    calls.push(name)
    return Promise.resolve({ count: 0 })
  }
  const db = {
    store: {
      findFirst: ({ where }: { where: { id: string; orgId: string } }) =>
        Promise.resolve(where.id === 'storeA' && where.orgId === 'orgA' ? { id: 'storeA' } : null),
      update: () => {
        calls.push('store.update')
        return Promise.resolve({})
      },
    },
    recommendation: { deleteMany: del('recommendation') },
    metric: { deleteMany: del('metric') },
    analysisRun: { deleteMany: del('analysisRun') },
    audit: { deleteMany: del('audit') },
    orderLineItem: { deleteMany: del('orderLineItem') },
    order: { deleteMany: del('order') },
    customer: { deleteMany: del('customer') },
    product: { deleteMany: del('product') },
    storeLocation: { deleteMany: del('storeLocation') },
  } as unknown as PrismaClient
  return { db, calls }
}

describe('disconnectStore', () => {
  it('refuses another org’s store and deletes nothing', async () => {
    const { db, calls } = makeFake()
    expect(await disconnectStore(db, 'orgB', 'storeA')).toBe(false)
    expect(calls).toEqual([])
  })

  it('purges analytics + analysis and clears the token for the owning org', async () => {
    const { db, calls } = makeFake()
    expect(await disconnectStore(db, 'orgA', 'storeA')).toBe(true)
    expect(calls).toContain('order')
    expect(calls).toContain('customer')
    expect(calls).toContain('recommendation')
    expect(calls).toContain('store.update') // token cleared, status reset
  })
})
