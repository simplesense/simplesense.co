import { NextResponse } from 'next/server'
import { prisma, loadNormalizedStore, DEMO } from '@ss/db'
import { buildVipSegment, buildSkuEconomics, toCsv } from '@ss/core'
import { getSession } from '@/lib/auth'
import { resolveActiveStore } from '@/lib/store-resolve'

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
  const { store, isDemo } = await resolveActiveStore(orgId)
  const normalized = await loadNormalizedStore(prisma, store.id)
  if (!normalized) {
    return NextResponse.json({ error: 'no store data' }, { status: 404 })
  }

  const slug = isDemo ? DEMO.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : store.shopDomain
  const stamp = store.id.slice(-6)

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
