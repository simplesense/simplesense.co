import type { CSSProperties, ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'clay'
export type BadgeVariant = 'soft' | 'outline'

export interface BadgeProps {
  children?: ReactNode
  tone?: BadgeTone
  variant?: BadgeVariant
  dot?: boolean
  style?: CSSProperties
}

/** Status / category pill. Soft tinted background by default, or `outline`. */
export function Badge({
  children,
  tone = 'neutral',
  variant = 'soft',
  dot = false,
  style,
}: BadgeProps) {
  const tones: Record<BadgeTone, { fg: string; bg: string; bd: string }> = {
    neutral: { fg: 'var(--ss-ink-soft)', bg: 'var(--surface-soft)', bd: 'var(--border-strong)' },
    primary: { fg: 'var(--ss-blue-600)', bg: 'var(--ss-info-bg)', bd: 'var(--ss-blue-300)' },
    success: { fg: 'var(--ss-success)', bg: 'var(--ss-success-bg)', bd: 'var(--ss-success)' },
    warning: { fg: 'var(--ss-warning)', bg: 'var(--ss-warning-bg)', bd: 'var(--ss-warning)' },
    danger: { fg: 'var(--ss-danger)', bg: 'var(--ss-danger-bg)', bd: 'var(--ss-danger)' },
    clay: { fg: 'var(--ss-clay-600)', bg: 'var(--ss-clay-100)', bd: 'var(--ss-clay-300)' },
  }
  const t = tones[tone]
  const outline = variant === 'outline'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.4,
        borderRadius: 'var(--radius-pill)',
        color: t.fg,
        background: outline ? 'transparent' : t.bg,
        border: `1px solid ${outline ? t.bd : 'transparent'}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot ? (
        <span
          style={{ width: 6, height: 6, borderRadius: '50%', background: t.fg }}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  )
}
