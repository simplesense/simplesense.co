import type { PrismaClient } from '@prisma/client'
import type { NormalizedStore } from '@ss/core'

/** Numeric Shopify id from a fixture string id like "c12"/"o3" (demo only). */
function shopifyIdOf(id: string): bigint {
  const n = id.replace(/\D/g, '')
  return BigInt(n.length ? n : '0')
}

/**
 * Idempotent ingestion of a normalized store into the DB (upserts keyed on shopify ids,
 * Prime Directive #9). Used by the seed today; the Shopify backfill job (Slice 3) will
 * feed the same shape. Returns the storeId.
 */
export async function ingestNormalizedStore(
  db: PrismaClient,
  orgId: string,
  storeId: string,
  store: NormalizedStore,
): Promise<string> {
  await db.store.update({
    where: { id: storeId },
    data: {
      currency: store.currency,
      hasPhysicalLocations: store.hasPhysicalLocations,
      freeShippingThreshold: store.freeShippingThreshold ?? null,
      syncStatus: 'READY',
      lastSyncedAt: new Date(),
    },
  })

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
    const row = await db.customer.upsert({
      where: { storeId_shopifyId: { storeId, shopifyId: shopifyIdOf(c.id) } },
      update: {},
      create: {
        storeId,
        shopifyId: shopifyIdOf(c.id),
        email: c.email ?? null,
        city: c.defaultAddress?.city ?? null,
        region: c.defaultAddress?.region ?? null,
        country: c.defaultAddress?.country ?? null,
        zip: c.defaultAddress?.zip ?? null,
        lat: c.defaultAddress?.lat ?? null,
        lng: c.defaultAddress?.lng ?? null,
        firstOrderAt: c.firstOrderAt ?? null,
      },
    })
    customerDbId.set(c.id, row.id)
  }

  // products
  const productDbId = new Map<string, string>()
  for (const p of store.products) {
    const row = await db.product.upsert({
      where: { storeId_shopifyId: { storeId, shopifyId: shopifyIdOf(p.id) } },
      update: {},
      create: {
        storeId,
        shopifyId: shopifyIdOf(p.id),
        title: p.title,
        type: p.type ?? null,
        unitCost: p.unitCost ?? null,
      },
    })
    productDbId.set(p.id, row.id)
  }

  // orders + line items
  for (const o of store.orders) {
    const addr = o.shippingAddress
    const order = await db.order.upsert({
      where: { storeId_shopifyId: { storeId, shopifyId: shopifyIdOf(o.id) } },
      update: {},
      create: {
        storeId,
        shopifyId: shopifyIdOf(o.id),
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
        lineItems: {
          create: o.lineItems.map((li) => ({
            productId: li.productId ? (productDbId.get(li.productId) ?? null) : null,
            qty: li.quantity,
            price: li.price,
            discount: li.discount ?? 0,
          })),
        },
      },
    })
    void order
  }

  return storeId
}
