import { describe, it, expect, vi, afterEach } from 'vitest'
import { safeFetch } from '../src/safe-fetch'

afterEach(() => {
  vi.unstubAllGlobals()
})

const PUBLIC_IP = '93.184.216.34'

describe('safeFetch — validation before any request', () => {
  it('rejects a hostname that resolves to a private IP, without ever calling fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const lookup = vi.fn().mockResolvedValue(['127.0.0.1'])
    const result = await safeFetch('http://internal.example.com/', { lookup })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('blocked address')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an IP-literal URL pointed straight at the cloud-metadata address', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const result = await safeFetch('http://169.254.169.254/latest/meta-data/')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('blocked IP literal')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects the cloud-metadata address disguised as an IPv4-mapped IPv6 literal — regression for a confirmed critical bypass (adversarial review, this session)', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    // Bracketed IPv6 literal in the URL; new URL() normalizes the dotted form to hex
    // groups (::ffff:a9fe:a9fe) before .hostname is ever read — the exact path that
    // let this slip past an earlier version of the blocklist.
    const result = await safeFetch('http://[::ffff:169.254.169.254]/latest/meta-data/')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('blocked IP literal')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a non-http(s) scheme', async () => {
    const result = await safeFetch('ftp://example.com/')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('blocked scheme')
  })

  it('rejects a non-standard port', async () => {
    const result = await safeFetch('http://example.com:8080/', {
      lookup: vi.fn().mockResolvedValue([PUBLIC_IP]),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('blocked port')
  })

  it('rejects when DNS resolution throws', async () => {
    const lookup = vi.fn().mockRejectedValue(new Error('ENOTFOUND'))
    const result = await safeFetch('http://nowhere.example.com/', { lookup })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('DNS resolution failed')
  })

  it('rejects when DNS resolution returns no addresses', async () => {
    const lookup = vi.fn().mockResolvedValue([])
    const result = await safeFetch('http://empty.example.com/', { lookup })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('no addresses')
  })

  it('bounds a slow/adversarial DNS lookup to the configured timeout — regression for a confirmed gap (adversarial review, this session)', async () => {
    const slowLookup = () =>
      new Promise<string[]>((resolve) => setTimeout(() => resolve([PUBLIC_IP]), 800))
    const start = Date.now()
    const result = await safeFetch('http://slow-dns.example.com/', {
      lookup: slowLookup,
      timeoutMs: 100,
    })
    const elapsed = Date.now() - start
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('timed out')
    expect(elapsed).toBeLessThan(400) // was previously ~800ms — bounded well under the slow lookup's own delay
  })
})

describe('safeFetch — successful fetch', () => {
  it('returns status/headers/body/finalUrl for a clean 200 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>hi</html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      ),
    )
    const result = await safeFetch('http://example.com/', {
      lookup: vi.fn().mockResolvedValue([PUBLIC_IP]),
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.status).toBe(200)
      expect(result.body).toBe('<html>hi</html>')
      expect(result.headers['content-type']).toBe('text/html')
      expect(result.finalUrl).toBe('http://example.com/')
    }
  })
})

describe('safeFetch — redirects', () => {
  it('follows a redirect to a safe target and re-validates it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'http://example.com/final' } }),
      )
      .mockResolvedValueOnce(new Response('final page', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const lookup = vi.fn().mockResolvedValue([PUBLIC_IP])
    const result = await safeFetch('http://example.com/start', { lookup })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.body).toBe('final page')
      expect(result.finalUrl).toBe('http://example.com/final')
    }
    expect(lookup).toHaveBeenCalledTimes(2) // both hops re-validated
  })

  it('rejects a redirect that points at a private IP — the core SSRF-via-redirect defense', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: 'http://internal.example.com/secrets' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const lookup = vi
      .fn()
      .mockResolvedValueOnce([PUBLIC_IP]) // first hop: safe
      .mockResolvedValueOnce(['10.0.0.5']) // redirect target: private — must be blocked
    const result = await safeFetch('http://example.com/start', { lookup })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('blocked address')
    expect(fetchMock).toHaveBeenCalledTimes(1) // never actually requested the internal target
  })

  it('rejects a redirect with no Location header', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 302 })))
    const result = await safeFetch('http://example.com/', {
      lookup: vi.fn().mockResolvedValue([PUBLIC_IP]),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('Location')
  })

  it('gives up after exceeding the redirect limit', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 302, headers: { location: 'http://example.com/next' } }),
      )
    vi.stubGlobal('fetch', fetchMock)
    const result = await safeFetch('http://example.com/', {
      lookup: vi.fn().mockResolvedValue([PUBLIC_IP]),
      maxRedirects: 2,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('too many redirects')
    expect(fetchMock).toHaveBeenCalledTimes(3) // initial + 2 redirects, then give up
  })
})

describe('safeFetch — response size cap', () => {
  it('aborts and rejects a response over the byte cap', async () => {
    const bigChunk = new Uint8Array(1000).fill(65)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(bigChunk, { status: 200 })))
    const result = await safeFetch('http://example.com/', {
      lookup: vi.fn().mockResolvedValue([PUBLIC_IP]),
      maxBytes: 500,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('exceeded')
  })

  it('returns {ok:false} instead of throwing when the body stream errors mid-read — regression for a confirmed gap (adversarial review, this session)', async () => {
    const erroringStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('partial'))
      },
      pull(controller) {
        controller.error(new Error('connection reset by peer'))
      },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(erroringStream, { status: 200 })))
    // Assert it resolves (doesn't throw/reject) with a failure result — not a try/catch
    // around the call, since the whole point is this used to be an unhandled rejection.
    await expect(
      safeFetch('http://example.com/', { lookup: vi.fn().mockResolvedValue([PUBLIC_IP]) }),
    ).resolves.toEqual({ ok: false, reason: expect.stringContaining('connection reset') })
  })
})
