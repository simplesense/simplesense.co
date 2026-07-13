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
  const heartbeats = { count: 0 }
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
      update: ({ data }: { data: { syncStatus?: string; syncStartedAt?: Date } }) => {
        if (data.syncStatus) status.push(data.syncStatus)
        else if (data.syncStartedAt) heartbeats.count++
        return Promise.resolve({})
      },
    },
    storeLocation: {
      deleteMany: () => Promise.resolve({ count: 0 }),
      create: ({ data }: { data: unknown }) => Promise.resolve(data),
    },
    customer: {
      upsert: upsertInto(customers, 'c'),
      update: ({ where, data }: { where: { id: string }; data: { firstOrderAt?: Date } }) => {
        for (const row of customers.values()) {
          const r = row as { id: string; firstOrderAt?: Date | null }
          if (r.id === where.id) Object.assign(r, data)
        }
        return Promise.resolve({})
      },
    },
    product: { upsert: upsertInto(products, 'p') },
    order: {
      upsert: upsertInto(orders, 'o'),
      groupBy: () => {
        const mins = new Map<string, Date>()
        for (const row of orders.values()) {
          const o = row as { customerId?: string | null; createdAt: Date }
          if (!o.customerId) continue
          const cur = mins.get(o.customerId)
          if (!cur || o.createdAt < cur) mins.set(o.customerId, o.createdAt)
        }
        return Promise.resolve(
          [...mins].map(([customerId, min]) => ({ customerId, _min: { createdAt: min } })),
        )
      },
    },
  } as unknown as PrismaClient
  return {
    db,
    status,
    heartbeats,
    sizes: () => ({ customers: customers.size, products: products.size, orders: orders.size }),
    customerRows: () => [...customers.values()] as { id: string; firstOrderAt?: Date | null }[],
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

  it('heartbeats syncStartedAt once per orders page (stale-watchdog safety)', async () => {
    const { db, heartbeats } = fakeDb()
    await backfillStore(db, 'store1', new MockShopifyReader(seed, 10), {
      shop: 'wildflower.myshopify.com',
      token: 'tok',
    })
    expect(heartbeats.count).toBe(Math.ceil(seed.orders.length / 10))
  })

  it('derives firstOrderAt = min order createdAt per customer', async () => {
    const { db, customerRows } = fakeDb()
    await backfillStore(db, 'store1', new MockShopifyReader(seed, 10), {
      shop: 'wildflower.myshopify.com',
      token: 'tok',
    })
    // pick any seed customer that has orders; expected min from the seed itself
    const withOrders = seed.orders.filter((o) => o.customerId)
    const target = withOrders[0]!.customerId!
    const expected = new Date(
      Math.min(
        ...seed.orders.filter((o) => o.customerId === target).map((o) => o.createdAt.getTime()),
      ),
    )
    // internal fake id is `c_${digits of target}` (shopifyIdOf strips non-digits)
    const internalId = `c_${target.replace(/\D/g, '')}`
    const row = customerRows().find((c) => c.id === internalId)
    expect(row?.firstOrderAt).toEqual(expected)
  })
})
