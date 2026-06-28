import { prisma } from '../src/client'

/** Idempotent seed: a demo org/user/store. Safe to re-run (fixed ids + upserts). */
async function main(): Promise<void> {
  const org = await prisma.organization.upsert({
    where: { id: 'demo_org' },
    update: {},
    create: { id: 'demo_org', name: 'Wildflower Skincare' },
  })
  await prisma.user.upsert({
    where: { email: 'owner@wildflower.example' },
    update: {},
    create: { id: 'demo_user', orgId: org.id, email: 'owner@wildflower.example', role: 'OWNER' },
  })
  await prisma.store.upsert({
    where: { shopDomain: 'wildflower.myshopify.com' },
    update: {},
    create: {
      id: 'demo_store',
      orgId: org.id,
      shopDomain: 'wildflower.myshopify.com',
      syncStatus: 'READY',
    },
  })
  await prisma.subscription.upsert({
    where: { orgId: org.id },
    update: {},
    create: { id: 'demo_sub', orgId: org.id, tier: 'PRO', status: 'ACTIVE' },
  })
  // eslint-disable-next-line no-console
  console.log('Seeded demo org/user/store/subscription')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
