import { DEMO } from '@ss/db'

export interface Session {
  orgId: string
  userId: string
}

/**
 * DEV-AUTH SHIM. Resolves a single demo tenant so the app is multi-tenant-correct (all
 * reads are org-scoped) without a login provider. Replace with Clerk's `auth()` when
 * CLERK keys are set — the rest of the app already scopes every query by `orgId`.
 */
export async function getSession(): Promise<Session> {
  return { orgId: DEMO.orgId, userId: DEMO.userId }
}
