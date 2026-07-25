import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildAgentReadySnapshot } from '../../src/agent-ready/build-snapshot'

afterEach(() => {
  vi.unstubAllGlobals()
})

const PUBLIC_IP = '93.184.216.34'
const lookup = () => Promise.resolve([PUBLIC_IP])

const PRODUCT_HTML = `<!doctype html>
<html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"Trail Hoodie",
 "offers":{"@type":"Offer","price":"60.00","priceCurrency":"USD","availability":"https://schema.org/InStock"},
 "aggregateRating":{"@type":"AggregateRating","ratingValue":"4.5","reviewCount":"12"}}
</script>
</head><body>
<p>A great hoodie for the trail. Lots of descriptive text goes here to pass the visible-text floor for this test case, repeated so it is long enough. Lots of descriptive text goes here to pass the visible-text floor.</p>
<a href="/pages/shipping-policy">Shipping &amp; Returns</a>
</body></html>`

const POLICY_HTML = `<html><body><p>${'We accept returns within 30 days of delivery. '.repeat(10)}</p></body></html>`

const ROBOTS_TXT = 'User-agent: *\nDisallow: /admin\n'

describe('buildAgentReadySnapshot', () => {
  it('assembles a full snapshot from the product page, its policy link, and robots.txt', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(PRODUCT_HTML, { status: 200 }))
      .mockResolvedValueOnce(new Response(POLICY_HTML, { status: 200 }))
      .mockResolvedValueOnce(new Response(ROBOTS_TXT, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const snapshot = await buildAgentReadySnapshot('https://shop.example.com/products/hoodie', {
      lookup,
    })

    expect(snapshot.productPage.fetchedOk).toBe(true)
    expect(snapshot.productPage.productSchema.found).toBe(true)
    expect(snapshot.productPage.productSchema.hasAggregateRating).toBe(true)
    expect(snapshot.productPage.productSchema.offer).toEqual({
      hasPrice: true,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validAvailability: true,
    })
    expect(snapshot.policyPage).toEqual({
      found: true,
      fetchedOk: true,
      visibleTextLength: expect.any(Number),
    })
    expect(snapshot.policyPage.visibleTextLength).toBeGreaterThan(200)
    expect(snapshot.robotsTxt).toEqual({
      fetchedOk: true,
      disallowsAll: false,
      blockedAgentBots: [],
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('returns an all-insufficient-friendly snapshot when the product page fetch itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')))
    const snapshot = await buildAgentReadySnapshot('https://shop.example.com/products/hoodie', {
      lookup,
    })
    expect(snapshot.productPage.fetchedOk).toBe(false)
    expect(snapshot.policyPage).toEqual({ found: false, fetchedOk: null, visibleTextLength: null })
    expect(snapshot.robotsTxt.fetchedOk).toBe(false)
  })

  it('leaves policyPage.found false when no policy link is on the page', async () => {
    const noLinkHtml = '<html><body><p>Just a product, no links.</p></body></html>'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(noLinkHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(ROBOTS_TXT, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const snapshot = await buildAgentReadySnapshot('https://shop.example.com/products/hoodie', {
      lookup,
    })
    expect(snapshot.policyPage).toEqual({ found: false, fetchedOk: null, visibleTextLength: null })
    expect(fetchMock).toHaveBeenCalledTimes(2) // product page + robots.txt only, no policy fetch attempted
  })

  it('detects a login-walled product page via a 401 status', async () => {
    // A fresh Response per call — a real Response's body stream can only be read once,
    // and buildAgentReadySnapshot makes multiple fetch calls (product page, robots.txt).
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation(() => Promise.resolve(new Response('Please sign in', { status: 401 }))),
    )
    const snapshot = await buildAgentReadySnapshot('https://shop.example.com/products/hoodie', {
      lookup,
    })
    expect(snapshot.productPage.looksLoginWalled).toBe(true)
  })
})
