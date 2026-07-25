import type { Metadata } from 'next'
import { apparelBrandsConfig, computeApparelBrandsDemo } from '@ss/verticals'
import { VerticalPageTemplate } from '@/components/marketing/VerticalPageTemplate'

const DEMO_NOW = new Date('2026-07-25T00:00:00Z')

export const metadata: Metadata = {
  title: apparelBrandsConfig.seo.title,
  description: apparelBrandsConfig.seo.description,
  openGraph: {
    title: apparelBrandsConfig.seo.title,
    description: apparelBrandsConfig.seo.description,
  },
  twitter: {
    title: apparelBrandsConfig.seo.title,
    description: apparelBrandsConfig.seo.description,
  },
}

export default function ApparelBrandsPage() {
  const demo = computeApparelBrandsDemo(DEMO_NOW)
  return <VerticalPageTemplate config={apparelBrandsConfig} demo={demo} />
}
