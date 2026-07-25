'use server'
import { prisma } from '@ss/db'
import { rateLimit } from '@/lib/security'
import { validateIntake } from '@/lib/audit-intake'

const MODULE = 'agent-ready'

export interface IntakeResult {
  ok: boolean
  error?: string
}

/**
 * Paid fix-sprint intake for AgentReady, separate from the free scan (`actions.ts`'s
 * `scanUrl`). Same shape as the retention-x-ray/return-lens intake actions — only
 * MODULE differs; not shared, matching this codebase's one-file-per-module convention.
 */
export async function submitAuditIntake(
  _prevState: IntakeResult,
  formData: FormData,
): Promise<IntakeResult> {
  if (!rateLimit('audit-intake', 10, 60 * 60_000).allowed) {
    return { ok: false, error: 'Too many submissions — please try again in a bit.' }
  }

  const validated = validateIntake({
    companyName: formData.get('companyName'),
    contactName: formData.get('contactName'),
    email: formData.get('email'),
    notes: formData.get('notes'),
  })
  if (!validated.ok) return validated

  await prisma.auditIntake.create({ data: { module: MODULE, ...validated.data } })
  return { ok: true }
}
