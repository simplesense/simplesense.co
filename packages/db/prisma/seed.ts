import { prisma } from '../src/client'
import { DEMO } from '../src/demo-ids'
import { makeSeedStore } from '../src/demo-fixture'
import { ingestNormalizedStore } from '../src/ingest'

/** Idempotent seed: demo org/user/store/subscription + ingested demo analytics. */
async function main(): Promise<void> {
  const org = await prisma.organization.upsert({
    where: { id: DEMO.orgId },
    update: {},
    create: { id: DEMO.orgId, name: DEMO.storeName },
  })
  await prisma.user.upsert({
    where: { email: DEMO.userEmail },
    update: {},
    create: { id: DEMO.userId, orgId: org.id, email: DEMO.userEmail, role: 'OWNER' },
  })
  await prisma.store.upsert({
    where: { shopDomain: DEMO.shopDomain },
    // Store settings (physical retail + free-ship threshold) live on the Store, not derived
    // from Shopify. The demo store is omnichannel with a $75 threshold.
    update: { hasPhysicalLocations: true, freeShippingThreshold: 75, currency: 'USD' },
    create: {
      id: DEMO.storeId,
      orgId: org.id,
      shopDomain: DEMO.shopDomain,
      syncStatus: 'PENDING',
      hasPhysicalLocations: true,
      freeShippingThreshold: 75,
      currency: 'USD',
    },
  })
  await prisma.subscription.upsert({
    where: { orgId: org.id },
    update: {},
    create: { id: 'demo_sub', orgId: org.id, tier: 'PRO', status: 'ACTIVE' },
  })

  // Ingest the demo analytics (idempotent upserts) so the dashboard has real DB data.
  const store = makeSeedStore(new Date())
  await ingestNormalizedStore(prisma, DEMO.orgId, DEMO.storeId, store)

  // eslint-disable-next-line no-console
  console.log(`Seeded ${DEMO.orgId}: org/user/store/subscription + ${store.orders.length} orders`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
