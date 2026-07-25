'use client'

import type { AnchorHTMLAttributes } from 'react'
import { trackEvent } from '@/lib/analytics'

/** Anchor that fires a `trackEvent` on click before navigating — see lib/analytics.ts. */
export function TrackedCta({
  eventName,
  vertical,
  onClick,
  ...anchorProps
}: AnchorHTMLAttributes<HTMLAnchorElement> & { eventName: string; vertical: string }) {
  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        trackEvent({ name: eventName, vertical })
        onClick?.(e)
      }}
    />
  )
}
