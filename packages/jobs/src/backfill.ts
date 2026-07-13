import type { Customer, NormalizedStore, Order, Product, StoreLocation } from '@ss/core'
import type { ShopifyReader } from '@ss/integrations'
import { ingestCatalog, ingestOrdersPage, applyFirstOrderAt, type PrismaClient } from '@ss/db'

async function drain<T>(gen: AsyncGenerator<T[]>): Promise<T[]> {
  const out: T[] = []
  for await (const page of gen) out.push(...page)
  return out
}

/**
 * Consume every page from the reader and assemble a normalized store (storeId set by caller).
 * Demo/test-scale only — materializes the whole store in RAM; live backfill streams via
 * backfillStore.
 */
export async function collectStore(
  reader: ShopifyReader,
  shop: string,
  token: string,
): Promise<NormalizedStore> {
  const info = await reader.fetchShopInfo(shop, token)
  const [customers, products, orders, locations] = await Promise.all([
    drain<Customer>(reader.customers(shop, token)),
    drain<Product>(reader.products(shop, token)),
    drain<Order>(reader.orders(shop, token)),
    drain<StoreLocation>(reader.locations(shop, token)),
  ])
  return {
    storeId: '',
    currency: info.currency,
    hasPhysicalLocations: info.hasPhysicalLocations,
    freeShippingThreshold: info.freeShippingThreshold,
    locations,
    customers,
    products,
    orders,
  }
}

export interface BackfillResult {
  orders: number
  customers: number
  products: number
}

/**
 * Historical backfill (Slice 3): SYNCING → paginate everything via the reader → idempotent
 * upsert (Prime Directive #9, re-run safe) → READY. On failure the store is marked ERROR and
 * the error rethrown so the job runner can retry/resume. Durable orchestration (Inngest) wraps
 * this; the function itself is plain + directly testable.
 */
export async function backfillStore(
  db: PrismaClient,
  storeId: string,
  reader: ShopifyReader,
  opts: { shop: string; token: string },
): Promise<BackfillResult> {
  const store = await db.store.findUnique({ where: { id: storeId }, select: { orgId: true } })
  if (!store) throw new Error(`store ${storeId} not found`)

  await db.store.update({
    where: { id: storeId },
    data: { syncStatus: 'SYNCING', syncStartedAt: new Date() },
  })
  try {
    const info = await reader.fetchShopInfo(opts.shop, opts.token)
    // Catalog phases are small (id/email/address rows); orders dominate memory and stream below.
    const [customers, products, locations] = await Promise.all([
      drain<Customer>(reader.customers(opts.shop, opts.token)),
      drain<Product>(reader.products(opts.shop, opts.token)),
      drain<StoreLocation>(reader.locations(opts.shop, opts.token)),
    ])
    const maps = await ingestCatalog(db, storeId, { locations, customers, products })

    let orderCount = 0
    for await (const page of reader.orders(opts.shop, opts.token)) {
      await ingestOrdersPage(db, storeId, page, maps)
      orderCount += page.length
      // Heartbeat: keep the 15-min stale watchdog (connections/actions.ts) from stealing a live job.
      await db.store.update({ where: { id: storeId }, data: { syncStartedAt: new Date() } })
    }

    await applyFirstOrderAt(db, storeId)
    await db.store.update({
      where: { id: storeId },
      data: { currency: info.currency, syncStatus: 'READY', lastSyncedAt: new Date() },
    })
    return { orders: orderCount, customers: customers.length, products: products.length }
  } catch (err) {
    await db.store.update({ where: { id: storeId }, data: { syncStatus: 'ERROR' } })
    throw err
  }
}
