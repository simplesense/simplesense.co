import type { Rule } from '../../types'
import type { AgentReadySnapshot } from '../types'

/** Founding rule #1: does the product page carry valid, machine-readable schema.org Product data? */
export const productSchemaRule: Rule<AgentReadySnapshot> = {
  id: 'agent_ready.product_schema',
  title: 'schema.org Product/Offer validity',
  severity: 'critical',
  citation: { label: 'Google Search Central — Product structured data requirements' },
  remediationTemplate:
    'Add (or fix) JSON-LD Product markup with name, offers.price, offers.priceCurrency, and a valid offers.availability value from the schema.org ItemAvailability enum.',
  version: '0.1.0',
  addedBecause:
    'Founding rule — an agent (or a rich-results-eligible search result) cannot recommend a product it cannot parse a price and availability for.',
  detect(snapshot) {
    if (!snapshot.productPage.fetchedOk) {
      return {
        status: 'insufficient',
        insufficientReason: 'The product page could not be fetched.',
      }
    }
    const schema = snapshot.productPage.productSchema
    if (!schema.found) {
      return {
        status: 'triggered',
        passed: false,
        evidence: {
          summary: 'No schema.org Product structured data (JSON-LD) found on this page.',
          metrics: { found: false },
        },
        action: 'Add JSON-LD Product markup with name, offers, and (ideally) aggregateRating.',
      }
    }
    const gaps: string[] = []
    if (!schema.hasName) gaps.push('missing name')
    if (!schema.hasOffers) gaps.push('missing offers')
    if (schema.offer && !schema.offer.hasPrice) gaps.push('offer missing price')
    if (schema.offer && schema.offer.availability === null) gaps.push('offer missing availability')
    if (schema.offer && schema.offer.availability !== null && !schema.offer.validAvailability) {
      gaps.push(`invalid availability value: "${schema.offer.availability}"`)
    }
    if (gaps.length === 0) {
      return {
        status: 'triggered',
        passed: true,
        evidence: {
          summary: 'Product schema found with a valid name, offer price, and availability value.',
          metrics: {
            found: true,
            hasAggregateRating: schema.hasAggregateRating,
            hasReview: schema.hasReview,
          },
        },
        action:
          schema.hasAggregateRating || schema.hasReview
            ? 'No gap here — Product schema is valid and complete.'
            : 'No gap in required fields — consider adding aggregateRating or review markup, which unlocks rich-result eligibility.',
      }
    }
    return {
      status: 'triggered',
      passed: false,
      evidence: {
        summary: `Product schema found but incomplete: ${gaps.join(', ')}.`,
        metrics: { found: true, gapCount: gaps.length, gaps: gaps.join(', ') },
      },
      action: `Fix the Product JSON-LD: ${gaps.join(', ')}.`,
    }
  },
}
