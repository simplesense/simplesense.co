import type { Capture } from '@ss/crawler'

export function fakeCapture(overrides: Partial<Capture> = {}): Capture {
  return {
    requestedUrl: 'https://example.com/reviews',
    finalUrl: 'https://example.com/reviews',
    fetchedAt: '2026-07-01T00:00:00.000Z',
    status: 200,
    html: '<html><body>5 reviews</body></html>',
    screenshotBase64: Buffer.from('fake-png-bytes').toString('base64'),
    sha256: 'irrelevant-caller-supplied-hash', // the archive recomputes its own, never trusts this
    ...overrides,
  }
}
