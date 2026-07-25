export interface AnalyticsEvent {
  name: string
  vertical?: string
  [key: string]: unknown
}

/**
 * Placeholder event logger — no analytics vendor (PostHog/Segment/etc.) is wired into
 * this repo yet, and no canonical event-tracking system exists to extend. This exists
 * so call sites and the `vertical` property are already in place once one is chosen;
 * swap the body for a real provider then. Logs to console in development only.
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[analytics:stub]', event)
  }
}
