/**
 * @ss/ui — the SimpleSense design-system port (§19). Token CSS lives at
 * `@ss/ui/styles.css`; components are token-driven (no hardcoded hex/px).
 */
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './components/Button'
export { Badge, type BadgeProps, type BadgeTone, type BadgeVariant } from './components/Badge'
export { Card, type CardProps } from './components/Card'
export { MetricCard, type MetricCardProps } from './components/MetricCard'
export { MoveCard, type MoveCardProps } from './components/MoveCard'
export { recommendationToMove, formatImpact } from './recommendation-to-move'
