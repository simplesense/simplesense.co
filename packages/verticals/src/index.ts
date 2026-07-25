export type {
  CitedClaim,
  Benchmark,
  ExampleMoveTemplate,
  FaqItem,
  DemoStoreParams,
  SpearheadOffer,
  VerticalConfig,
} from './types'

export { generateStore } from './generator/generate-store'
export { generateReturnsData } from './generator/generate-returns'
export {
  computeSubscriptionChurn,
  type SubscriptionChurnMetrics,
} from './compute/subscription-churn'
export { computeQ4GiftBuyerStats, type Q4GiftBuyerStats } from './compute/q4-gift-buyers'
export {
  renderMoveTemplate,
  renderMoves,
  hasLiteralDollarOrPercent,
  type RenderedMove,
} from './render-moves'
export { findBannedClaims } from './honesty-rails/banned-claims'
export { computeUniquenessShare, collectConfigText } from './honesty-rails/distinctness'

export { petBrandsConfig } from './configs/pet-brands'
export { candleBrandsConfig } from './configs/candle-brands'
export { apparelBrandsConfig } from './configs/apparel-brands'
export { homeDecorBrandsConfig } from './configs/home-decor-brands'

export {
  computePetBrandsDemo,
  type VerticalDemoResult,
  type VerticalDemoStat,
} from './demo/compute-pet-demo'
export { computeCandleBrandsDemo } from './demo/compute-candle-demo'
export { computeApparelBrandsDemo } from './demo/compute-apparel-demo'

import { petBrandsConfig } from './configs/pet-brands'
import { candleBrandsConfig } from './configs/candle-brands'
import { apparelBrandsConfig } from './configs/apparel-brands'
import { homeDecorBrandsConfig } from './configs/home-decor-brands'
import type { VerticalConfig } from './types'

/** Every configured vertical, shipped or not — filter on `.shipped` for anything user-facing. */
export const ALL_VERTICAL_CONFIGS: VerticalConfig[] = [
  petBrandsConfig,
  candleBrandsConfig,
  apparelBrandsConfig,
  homeDecorBrandsConfig,
]

export const SHIPPED_VERTICAL_CONFIGS: VerticalConfig[] = ALL_VERTICAL_CONFIGS.filter(
  (c) => c.shipped,
)
