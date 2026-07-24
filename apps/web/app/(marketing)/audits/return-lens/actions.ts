'use server'
import { prisma } from '@ss/db'
import { rateLimit } from '@/lib/security'
import { validateIntake } from '@/lib/audit-intake'

const MODULE = 'return-lens'

export interface IntakeResult {
  ok: boolean
  error?: string
}

/**
 * Founder-fulfilled audit intake (COMPOUND_ENGINEERING_PLAN.md S5, Decision 2 — no
 * entitlement/billing code). Persists a lead; the founder follows up manually (checks
 * /internal/audit-intakes) and delivers the report + collects payment via the Stripe
 * Payment Link on the page. Same shape as the retention-x-ray action — only MODULE
 * differs; not shared, matching this codebase's one-file-per-module convention (see
 * packages/rulebooks' rule-per-file structure).
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
