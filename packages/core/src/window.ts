import type { AnalyzerContext, Order } from './types'

/**
 * Inclusive [start, end] bounds for the trailing analysis window.
 * Uses UTC and is month-length safe: subtracting months from a month-end date
 * (e.g. Jul 31 − 1mo) clamps to the target month's last valid day instead of
 * overflowing into the next month and silently dropping days from the window.
 */
export function windowBounds(ctx: AnalyzerContext): { start: Date; end: Date } {
  const end = ctx.now
  const start = new Date(end.getTime())
  const day = start.getUTCDate()
  start.setUTCDate(1) // avoid month-length overflow while shifting months
  start.setUTCMonth(start.getUTCMonth() - ctx.windowMonths)
  const daysInStartMonth = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
  ).getUTCDate()
  start.setUTCDate(Math.min(day, daysInStartMonth))
  return { start, end }
}

/** Stable window label recorded on metrics, e.g. "trailing_24m". */
export function windowLabel(ctx: AnalyzerContext): string {
  return `trailing_${ctx.windowMonths}m`
}

/** Orders whose createdAt falls within the trailing window. */
export function ordersInWindow(ctx: AnalyzerContext): Order[] {
  const { start, end } = windowBounds(ctx)
  return ctx.store.orders.filter((o) => o.createdAt >= start && o.createdAt <= end)
}

/** Net revenue of an order = gross total minus refunds. */
export function netRevenue(o: Order): number {
  return o.totalPrice - (o.refundedAmount ?? 0)
}
