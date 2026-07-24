const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface AuditIntakeFields {
  companyName: string
  contactName: string
  email: string
  notes: string | null
}

export type ValidateIntakeResult =
  { ok: true; data: AuditIntakeFields } | { ok: false; error: string }

/** Pure validation for the audit-intake form — no I/O, fully unit-testable. */
export function validateIntake(raw: {
  companyName: FormDataEntryValue | null
  contactName: FormDataEntryValue | null
  email: FormDataEntryValue | null
  notes: FormDataEntryValue | null
}): ValidateIntakeResult {
  const companyName = String(raw.companyName ?? '').trim()
  const contactName = String(raw.contactName ?? '').trim()
  const email = String(raw.email ?? '').trim()
  const notes = String(raw.notes ?? '').trim()

  if (!companyName || !contactName || !email) {
    return { ok: false, error: 'Company, name, and email are required.' }
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "That email address doesn't look right." }
  }
  return {
    ok: true,
    data: {
      companyName: companyName.slice(0, 200),
      contactName: contactName.slice(0, 200),
      email: email.slice(0, 320),
      notes: notes ? notes.slice(0, 2000) : null,
    },
  }
}
