'use client'
import { useActionState } from 'react'
import { scanUrl, type ScanResult } from './actions'

const initialState: ScanResult = { ok: false }

function scoreBand(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'unknown'
  if (score >= 80) return 'good'
  if (score >= 50) return 'mixed'
  return 'poor'
}

export function ScanForm() {
  const [state, formAction, pending] = useActionState(scanUrl, initialState)

  return (
    <>
      <form action={formAction} className="scan-form">
        <input
          name="url"
          placeholder="yourshop.com/products/example"
          required
          aria-label="Product page URL to scan"
        />
        <button type="submit" className="cta btn-lg" disabled={pending}>
          <span className="glint" />
          {pending ? 'Scanning…' : 'Scan for free'}
        </button>
      </form>
      <p className="intake-note">
        We fetch the page you give us (no login, no JS execution) — nothing is stored unless you
        request a fix sprint below.
      </p>
      {state.error ? <p className="intake-error scan-error">{state.error}</p> : null}
      {state.ok && state.findings ? (
        <div className="scan-results">
          <div className={`scan-score scan-score-${scoreBand(state.score)}`}>
            <div className="scan-score-number">{state.score ?? '—'}</div>
            <div className="scan-score-label">/ 100 agent-ready</div>
          </div>
          <p className="scan-results-url">{state.storeUrl}</p>
          <div className="scan-findings">
            {state.findings.map((f) => (
              <div
                key={f.ruleId}
                className={`scan-finding ${f.status === 'insufficient' ? 'insufficient' : f.passed ? 'passed' : 'failed'}`}
              >
                <i
                  className={`bi ${
                    f.status === 'insufficient'
                      ? 'bi-question-circle'
                      : f.passed
                        ? 'bi-check-circle'
                        : 'bi-x-circle'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <div className="scan-finding-title">{f.title}</div>
                  <div className="scan-finding-summary">
                    {f.status === 'insufficient' ? f.insufficientReason : f.evidence?.summary}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
