import { describe, it, expect, vi } from 'vitest'
import { RateLimiter } from '../src/rate-limiter'

describe('RateLimiter', () => {
  it('does not wait on the first hit to an origin', async () => {
    const sleep = vi.fn(async () => {})
    const limiter = new RateLimiter(2000, () => new Date(1_000_000), sleep)
    await limiter.waitTurn('https://example.com')
    expect(sleep).not.toHaveBeenCalled()
  })

  it('waits the remaining delay on a second hit before the window elapses', async () => {
    const sleep = vi.fn(async () => {})
    let clock = 1_000_000
    const limiter = new RateLimiter(2000, () => new Date(clock), sleep)
    await limiter.waitTurn('https://example.com')
    clock += 300
    await limiter.waitTurn('https://example.com')
    expect(sleep).toHaveBeenCalledWith(1700)
  })

  it('does not wait once the window has already elapsed', async () => {
    const sleep = vi.fn(async () => {})
    let clock = 1_000_000
    const limiter = new RateLimiter(2000, () => new Date(clock), sleep)
    await limiter.waitTurn('https://example.com')
    clock += 2500
    await limiter.waitTurn('https://example.com')
    expect(sleep).not.toHaveBeenCalled()
  })

  it('tracks each origin independently', async () => {
    const sleep = vi.fn(async () => {})
    const limiter = new RateLimiter(2000, () => new Date(1_000_000), sleep)
    await limiter.waitTurn('https://a.com')
    await limiter.waitTurn('https://b.com')
    expect(sleep).not.toHaveBeenCalled()
  })

  it('serializes concurrent calls to the same origin instead of letting them both read the same stale timestamp (regression: adversarial review confirmed a bare check-then-act race here)', async () => {
    let clock = 1_000_000
    const sleepCalls: number[] = []
    const sleep = vi.fn(async (ms: number) => {
      sleepCalls.push(ms)
      clock += ms // simulate real time actually passing during the sleep
    })
    const limiter = new RateLimiter(2000, () => new Date(clock), sleep)

    await limiter.waitTurn('https://example.com') // first hit — no wait, lastHitAt = 1_000_000
    clock += 100

    // Two concurrent calls, exactly the shape a caller doing Promise.all over multiple
    // pages on one store would produce. Without serialization both would read the same
    // pre-update lastHitAt and both sleep(1900) — i.e. land back-to-back instead of
    // minDelayMs apart from EACH OTHER, not just from the original hit.
    await Promise.all([
      limiter.waitTurn('https://example.com'),
      limiter.waitTurn('https://example.com'),
    ])

    expect(sleepCalls).toEqual([1900, 2000])
  })

  it('a rejected turn does not permanently wedge the queue for the next call to the same origin', async () => {
    let clock = 1_000_000
    let calls = 0
    const sleep = vi.fn(async (ms: number) => {
      calls++
      if (calls === 1) throw new Error('boom')
      clock += ms
    })
    const limiter = new RateLimiter(2000, () => new Date(clock), sleep)
    await limiter.waitTurn('https://example.com')
    clock += 100

    await expect(limiter.waitTurn('https://example.com')).rejects.toThrow('boom')
    await expect(limiter.waitTurn('https://example.com')).resolves.toBeUndefined()
  })
})
