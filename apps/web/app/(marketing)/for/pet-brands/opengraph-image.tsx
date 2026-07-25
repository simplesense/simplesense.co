import { buildVerticalOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/vertical-og-image'
import { petBrandsConfig } from '@ss/verticals'

export const alt = petBrandsConfig.seo.ogHeadline
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpengraphImage() {
  return buildVerticalOgImage('Pet brands & boutiques', petBrandsConfig.seo.ogHeadline)
}
