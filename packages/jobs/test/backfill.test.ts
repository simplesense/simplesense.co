import { describe, it, expect } from 'vitest'
import type { Order } from '@ss/core'
import type { PrismaClient } from '@ss/db'
import { makeSeedStore } from '@ss/db'
import { MockShopifyReader } from '@ss/integrations'
import { collectStore, backfillStore } from '../src/backfill'

const NOW = new Date('2026-06-01T00:00:00.000Z')
const seed = makeSeedStore(NOW)

describe('collectStore — pagination', () => {
  it('drains every page from a multi-page reader (small page size)', async () => {
    const reader = new MockShopifyReader(seed, 7) // forces many pages
    const collected = await collectStore(reader, 'wildflower.myshopify.com', 'tok')
    expect(collected.orders.length).toBe(seed.orders.length)
    expect(collected.customers.length).toBe(seed.customers.length)
    expect(collected.products.length).toBe(seed.products.length)
    expect(collected.hasPhysicalLocations).toBe(seed.hasPhysicalLocations)
  })
})

/** In-memory fake whose upserts are keyed on shopifyId — so re-running is idempotent. */
function fakeDb() {
  const status: string[] = []
  const customers = new Map<string, unknown>()
  const products = new Map<string, unknown>()
  const orders = new Map<string, unknown>()
  const keyOf = (w: { storeId_shopifyId: { shopifyId: bigint } }) =>
    String(w.storeId_shopifyId.shopifyId)
  const upsertInto =
    (map: Map<string, unknown>, prefix: string) =>
    ({
      where,
      create,
    }: {
      where: { storeId_shopifyId: { shopifyId: bigint } }
      create: unknown
    }) => {
      const k = keyOf(where)
      if (!map.has(k)) map.set(k, { id: `${prefix}_${k}`, ...(create as object) })
      return Promise.resolve(map.get(k))
    }
  const db = {
    store: {
      findUnique: () => Promise.resolve({ orgId: 'org1' }),
      update: ({ data }: { data: { syncStatus?: string } }) => {
        if (data.syncStatus) status.push(data.syncStatus)
        return Promise.resolve({})
      },
    },
    storeLocation: {
      deleteMany: () => Promise.resolve({ count: 0 }),
      create: ({ data }: { data: unknown }) => Promise.resolve(data),
    },
    customer: { upsert: upsertInto(customers, 'c') },
    product: { upsert: upsertInto(products, 'p') },
    order: { upsert: upsertInto(orders, 'o') },
  } as unknown as PrismaClient
  return {
    db,
    status,
    sizes: () => ({ customers: customers.size, products: products.size, orders: orders.size }),
  }
}

describe('backfillStore — status + idempotency', () => {
  it('transitions SYNCING→READY and ingests all rows', async () => {
    const { db, status, sizes } = fakeDb()
    const res = await backfillStore(db, 'store1', new MockShopifyReader(seed, 10), {
      shop: 'wildflower.myshopify.com',
      token: 'tok',
    })
    expect(status[0]).toBe('SYNCING')
    expect(status[status.length - 1]).toBe('READY')
    expect(res.orders).toBe(seed.orders.length)
    expect(sizes().orders).toBe(seed.orders.length)
  })

  it('is idempotent — running twice yields the same row counts (Prime Directive #9)', async () => {
    const { db, sizes } = fakeDb()
    const reader = new MockShopifyReader(seed, 10)
    await backfillStore(db, 'store1', reader, { shop: 'wildflower.myshopify.com', token: 'tok' })
    const first = sizes()
    await backfillStore(db, 'store1', new MockShopifyReader(seed, 10), {
      shop: 'wildflower.myshopify.com',
      token: 'tok',
    })
    expect(sizes()).toEqual(first)
  })

  it('marks ERROR and rethrows when the reader fails (resumable)', async () => {
    const { db, status } = fakeDb()
    class FailingReader extends MockShopifyReader {
      // eslint-disable-next-line require-yield
      override async *orders(): AsyncGenerator<Order[]> {
        throw new Error('shopify 500')
      }
    }
    await expect(
      backfillStore(db, 'store1', new FailingReader(seed), {
        shop: 'wildflower.myshopify.com',
        token: 'tok',
      }),
    ).rejects.toThrow(/500/)
    expect(status).toContain('ERROR')
  })
})
