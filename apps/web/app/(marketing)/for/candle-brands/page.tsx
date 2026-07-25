import type { Metadata } from 'next'
import { candleBrandsConfig, computeCandleBrandsDemo } from '@ss/verticals'
import { VerticalPageTemplate } from '@/components/marketing/VerticalPageTemplate'

const DEMO_NOW = new Date('2026-07-25T00:00:00Z')

export const metadata: Metadata = {
  title: candleBrandsConfig.seo.title,
  description: candleBrandsConfig.seo.description,
  openGraph: {
    title: candleBrandsConfig.seo.title,
    description: candleBrandsConfig.seo.description,
  },
  twitter: { title: candleBrandsConfig.seo.title, description: candleBrandsConfig.seo.description },
}

export default function CandleBrandsPage() {
  const demo = computeCandleBrandsDemo(DEMO_NOW)
  return <VerticalPageTemplate config={candleBrandsConfig} demo={demo} />
}
