# Simple Sense — Next.js (pnpm monorepo + Prisma) for Fly.io.
FROM node:22-bookworm-slim

# openssl + ca-certs for the Prisma query engine and TLS to Supabase.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app

# Copy the whole workspace (respecting .dockerignore) and install. The @ss/db
# postinstall runs `prisma generate` (native engine for this Debian image).
COPY . .
RUN pnpm install --frozen-lockfile

# Build the Next app (force-dynamic pages → no DB needed at build).
RUN pnpm --filter @ss/web build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["pnpm", "--filter", "@ss/web", "start"]
