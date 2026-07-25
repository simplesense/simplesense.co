import { buildVerticalOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/vertical-og-image'
import { candleBrandsConfig } from '@ss/verticals'

export const alt = candleBrandsConfig.seo.ogHeadline
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpengraphImage() {
  return buildVerticalOgImage('Candle & home-fragrance brands', candleBrandsConfig.seo.ogHeadline)
}
