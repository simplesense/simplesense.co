import type { Metadata } from 'next'
import { petBrandsConfig, computePetBrandsDemo } from '@ss/verticals'
import { VerticalPageTemplate } from '@/components/marketing/VerticalPageTemplate'

// Fixed reference date for the synthetic demo store — deterministic, hand-verified
// (packages/verticals/test/compute-pet-demo.test.ts), not read live at request time.
const DEMO_NOW = new Date('2026-07-25T00:00:00Z')

export const metadata: Metadata = {
  title: petBrandsConfig.seo.title,
  description: petBrandsConfig.seo.description,
  openGraph: { title: petBrandsConfig.seo.title, description: petBrandsConfig.seo.description },
  twitter: { title: petBrandsConfig.seo.title, description: petBrandsConfig.seo.description },
}

export default function PetBrandsPage() {
  const demo = computePetBrandsDemo(DEMO_NOW)
  return <VerticalPageTemplate config={petBrandsConfig} demo={demo} />
}
