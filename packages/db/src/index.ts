/**
 * @ss/db — Prisma client + types. Postgres (Supabase) via DATABASE_URL.
 * Tenant-scoped query helpers live in `tenancy.ts` (every read filters by org).
 */
export { prisma } from './client'
export * from '@prisma/client'
export * from './tenancy'
