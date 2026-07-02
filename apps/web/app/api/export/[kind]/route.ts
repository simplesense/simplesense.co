import { NextResponse } from 'next/server'
import { prisma, loadNormalizedStore, DEMO } from '@ss/db'
import { buildVipSegment, buildSkuEconomics, toCsv } from '@ss/core'
import { getSession } from '@/lib/auth'
import { resolveActiveStore } from '@/lib/store-resolve'
import { entitlementsForOrg } from '@/lib/billing'
import { canExport } from '@/lib/gating'

export const dynamic = 'force-dynamic'

const VIP_HEADERS = [
  'email',
  'city',
  'region',
  'country',
  'orders',
  'totalSpent',
  'firstOrderAt',
  'customerId',
]
const SKU_HEADERS = [
  'title',
  'type',
  'unitsSold',
  'grossRevenue',
  'unitCost',
  'estimatedCost',
  'grossProfit',
  'marginRate',
  'productId',
]

/**
 * Grounded CSV exports (§ "Export to Klaviyo" / "Export segments" / "Export CSV").
 * Tenant-scoped: serves the session org's active store (or the shared demo). The rows are
 * built from the same NormalizedStore the analyzers use, so the file matches what the app
 * recommends — no estimates. kind ∈ { vip, sku }.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string }> },
): Promise<NextResponse> {
  const { kind } = await params
  if (kind !== 'vip' && kind !== 'sku') {
    return NextResponse.json({ error: 'unknown export kind' }, { status: 404 })
  }

  const { orgId } = await getSession()
  // Exports are a deliverable: tier-gated server-side (even on the demo store), so the file
  // can't be fetched by URL regardless of what the UI shows.
  if (!canExport(await entitlementsForOrg(orgId))) {
    return NextResponse.json(
      { error: 'Segment exports are a Basic feature. Upgrade at /plans to download.' },
      { status: 403 },
    )
  }
  const { store, isDemo } = await resolveActiveStore(orgId)
  const normalized = await loadNormalizedStore(prisma, store.id)
  if (!normalized) {
    return NextResponse.json({ error: 'no store data' }, { status: 404 })
  }

  // Sanitize anything that flows into the Content-Disposition header: collapse to a safe
  // [a-z0-9.-] slug so a crafted shopDomain can't inject CRLF/quotes into the response header.
  const safeSlug = (s: string): string =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'store'
  const slug = safeSlug(isDemo ? DEMO.storeName : store.shopDomain)
  const stamp = safeSlug(store.id.slice(-6))

  let csv: string
  let filename: string
  if (kind === 'vip') {
    csv = toCsv(VIP_HEADERS, buildVipSegment(normalized))
    filename = `simplesense-vip-segment-${slug}-${stamp}.csv`
  } else {
    csv = toCsv(SKU_HEADERS, buildSkuEconomics(normalized))
    filename = `simplesense-sku-economics-${slug}-${stamp}.csv`
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  })
}
