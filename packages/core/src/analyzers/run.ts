import type { Analyzer, AnalyzerContext, Metric } from '../types'
import { paretoAnalyzer } from './pareto'
import { geographyAnalyzer } from './geography'
import { rfmAnalyzer, cohortAnalyzer, replenishmentAnalyzer } from './customers'
import { affinityAnalyzer, skuMarginAnalyzer } from './products'
import { discountAnalyzer, returnsAnalyzer, aovFreeshipAnalyzer } from './economics'
import { newVsReturningAnalyzer, acquisitionAnalyzer } from './mix'
import { channelProfitabilityAnalyzer, ownedChannelAnalyzer } from './gated'

/** MVP analyzers — computable from Shopify order/customer/product data alone. */
export const MVP_ANALYZERS: readonly Analyzer[] = [
  paretoAnalyzer,
  geographyAnalyzer,
  rfmAnalyzer,
  cohortAnalyzer,
  replenishmentAnalyzer,
  affinityAnalyzer,
  skuMarginAnalyzer,
  discountAnalyzer,
  returnsAnalyzer,
  aovFreeshipAnalyzer,
  newVsReturningAnalyzer,
  acquisitionAnalyzer,
]

/** Fast-follow analyzers gated on external data (emit flagged "insufficient"). */
export const GATED_ANALYZERS: readonly Analyzer[] = [
  channelProfitabilityAnalyzer,
  ownedChannelAnalyzer,
]

/**
 * Run all analyzers over a store and return the flat list of computed Metrics.
 * Metric keys are unique per analyzer; a later guard asserts no key collisions.
 */
export function runAnalyzers(
  ctx: AnalyzerContext,
  opts: { includeGated?: boolean } = {},
): Metric[] {
  const analyzers = opts.includeGated ? [...MVP_ANALYZERS, ...GATED_ANALYZERS] : [...MVP_ANALYZERS]
  const out: Metric[] = []
  for (const a of analyzers) out.push(...a(ctx))
  return out
}
