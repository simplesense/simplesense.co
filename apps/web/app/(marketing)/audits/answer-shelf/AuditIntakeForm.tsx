'use client'
import { useActionState } from 'react'
import { submitAuditIntake, type IntakeResult } from './actions'

const initialState: IntakeResult = { ok: false }

export function AuditIntakeForm() {
  const [state, formAction, pending] = useActionState(submitAuditIntake, initialState)

  if (state.ok) {
    return (
      <div className="intake-success">
        <i className="bi bi-check-circle" aria-hidden="true" />
        Thanks — we&rsquo;ll follow up by email within 1 business day to scope your prompt set and
        competitor list.
      </div>
    )
  }

  return (
    <form action={formAction} className="intake-form">
      <div className="intake-row">
        <div className="intake-field">
          <label htmlFor="companyName">Company</label>
          <input id="companyName" name="companyName" required maxLength={200} />
        </div>
        <div className="intake-field">
          <label htmlFor="contactName">Your name</label>
          <input id="contactName" name="contactName" required maxLength={200} />
        </div>
      </div>
      <div className="intake-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required maxLength={320} />
      </div>
      <div className="intake-field">
        <label htmlFor="notes">Anything we should know? (optional)</label>
        <textarea
          id="notes"
          name="notes"
          maxLength={2000}
          rows={3}
          placeholder="Your category, 2-3 competitors to track, specific buying-intent questions you care about…"
        />
      </div>
      {state.error ? <p className="intake-error">{state.error}</p> : null}
      <button
        type="submit"
        className="cta btn-lg"
        disabled={pending}
        style={{ justifyContent: 'center' }}
      >
        <span className="glint" />
        {pending ? 'Sending…' : 'Request your audit'}
      </button>
      <p className="intake-note">
        We&rsquo;ll build your prompt set, run the battery across models, and send a report — no
        account access needed.
      </p>
    </form>
  )
}
