'use server'
import { prisma, getOrgStore, type RecStatus } from '@ss/db'
import { getSession } from '@/lib/auth'

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
    select: { storeId: true },
  })
  if (!rec) return { ok: false }
  const store = await getOrgStore(prisma, orgId, rec.storeId)
  if (!store) return { ok: false } // not this org's store — refuse
  await prisma.recommendation.update({ where: { id: recId }, data: { status } })
  return { ok: true }
}
