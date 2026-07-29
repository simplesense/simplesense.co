/**
 * Per-origin politeness delay for the lifetime of one `Crawler` instance. Pure
 * bookkeeping — the actual waiting happens via the caller's injected `sleep`, so tests
 * can assert on delay math without a real clock.
 *
 * Concurrent-safe by construction: each origin gets a promise CHAIN, not just a
 * timestamp. Two overlapping `waitTurn()` calls for the same origin queue onto the
 * same chain and run their read-wait-write critical section one at a time, in call
 * order — a bare read-then-write on `lastHitAt` across an `await` would otherwise let
 * two concurrent calls both read the same stale timestamp and both proceed together,
 * defeating the rate limit entirely (confirmed via adversarial review this session).
 */
export class RateLimiter {
  private readonly lastHitAt = new Map<string, number>()
  private readonly queues = new Map<string, Promise<void>>()

  constructor(
    private readonly minDelayMs: number,
    private readonly now: () => Date,
    private readonly sleep: (ms: number) => Promise<void>,
  ) {}

  /** Waits (if needed) so this call is at least `minDelayMs` after the last hit to `origin`,
   *  then records this call's time as the new last-hit. */
  async waitTurn(origin: string): Promise<void> {
    const previous = this.queues.get(origin) ?? Promise.resolve()
    const turn = previous.then(() => this.takeTurn(origin))
    // A failed turn must not permanently wedge this origin's queue for whoever's next —
    // chain the NEXT call off a version that never rejects, while the caller of THIS
    // call still awaits `turn` directly below and sees any real error normally.
    this.queues.set(
      origin,
      turn.catch(() => {}),
    )
    return turn
  }

  private async takeTurn(origin: string): Promise<void> {
    const last = this.lastHitAt.get(origin)
    const nowMs = this.now().getTime()
    if (last !== undefined) {
      const elapsed = nowMs - last
      const remaining = this.minDelayMs - elapsed
      if (remaining > 0) await this.sleep(remaining)
    }
    this.lastHitAt.set(origin, this.now().getTime())
  }
}
