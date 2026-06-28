import type { AnalyzerContext, Order } from './types'

/** Inclusive [start, end] bounds for the trailing analysis window. */
export function windowBounds(ctx: AnalyzerContext): { start: Date; end: Date } {
  const end = ctx.now
  const start = new Date(ctx.now)
  start.setMonth(start.getMonth() - ctx.windowMonths)
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
