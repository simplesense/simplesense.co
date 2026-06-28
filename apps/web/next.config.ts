import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  // Internal packages ship TypeScript source; let Next transpile them.
  transpilePackages: ['@ss/core', '@ss/config', '@ss/engine', '@ss/ui', '@ss/db', '@ss/jobs'],
}

export default config
