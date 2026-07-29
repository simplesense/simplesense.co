import { safeFetch, looksLikeLoginPath, type SafeFetchOptions } from '@ss/safe-fetch'
import type { AgentReadySnapshot, ProductOfferSummary, ProductSchemaSummary } from '@ss/rulebooks'
import {
  extractJsonLd,
  flattenJsonLdTypes,
  hasType,
  visibleTextLength,
  extractLinks,
  detectsCaptcha,
} from './html-utils'
import { parseRobotsDisallows, disallowsEverything, KNOWN_AI_AGENT_BOTS } from './robots-txt'

// schema.org/ItemAvailability enumeration — verified via schema.org this session. Store
// value in either short ("InStock") or full-URL ("https://schema.org/InStock") form.
const VALID_AVAILABILITY = new Set(
  [
    'BackOrder',
    'Discontinued',
    'InStock',
    'InStoreOnly',
    'LimitedAvailability',
    'MadeToOrder',
    'OnlineOnly',
    'OutOfStock',
    'PreOrder',
    'PreSale',
    'Reserved',
    'SoldOut',
  ].flatMap((name) => [name, `https://schema.org/${name}`, `http://schema.org/${name}`]),
)

const POLICY_PATH_PATTERN = /\/(policies|pages)\/(shipping|returns?|refund)[-_]?(policy)?/i
const POLICY_TEXT_PATTERN = /shipping|returns?|refund policy/i

function buildProductSchema(html: string): ProductSchemaSummary {
  const nodes = flattenJsonLdTypes(extractJsonLd(html))
  const product = nodes.find((n) => hasType(n, 'Product'))
  if (!product) {
    return {
      found: false,
      hasName: false,
      hasOffers: false,
      hasAggregateRating: false,
      hasReview: false,
      offer: null,
    }
  }
  const offerNode = nodes.find((n) => hasType(n, 'Offer') || hasType(n, 'AggregateOffer'))
  let offer: ProductOfferSummary | null = null
  if (offerNode) {
    const priceRaw = offerNode.price ?? offerNode.lowPrice
    const availabilityRaw = offerNode.availability
    const availability = typeof availabilityRaw === 'string' ? availabilityRaw : null
    offer = {
      hasPrice: priceRaw !== undefined && priceRaw !== null && priceRaw !== '',
      priceCurrency: typeof offerNode.priceCurrency === 'string' ? offerNode.priceCurrency : null,
      availability,
      validAvailability: availability === null ? null : VALID_AVAILABILITY.has(availability),
    }
  }
  return {
    found: true,
    hasName: typeof product.name === 'string' && product.name.trim() !== '',
    hasOffers: offerNode !== undefined,
    hasAggregateRating: nodes.some((n) => hasType(n, 'AggregateRating')),
    hasReview: nodes.some((n) => hasType(n, 'Review')),
    offer,
  }
}

/**
 * Builds an `AgentReadySnapshot` for one product-page URL via `@ss/safe-fetch` (up to
 * 3 requests: the page itself, its policy page if a link is found, and robots.txt).
 * Static-fetch only — no JS execution, so anything that needs client-side rendering
 * (the "JS-only price rendering" signal in the plan) shows up only as a low visible-
 * text-length/no-structured-data result, not a definitive verdict.
 */
export async function buildAgentReadySnapshot(
  productUrl: string,
  fetchOptions: SafeFetchOptions = {},
): Promise<AgentReadySnapshot> {
  const productResult = await safeFetch(productUrl, fetchOptions)

  if (!productResult.ok) {
    return {
      storeUrl: productUrl,
      productPage: {
        url: productUrl,
        fetchedOk: false,
        status: null,
        looksLoginWalled: false,
        hasCaptcha: false,
        visibleTextLength: null,
        productSchema: {
          found: false,
          hasName: false,
          hasOffers: false,
          hasAggregateRating: false,
          hasReview: false,
          offer: null,
        },
      },
      policyPage: { found: false, fetchedOk: null, visibleTextLength: null },
      robotsTxt: { fetchedOk: false, disallowsAll: false, blockedAgentBots: [] },
    }
  }

  const html = productResult.body
  const looksLoginWalled =
    productResult.status === 401 ||
    productResult.status === 403 ||
    looksLikeLoginPath(new URL(productResult.finalUrl).pathname)

  const links = extractLinks(html)
  const policyLink = links.find(
    (l) => POLICY_PATH_PATTERN.test(l.href) || POLICY_TEXT_PATTERN.test(l.text),
  )
  let policyPage: AgentReadySnapshot['policyPage'] = {
    found: false,
    fetchedOk: null,
    visibleTextLength: null,
  }
  if (policyLink) {
    const policyUrl = new URL(policyLink.href, productResult.finalUrl).toString()
    const policyResult = await safeFetch(policyUrl, fetchOptions)
    policyPage = policyResult.ok
      ? { found: true, fetchedOk: true, visibleTextLength: visibleTextLength(policyResult.body) }
      : { found: true, fetchedOk: false, visibleTextLength: null }
  }

  const origin = new URL(productResult.finalUrl).origin
  const robotsResult = await safeFetch(`${origin}/robots.txt`, fetchOptions)
  let robotsTxt: AgentReadySnapshot['robotsTxt'] = {
    fetchedOk: false,
    disallowsAll: false,
    blockedAgentBots: [],
  }
  if (robotsResult.ok) {
    const disallows = parseRobotsDisallows(robotsResult.body)
    robotsTxt = {
      fetchedOk: true,
      disallowsAll: disallowsEverything(disallows['*'] ?? []),
      blockedAgentBots: KNOWN_AI_AGENT_BOTS.filter((bot) =>
        disallowsEverything(disallows[bot.toLowerCase()] ?? []),
      ),
    }
  }

  return {
    storeUrl: productUrl,
    productPage: {
      url: productUrl,
      fetchedOk: true,
      status: productResult.status,
      looksLoginWalled,
      hasCaptcha: detectsCaptcha(html),
      visibleTextLength: visibleTextLength(html),
      productSchema: buildProductSchema(html),
    },
    policyPage,
    robotsTxt,
  }
}
