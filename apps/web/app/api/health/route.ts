/**
 * Liveness probe. Intentionally unauthenticated and PII-free.
 * Returns a static shape so the smoke test and uptime checks stay deterministic.
 */
export function GET(): Response {
  return Response.json({ status: 'ok', service: 'simple-sense' })
}
