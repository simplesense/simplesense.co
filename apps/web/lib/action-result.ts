/** Discriminated result for server actions, so clients can explain a refused write, not just snap back. */
export type ActionReason = 'not_found' | 'demo_readonly' | 'forbidden' | 'tier_locked'

export type ActionResult = { ok: true } | { ok: false; reason: ActionReason }

/** Short, user-facing copy for a refusal reason. */
export const REASON_COPY: Record<ActionReason, string> = {
  demo_readonly: 'This is demo data — connect your store to apply moves.',
  tier_locked: 'This move is on the Basic plan. Upgrade to apply it.',
  forbidden: "You don't have access to change this.",
  not_found: 'That move no longer exists.',
}
