import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Monorepo root — so Next file-tracing includes the workspace packages (@ss/*) and the
// Prisma engine when bundling serverless functions on Vercel.
const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  // Internal packages ship TypeScript source; let Next transpile them.
  transpilePackages: [
    '@ss/core',
    '@ss/config',
    '@ss/engine',
    '@ss/ui',
    '@ss/db',
    '@ss/jobs',
    '@ss/integrations',
  ],
}

export default config
