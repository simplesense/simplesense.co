import type { MetadataRoute } from 'next'
import { SHIPPED_VERTICAL_CONFIGS } from '@ss/verticals'

const BASE_URL = 'https://simplesense.co'

/** Public marketing/audit routes only — no authenticated app routes, no demo-org data. */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    '/',
    '/how-it-works',
    '/pricing',
    '/privacy',
    '/terms',
    '/audits/retention-x-ray',
    '/audits/return-lens',
    '/audits/agent-ready',
    '/audits/answer-shelf',
    '/audits/review-proof',
    '/story',
  ]
  const verticalPaths = SHIPPED_VERTICAL_CONFIGS.map((c) => c.urlPath)

  return [...staticPaths, ...verticalPaths].map((path) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.7,
  }))
}
