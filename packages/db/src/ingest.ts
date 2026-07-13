import type { PrismaClient } from '@prisma/client'
import type { NormalizedStore, Order } from '@ss/core'

/** Numeric Shopify id from a fixture string id like "c12"/"o3" (demo only). */
function shopifyIdOf(id: string): bigint {
  const n = id.replace(/\D/g, '')
  return BigInt(n.length ? n : '0')
}

export interface IngestIdMaps {
  /** reader/fixture id (e.g. "gid://shopify/Customer/123" or "c12") → internal db cuid */
  customerDbId: Map<string, string>
  productDbId: Map<string, string>
}

/** Ingest locations (replace set) + customers + products; returns id maps for order ingestion. */
export async function ingestCatalog(
  db: PrismaClient,
  storeId: string,
  store: Pick<NormalizedStore, 'locations' | 'customers' | 'products'>,
): Promise<IngestIdMaps> {
  // locations — replace set (small, demo-scale)
  await db.storeLocation.deleteMany({ where: { storeId } })
  for (const loc of store.locations) {
    await db.storeLocation.create({
      data: {
        storeId,
        name: loc.name,
        lat: loc.lat ?? null,
        lng: loc.lng ?? null,
        city: loc.address?.city ?? null,
        region: loc.address?.region ?? null,
      },
    })
  }

  // customers
  const customerDbId = new Map<string, string>()
  for (const c of store.customers) {
    const fields = {
      email: c.email ?? null,
      city: c.defaultAddress?.city ?? null,
      region: c.defaultAddress?.region ?? null,
      country: c.defaultAddress?.country ?? null,
      zip: c.defaultAddress?.zip ?? null,
      lat: c.defaultAddress?.lat ?? null,
      lng: c.defaultAddress?.lng ?? null,
      firstOrderAt: c.firstOrderAt ?? null,
    }
    const row = await db.customer.upsert({
      where: { storeId_shopifyId: { storeId, shopifyId: shopifyIdOf(c.id) } },
      update: fields, // re-sync refreshes mutable fields (address, email, first-order)
      create: { storeId, shopifyId: shopifyIdOf(c.id), ...fields },
    })
    customerDbId.set(c.id, row.id)
  }

  // products
  const productDbId = new Map<string, string>()
  for (const p of store.products) {
    const fields = { title: p.title, type: p.type ?? null, unitCost: p.unitCost ?? null }
    const row = await db.product.upsert({
      where: { storeId_shopifyId: { storeId, shopifyId: shopifyIdOf(p.id) } },
      update: fields, // re-sync refreshes title/type/cost (cost especially — unlocks margin)
      create: { storeId, shopifyId: shopifyIdOf(p.id), ...fields },
    })
    productDbId.set(p.id, row.id)
  }

  return { customerDbId, productDbId }
}

/** Ingest one page of orders + line items, keyed against the id maps from ingestCatalog. */
export async function ingestOrdersPage(
  db: PrismaClient,
  storeId: string,
  orders: readonly Order[],
  maps: IngestIdMaps,
): Promise<void> {
  const { customerDbId, productDbId } = maps
  for (const o of orders) {
    const addr = o.shippingAddress
    const scalars = {
      customerId: o.customerId ? (customerDbId.get(o.customerId) ?? null) : null,
      totalPrice: o.totalPrice,
      currency: o.currency,
      discountTotal: o.discountTotal,
      refundedAmount: o.refundedAmount ?? 0,
      sourceName: o.sourceName ?? null,
      createdAt: o.createdAt,
      shipCity: addr?.city ?? null,
      shipRegion: addr?.region ?? null,
      shipCountry: addr?.country ?? null,
      shipZip: addr?.zip ?? null,
      shipLat: addr?.lat ?? null,
      shipLng: addr?.lng ?? null,
    }
    const lineItems = o.lineItems.map((li) => ({
      productId: li.productId ? (productDbId.get(li.productId) ?? null) : null,
      qty: li.quantity,
      price: li.price,
      discount: li.discount ?? 0,
    }))
    // Idempotent re-sync: refresh order scalars (refunds/totals change over time) and REPLACE
    // its line items (deleteMany→create) so a second sync reflects edits/refunds instead of
    // silently dropping them.
    await db.order.upsert({
      where: { storeId_shopifyId: { storeId, shopifyId: shopifyIdOf(o.id) } },
      update: { ...scalars, lineItems: { deleteMany: {}, create: lineItems } },
      create: {
        storeId,
        shopifyId: shopifyIdOf(o.id),
        ...scalars,
        lineItems: { create: lineItems },
      },
    })
  }
}

/** Derive Customer.firstOrderAt = min(order.createdAt) per customer, from ingested rows. */
export async function applyFirstOrderAt(db: PrismaClient, storeId: string): Promise<number> {
  const groups = await db.order.groupBy({
    by: ['customerId'],
    where: { storeId, customerId: { not: null } },
    _min: { createdAt: true },
  })
  let updated = 0
  for (const g of groups) {
    if (!g.customerId || !g._min.createdAt) continue
    await db.customer.update({
      where: { id: g.customerId },
      data: { firstOrderAt: g._min.createdAt },
    })
    updated++
  }
  return updated
}

/**
 * Idempotent ingestion of a normalized store into the DB (upserts keyed on shopify ids,
 * Prime Directive #9). Used by the seed today; the Shopify backfill job streams orders via
 * ingestCatalog/ingestOrdersPage directly instead (see @ss/jobs backfillStore) for bounded
 * memory on large stores. Returns the storeId.
 */
export async function ingestNormalizedStore(
  db: PrismaClient,
  orgId: string,
  storeId: string,
  store: NormalizedStore,
): Promise<string> {
  const maps = await ingestCatalog(db, storeId, store)
  await ingestOrdersPage(db, storeId, store.orders, maps)

  // READY is flipped ONLY after every row is written — flipping it up-front made the sync
  // report "done" at ~0% progress and let the dashboard analyze a half-ingested store.
  // currency comes from Shopify; hasPhysicalLocations + freeShippingThreshold are USER
  // settings (Shopify can't reliably tell us), so a sync must NOT overwrite them.
  await db.store.update({
    where: { id: storeId },
    data: {
      currency: store.currency,
      syncStatus: 'READY',
      lastSyncedAt: new Date(),
    },
  })

  return storeId
}
