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

# NEXT_PUBLIC_* are inlined at build, so the Clerk publishable key (public, not secret)
# must be present here. Passed via `fly deploy --build-arg`.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# Keep auth on our own on-brand pages (not Clerk's hosted portal).
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Build the Next app (force-dynamic pages → no DB needed at build).
RUN pnpm --filter @ss/web build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["pnpm", "--filter", "@ss/web", "start"]
