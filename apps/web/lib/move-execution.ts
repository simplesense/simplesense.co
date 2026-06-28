import type { Recommendation } from '@ss/core'

type Spec = Record<string, unknown>

/** A channel row for the "How we'd ship it" rail. */
export interface ShipRow {
  icon: string
  channel: string
  detail: string
}

const str = (v: unknown, fallback: string): string =>
  typeof v === 'string' && v.trim() ? v.replace(/_/g, ' ') : fallback
const num = (v: unknown, fallback: number): number => (typeof v === 'number' ? v : fallback)

/** Concrete channels this move ships through, dispatched on the structured execution (§8.3). */
export function shipPlan(ex: Recommendation['suggestedExecution']): ShipRow[] {
  const spec = ex.spec as Spec
  switch (ex.type) {
    case 'klaviyo_segment':
      return [
        {
          icon: 'envelope-paper',
          channel: 'Klaviyo',
          detail: `Build the segment "${str(spec.definition, 'targeted cohort')}" and attach a flow`,
        },
        { icon: 'bag-check', channel: 'Shopify', detail: 'Sync the segment as a customer tag' },
      ]
    case 'meta_geofence':
      return [
        {
          icon: 'bullseye',
          channel: 'Meta & Google',
          detail: `Geo-fence campaigns to a ${num(spec.radius_miles, 5)}-mile radius`,
        },
        ...(spec.enable_bopis
          ? [
              {
                icon: 'shop',
                channel: 'Shopify',
                detail: 'Turn on buy-online / pick-up-in-store at local checkout',
              },
            ]
          : []),
      ]
    case 'shopify_flow':
      return [
        {
          icon: 'diagram-3',
          channel: 'Shopify Flow',
          detail: `Automate "${str(spec.action, 'this change')}" as a no-code workflow`,
        },
      ]
    default:
      return [
        {
          icon: 'clipboard-check',
          channel: 'Operator playbook',
          detail: `Run "${str(spec.action, 'this move')}" manually this week — no integration required`,
        },
      ]
  }
}

/** A togglable, ordered checklist for the "The move" panel. Honest: derived, not invented. */
export function moveChecklist(rec: Recommendation): string[] {
  const ex = rec.suggestedExecution
  const spec = ex.spec as Spec
  const steps: string[] = [rec.title]
  switch (ex.type) {
    case 'klaviyo_segment':
      steps.push(
        `Define the segment: ${str(spec.definition, 'the target cohort')}`,
        'Attach a flow (early access, win-back, or post-purchase) to that segment',
      )
      break
    case 'meta_geofence':
      steps.push(
        `Set ad geo-targeting to a ${num(spec.radius_miles, 5)}-mile radius around demand`,
        'Shift budget toward the high-concentration area; pause the long tail',
      )
      break
    case 'shopify_flow':
      steps.push(
        `Configure the Shopify Flow for "${str(spec.action, 'this change')}"`,
        'Enable it and watch the first week',
      )
      break
    default:
      steps.push(`Execute "${str(spec.action, 'the move')}" as a one-week operator play`)
  }
  steps.push('Apply here so we capture the baseline and measure lift after the window')
  return Array.from(new Set(steps))
}
