# Deploying Simple Sense

Repo: **https://github.com/simplesense/simplesense.co** (private)

The app is a pnpm-workspace monorepo; the deployable is `apps/web` (Next.js App Router).

> **Production runs on Fly.io** (app `simplesense-co`, region `sjc`), NOT Vercel. Deploy with:
> ```
> fly deploy --app simplesense-co --ha=false \
>   --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<pk_...>
> ```
> `NEXT_PUBLIC_*` are inlined at build → passed as `--build-arg`; runtime secrets
> (`DATABASE_URL`, `CLERK_SECRET_KEY`, `SHOPIFY_*`, `STRIPE_*`, `APP_ENCRYPTION_KEY`,
> `ANTHROPIC_API_KEY`) are set via `fly secrets set`. `assertServerEnv` (wired in
> `apps/web/instrumentation.ts`) fails the boot + health check on a missing/half-configured env,
> so a bad release is gated by `[[http_service.checks]]` in `fly.toml`. The Vercel notes below are
> retained only as an alternative host and are not the live path.

## Vercel import (≈3 minutes, dashboard)

1. vercel.com → **Add New → Project** → import `simplesense/simplesense.co`.
2. **Root Directory: `apps/web`** (Vercel still installs at the workspace root and runs the
   `@ss/db` `postinstall` → `prisma generate`).
3. Framework preset: **Next.js** (auto-detected). Build & install commands: leave default
   (pnpm is auto-detected from `packageManager`).
4. Add **Environment Variables** (Production + Preview), then **Deploy**.

## Environment variables

| Key | Value |
|---|---|
| `DATABASE_URL` | Supabase **Transaction pooler** URL (see caveat) |
| `DIRECT_URL` | Supabase **Session pooler** URL |
| `ANTHROPIC_API_KEY` | your Anthropic key |
| `LLM_MODEL` | `claude-sonnet-4-6` |
| `LLM_MAX_TOKENS` | `4096` |
| `APP_ENCRYPTION_KEY` | the base64 32-byte key from your local `.env` |
| `APP_URL` | `https://<your-vercel-domain>` |
| `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` | from a Shopify Partner app (when ready) |
| `SHOPIFY_SCOPES` | `read_orders,read_customers,read_products,read_locations` |
| `SHOPIFY_APP_URL` | `https://<your-vercel-domain>` |

## ⚠️ Critical caveat: use the Supabase POOLER on Vercel (IPv4)

Vercel's build/runtime is **IPv4-only**. The direct Supabase host `db.<ref>.supabase.co`
is **IPv6-only** — it works locally but **will fail on Vercel**. Use the pooler URLs from
**Supabase → Connect**:

- `DATABASE_URL` = **Transaction pooler** (port `6543`). Append `?pgbouncer=true&connection_limit=1`
  for Prisma (serverless-safe).
  `postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
- `DIRECT_URL` = **Session pooler** (port `5432`).
  `postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres`

URL-encode the password (`&` → `%26`, `!` → `%21`).

## Notes

- `prisma generate` runs on install (postinstall) with the `rhel-openssl-3.0.x` engine for Lambda.
- `outputFileTracingRoot` is set so Next bundles the `@ss/*` workspace packages + Prisma engine.
- The dashboard makes one live Claude call per analysis run (then reads the persisted run from
  the DB), so cost is bounded. Consider enabling Vercel **Deployment Protection** (password) to
  keep the preview private.
- The schema is already applied to Supabase (`db push` + baseline migration). New schema
  changes: `pnpm --filter @ss/db exec prisma migrate deploy` against the pooler.
