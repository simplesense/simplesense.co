import { buildVerticalOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/vertical-og-image'
import { apparelBrandsConfig } from '@ss/verticals'

export const alt = apparelBrandsConfig.seo.ogHeadline
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpengraphImage() {
  return buildVerticalOgImage('Apparel & footwear brands', apparelBrandsConfig.seo.ogHeadline)
}
