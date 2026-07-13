import { NextResponse } from 'next/server'
import { prisma } from '@ss/db'
import { runTick } from '@ss/jobs'
import { createLlmClient } from '@ss/engine'
import { RealShopifyReader, decryptSecret } from '@ss/integrations'
import { isAuthorizedCron } from '@/lib/cron-auth'
import { rateLimit } from '@/lib/security'

/**
 * Scheduler tick (GitHub Actions cron): measure due outcomes + weekly re-analysis.
 * Guarded by CRON_SECRET — an OPTIONAL env (assertServerEnv intentionally does not
 * require it); unset → 503, same as the unconfigured Shopify webhook route. Rate-limited
 * to 1 per 5 minutes so a slow tick's client-side retry (.github/workflows/cron.yml) or a
 * leaked secret can't stack multiple concurrent MAX_STORES_PER_TICK batches.
 */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET ?? null
  if (!secret) return new NextResponse('not configured', { status: 503 })
  if (!isAuthorizedCron(req.headers.get('authorization'), secret)) {
    return new NextResponse('unauthorized', { status: 401 })
  }
  if (!rateLimit('cron-tick', 1, 5 * 60_000).allowed) {
    return new NextResponse('rate limited', { status: 429 })
  }
  const result = await runTick(prisma, {
    llm: createLlmClient(),
    reader: new RealShopifyReader(),
    decryptToken: decryptSecret,
  })
  console.log(
    '[cron] tick refreshed=%d errors=%d skipped=%d measured=%d inconclusive=%d deferred=%d',
    result.refreshed,
    result.refreshErrors,
    result.skippedSyncing,
    result.measured,
    result.inconclusive,
    result.deferred,
  ) // counts only — PII-free
  return NextResponse.json({ ok: true, ...result })
}
