import type { PrismaClient } from '@prisma/client'
import type { NormalizedStore } from '@ss/core'

/** Read a store's persisted analytics into the normalized domain shape the analyzers consume. */
export async function loadNormalizedStore(
  db: PrismaClient,
  storeId: string,
): Promise<NormalizedStore | null> {
  const store = await db.store.findUnique({ where: { id: storeId }, include: { locations: true } })
  if (!store) return null

  const [customers, products, orders] = await Promise.all([
    db.customer.findMany({ where: { storeId } }),
    db.product.findMany({ where: { storeId } }),
    db.order.findMany({ where: { storeId }, include: { lineItems: true } }),
  ])

  return {
    storeId: store.id,
    currency: store.currency,
    hasPhysicalLocations: store.hasPhysicalLocations,
    freeShippingThreshold:
      store.freeShippingThreshold != null ? Number(store.freeShippingThreshold) : null,
    locations: store.locations.map((l) => ({
      id: l.id,
      name: l.name,
      lat: l.lat,
      lng: l.lng,
      address: { city: l.city, region: l.region },
    })),
    customers: customers.map((c) => ({
      id: c.id,
      email: c.email,
      defaultAddress: {
        city: c.city,
        region: c.region,
        country: c.country,
        zip: c.zip,
        lat: c.lat,
        lng: c.lng,
      },
      firstOrderAt: c.firstOrderAt,
    })),
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      unitCost: p.unitCost != null ? Number(p.unitCost) : null,
    })),
    orders: orders.map((o) => ({
      id: o.id,
      customerId: o.customerId,
      createdAt: o.createdAt,
      totalPrice: Number(o.totalPrice),
      discountTotal: Number(o.discountTotal),
      refundedAmount: Number(o.refundedAmount),
      currency: o.currency,
      sourceName: o.sourceName,
      shippingAddress: {
        city: o.shipCity,
        region: o.shipRegion,
        country: o.shipCountry,
        zip: o.shipZip,
        lat: o.shipLat,
        lng: o.shipLng,
      },
      lineItems: o.lineItems.map((li) => ({
        productId: li.productId,
        quantity: li.qty,
        price: Number(li.price),
        discount: Number(li.discount),
      })),
    })),
  }
}
