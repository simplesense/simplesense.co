'use server'
import { prisma, getOrgStore, DEMO, type RecStatus } from '@ss/db'
import { scheduleOutcome } from '@ss/jobs'
import { getSession } from '@/lib/auth'
import { entitlementsForOrg } from '@/lib/billing'
import { FREE_TOP_MOVES } from '@/lib/gating'

/**
 * Persist a move's status (VIEWED/IMPLEMENTED/DISMISSED), tenant-scoped: the action
 * verifies the recommendation belongs to a store the session's org owns before writing,
 * so one org can never mutate another's moves. (IMPLEMENTED will schedule the §8.6
 * outcome job once the flywheel lands in Slice 9.)
 */
export async function setMoveStatus(recId: string, status: RecStatus): Promise<{ ok: boolean }> {
  const { orgId } = await getSession()
  const rec = await prisma.recommendation.findUnique({
    where: { id: recId },
    select: { storeId: true, runId: true },
  })
  if (!rec) return { ok: false }
  // The shared demo store is a read-only showcase: it renders for every prospect and every
  // not-yet-connected org, so nobody — including the demo-org fallback session — may mutate it.
  if (rec.storeId === DEMO.storeId) return { ok: false }
  const store = await getOrgStore(prisma, orgId, rec.storeId)
  if (!store) return { ok: false } // not this org's store — refuse
  // Tier gating on the WRITE path too: the free tier may only act on moves inside its fixed
  // top-N — otherwise status-cycling a guessed id becomes a paywall enumeration primitive.
  const ent = await entitlementsForOrg(orgId)
  if (ent.moves === 'top') {
    const topOfRun = await prisma.recommendation.findMany({
      where: { runId: rec.runId },
      orderBy: [{ rankScore: 'desc' }, { id: 'asc' }],
      take: FREE_TOP_MOVES,
      select: { id: true },
    })
    if (!topOfRun.some((t) => t.id === recId)) return { ok: false }
  }
  await prisma.recommendation.update({ where: { id: recId }, data: { status } })
  // Implementing a move starts the flywheel: capture the baseline + schedule measurement (§8.6).
  if (status === 'IMPLEMENTED') await scheduleOutcome(prisma, recId)
  return { ok: true }
}
