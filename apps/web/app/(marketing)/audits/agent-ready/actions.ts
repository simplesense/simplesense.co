'use server'
import { headers } from 'next/headers'
import { buildAgentReadySnapshot } from '@ss/integrations'
import { runRulebook, agentReady } from '@ss/rulebooks'
import type { Finding } from '@ss/rulebooks'
import { rateLimit } from '@/lib/security'
import { normalizeScanUrl } from '@/lib/agent-ready-scan'

const { agentReadyRulebook, computeAgentReadyScore } = agentReady

export interface ScanResult {
  ok: boolean
  error?: string
  storeUrl?: string
  score?: number | null
  findings?: Finding[]
}

/**
 * Free public scanner (COMPOUND_ENGINEERING_PLAN.md M2, plan §4: "URL -> score + top 5
 * gaps... as lead magnet"). Unlike the paid-audit intake forms (M8/M5), this doesn't
 * write anything to the DB — it runs the scan live and returns results for the page to
 * render inline. Rate-limited per-IP (stricter than AuditIntake's per-form-instance
 * limit) because every submission triggers real outbound HTTP requests via
 * `@ss/safe-fetch`, not just a DB write.
 */
export async function scanUrl(_prevState: ScanResult, formData: FormData): Promise<ScanResult> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(`agent-ready-scan:${ip}`, 5, 60 * 60_000).allowed) {
    return { ok: false, error: 'Too many scans from this connection — please try again in a bit.' }
  }

  const normalized = normalizeScanUrl(String(formData.get('url') ?? ''))
  if (!normalized.ok) return { ok: false, error: normalized.error }

  const snapshot = await buildAgentReadySnapshot(normalized.url)
  if (!snapshot.productPage.fetchedOk) {
    return {
      ok: false,
      error:
        "Couldn't fetch that page — check the URL is correct and the page is publicly reachable.",
    }
  }

  const findings = runRulebook(agentReadyRulebook, snapshot)
  const { score } = computeAgentReadyScore(findings)
  return { ok: true, storeUrl: normalized.url, score, findings }
}
