import { cache } from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma, DEMO } from '@ss/db'

export interface Session {
  orgId: string
  userId: string
}

// Same signal as the middleware + ClerkProvider (build-inlined publishable key). With a split
// config (publishable present, secret missing) auth() throws loudly rather than this silently
// returning the shared DEMO org for every request — which would collapse tenant isolation.
const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

/**
 * Resolve the current tenant. With Clerk configured, maps the signed-in user (or their
 * active Clerk Organization) to one of our Organizations, creating it on first sight.
 * Without Clerk keys, falls back to the single demo org (dev shim) so local/tests still run.
 * Every query in the app is scoped by the returned orgId.
 */
export const getSession = cache(async (): Promise<Session> => {
  if (!hasClerk) return { orgId: DEMO.orgId, userId: DEMO.userId }

  const { userId, orgId } = await auth()
  if (!userId) return { orgId: DEMO.orgId, userId: DEMO.userId }

  // One tenant per Clerk Organization, or a personal workspace per user.
  const externalOrg = orgId ?? `personal_${userId}`
  await prisma.organization.upsert({
    where: { id: externalOrg },
    update: {},
    create: { id: externalOrg, name: orgId ? 'Workspace' : 'My store' },
  })
  return { orgId: externalOrg, userId }
})
