# PLAN: First-run funnel — auto-sync on connect, onboarding completion, connect-form polish

**Rank rationale:** The Shopify redirect-URL allowlist unblock is imminent, which means the FIRST real merchant will run this funnel end-to-end within days. Today that funnel has three honest-to-goodness holes: after OAuth the merchant lands on /connections and must *notice and click* "Sync now" (the callback deliberately leaves syncStatus PENDING — apps/web/app/api/stores/connect/callback/route.ts:84-86), onboarding step 3 can literally never complete (`done: false` hardcoded at apps/web/app/onboarding/page.tsx:45), and the connect form is a bare unlabeled input whose only validation is a server-side JSON-400 dead-end. Every one of these is a drop-off point at the exact moment a merchant decides whether SimpleSense is real. The fix is small, self-contained, requires no new schema and none of the human-blocked items (Stripe/Clerk/Shopify approvals), and directly increases the odds the first merchant converts.

## Goal

A merchant who completes Shopify OAuth lands on /connections with the sync **already running** (banner: "connected — pulling your history now"), the onboarding checklist can reach 3/3 done once they act on a move, the connect form is labeled + client-validated + normalizes bare store names, and the post-sync success message is a real link into /app. All existing guards (demo, tenant, atomic SYNCING claim, stale-claim recovery, syncError writes) are preserved byte-for-byte in semantics.

## Files to touch

- `apps/web/lib/sync-runner.ts` — **NEW**: shared `startStoreSync(storeId, shop, token)` extracted from `syncStoreAction` (atomic updateMany claim + `after()` backfill→analyze pipeline + status writes). Plain server module, NOT `'use server'`.
- `apps/web/app/connections/actions.ts` — `syncStoreAction` keeps its session/demo/tenant guards but delegates the claim + pipeline to the runner; remove now-dead imports; reword the doc comment that mentions `after()`.
- `apps/web/app/api/stores/connect/callback/route.ts` — capture the upsert result, auto-start the sync after cookie cleanup, redirect with `&syncing=1`.
- `apps/web/components/ConnectNotice.tsx` — new `syncing?: boolean` prop; success copy switches from "Click Sync now" to "pulling your history now" when syncing.
- `apps/web/app/connections/page.tsx` — read `syncing` searchParam, pass to ConnectNotice; replace the inline `<form>` with the new `<ConnectForm />`; update the stale footer copy about clicking Sync now.
- `apps/web/components/ConnectForm.tsx` — **NEW** small `'use client'` component: labeled input, `required`, `pattern`, submit-time normalization via ref.
- `apps/web/lib/shop-input.ts` — **NEW**: pure `normalizeShopInput()` (client mirror of `normalizeShop` + bare-name completion), so it is unit-testable.
- `apps/web/components/SyncButton.tsx` — READY-state message "Synced — open This week's moves." becomes a real `<a href=\"/app\">`.
- `apps/web/app/onboarding/page.tsx` — step 3 `done` computed from "any recommendation for the org's store has status != NEW".
- `apps/web/lib/sync-runner.test.ts` — **NEW** unit tests for claim semantics + pipeline status writes (mocked deps).
- `apps/web/lib/shop-input.test.ts` — **NEW** unit tests for input normalization.

## Implementation order

### 1. Create `apps/web/lib/shop-input.ts` (pure, testable normalization)

The server's `normalizeShop` (packages/integrations/src/shopify/oauth.ts:4-10) trims, lowercases, strips protocol and path — but does **NOT** append `.myshopify.com`. The client helper mirrors it and additionally completes bare names:

```ts
/**
 * Client-side mirror of @ss/integrations normalizeShop (trim/lowercase/strip protocol+path),
 * plus bare-name completion: \"mystore\" → \"mystore.myshopify.com\". The server still re-validates
 * with isValidShopDomain, so this is UX polish, not a security boundary.
 */
export function normalizeShopInput(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
  if (!s) return s
  return s.includes('.') ? s : `${s}.myshopify.com`
}
```

### 2. Create `apps/web/lib/sync-runner.ts` (the shared runner)

Copy the claim + `after()` body VERBATIM from `syncStoreAction` (apps/web/app/connections/actions.ts:50-86), with exactly one behavioral hardening: the `revalidatePath` calls get their own inner try/catch so a revalidation hiccup in a route-handler context can never flip a successful sync to ERROR. Do NOT put `'use server'` at the top of this file (see landmines).

```ts
import { prisma } from '@ss/db'
import { backfillStore, analyzeStore } from '@ss/jobs'
import { RealShopifyReader } from '@ss/integrations'
import { createLlmClient } from '@ss/engine'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

/** A SYNCING store with no heartbeat past this is treated as stale and may be restarted. */
export const STUCK_AFTER_MS = 15 * 60 * 1000

/**
 * Atomically claim and run a background sync for an ALREADY-AUTHORIZED store. Callers own the
 * tenant/demo/session checks — this module implements only the race-free claim and the after()
 * pipeline. Used by both the syncStoreAction server action and the OAuth callback route
 * (server actions cannot be invoked from route handlers, hence the shared plain module).
 * after() is stable in Next 15 for both Server Actions and Route Handlers.
 */
export async function startStoreSync(
  storeId: string,
  shop: string,
  token: string,
): Promise<{ started: boolean }> {
  // Atomic claim (no check-then-write race): flip to SYNCING only if not already running or
  // the running job is stale (>15min, e.g. killed by a deploy).
  const stale = new Date(Date.now() - STUCK_AFTER_MS)
  const claimed = await prisma.store.updateMany({
    where: {
      id: storeId,
      OR: [
        { syncStatus: { not: 'SYNCING' } },
        { syncStartedAt: null },
        { syncStartedAt: { lt: stale } },
      ],
    },
    data: { syncStatus: 'SYNCING', syncStartedAt: new Date(), syncError: null },
  })
  if (claimed.count === 0) return { started: false }

  after(async () => {
    try {
      await backfillStore(prisma, storeId, new RealShopifyReader(), { shop, token })
      // backfillStore flips status to READY internally — re-assert SYNCING for the analysis leg
      // so the UI stays \"syncing\" until the moves actually exist.
      await prisma.store.update({ where: { id: storeId }, data: { syncStatus: 'SYNCING' } })
      await analyzeStore(prisma, storeId, { llm: createLlmClient() })
      await prisma.store.update({
        where: { id: storeId },
        data: { syncStatus: 'READY', lastSyncedAt: new Date(), syncError: null },
      })
      try {
        revalidatePath('/connections')
        revalidatePath('/app')
      } catch {
        // Cache revalidation is a hint; never let it flip a successful sync to ERROR.
      }
    } catch (err) {
      await prisma.store.update({
        where: { id: storeId },
        data: { syncStatus: 'ERROR', syncError: String((err as Error).message).slice(0, 500) },
      })
    }
  })

  return { started: true }
}
```

### 3. Rewire `apps/web/app/connections/actions.ts`

Replace the body of `syncStoreAction` from the claim onward (lines 50-88) with a delegation. Keep ALL guards (lines 41-45) untouched. Result:

```ts
export async function syncStoreAction(storeId: string): Promise<SyncTrigger> {
  const { orgId } = await getSession()
  // Demo store is a shared read-only showcase — never syncable (it has no token anyway).
  if (storeId === DEMO.storeId || orgId === DEMO.orgId) return { ok: false, error: 'demo store' }
  const store = await getOrgStore(prisma, orgId, storeId)
  if (!store || !store.accessTokenEnc) return { ok: false, error: 'not connected' }

  const { started } = await startStoreSync(
    storeId,
    store.shopDomain,
    decryptSecret(store.accessTokenEnc),
  )
  return { ok: true, started }
}
```

Then clean the imports at the top of actions.ts: remove `backfillStore, analyzeStore` (`@ss/jobs`), `RealShopifyReader` (keep `decryptSecret` from `@ss/integrations`), `createLlmClient` (`@ss/engine`), `after` (`next/server`), and delete the local `STUCK_AFTER_MS` const (line 11) with its doc comment. Add `import { startStoreSync } from '@/lib/sync-runner'`. KEEP `revalidatePath` — `disconnectStoreAction` (lines 20-21) still uses it. `SyncTrigger`, `SyncState`, `getSyncStatus`, `disconnectStoreAction` are unchanged.

Also reword the `syncStoreAction` doc comment (lines 32-39): it currently says the heavy work runs \"OFF the request path via `after()`\" — after this change the `after()` call lives only in the runner, and the literal `after(` at line 34 would fail the acceptance grep below. Reword to \"…runs OFF the request path inside `startStoreSync` (lib/sync-runner)…\", keeping the rest of the comment (idempotent backfill, Fly warm machine) intact.

### 4. Auto-start sync in `apps/web/app/api/stores/connect/callback/route.ts`

a) Capture the upsert result (line 59 currently discards it): `const store = await prisma.store.upsert({ ... })` — the upsert object itself is unchanged.

b) After `jar.delete('ss_oauth_state')` (line 82), replace the comment block + final redirect (lines 84-87) with:

```ts
  // Auto-start the first sync so the merchant lands on /connections already syncing.
  // Best-effort: a kickoff failure must not break an otherwise-successful connect — the
  // store stays PENDING and the merchant can click \"Sync now\". started:false means a sync
  // is ALREADY in flight, so the syncing banner is correct either way.
  let syncing = false
  try {
    await startStoreSync(store.id, shop, token)
    syncing = true
  } catch (err) {
    console.error('[connect] auto-sync kickoff failed (continuing):', (err as Error).message)
  }

  return NextResponse.redirect(
    `${cfg.appUrl}/connections?connected=${encodeURIComponent(shop)}${syncing ? '&syncing=1' : ''}`,
  )
```

c) Add `import { startStoreSync } from '@/lib/sync-runner'`. Update the stale file doc comment (lines 15-18, \"Backfill is enqueued in Slice 3\") to say the sync now auto-starts via the shared runner.

Do NOT touch the auth guard at lines 45-46 (`if (!userId || orgId === DEMO.orgId) return fail('auth')`) — it is what makes calling the guard-less runner safe here.

### 5. Update `apps/web/components/ConnectNotice.tsx`

Add a `syncing?: boolean` prop and branch the success copy (current copy at lines 35-38 says \"Click Sync now below\" — now a lie when auto-sync ran):

```tsx
export function ConnectNotice({
  connectedShop,
  error,
  syncing,
}: {
  connectedShop?: string
  error?: string
  syncing?: boolean
}) {
```

and inside the success banner's `<span>`:

```tsx
        <span>
          {syncing ? (
            <>
              <strong>{connectedShop}</strong> connected — pulling your history and analyzing it
              now. Your first moves will appear shortly; this page tracks progress below.
            </>
          ) : (
            <>
              <strong>{connectedShop}</strong> connected. Click <strong>Sync now</strong> below to
              pull your history and see your first moves.
            </>
          )}
        </span>
```

Leave the six error-code mappings (state/hmac/auth/shop/config/exchange) untouched.

### 6. Create `apps/web/components/ConnectForm.tsx` and use it in the connections page

New client component. Key mechanics: the input is uncontrolled with a ref, and `onSubmit` mutates `ref.current.value` synchronously (direct DOM write) so the native GET submission carries the normalized value — React state would NOT flush in time. The `pattern` runs on the RAW value before the submit event, so it must accept bare names and pasted URLs including any path (see landmines).

```tsx
'use client'
import { useRef } from 'react'
import { normalizeShopInput } from '@/lib/shop-input'

/** Labeled, client-validated connect form. Normalizes \"mystore\" → \"mystore.myshopify.com\"
 *  at submit time (mirrors server normalizeShop + isValidShopDomain). */
export function ConnectForm() {
  const shopRef = useRef<HTMLInputElement>(null)
  return (
    <form
      action=\"/api/stores/connect/start\"
      method=\"get\"
      onSubmit={() => {
        const el = shopRef.current
        if (el) el.value = normalizeShopInput(el.value)
      }}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}
    >
      <div style={{ flex: 1, minWidth: 260 }}>
        <label
          htmlFor=\"connect-shop\"
          style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-strong)',
          }}
        >
          Your Shopify store domain
        </label>
        <input
          id=\"connect-shop\"
          ref={shopRef}
          name=\"shop\"
          required
          pattern=\"(https?://)?[a-zA-Z0-9][a-zA-Z0-9\\-]*(\\.myshopify\\.com)?(/.*)?\"
          title=\"Your .myshopify.com domain — e.g. your-store.myshopify.com (or just your-store)\"
          placeholder=\"your-store.myshopify.com\"
          style={{
            width: '100%',
            height: 42,
            padding: '0 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-card)',
            fontSize: 14,
          }}
        />
      </div>
      <button
        type=\"submit\"
        style={{
          height: 42,
          padding: '0 18px',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          background: 'var(--action-primary)',
          color: 'var(--text-onbrand)',
          fontWeight: 600,
          boxShadow: 'var(--shadow-inset-glint), var(--shadow-sm)',
          cursor: 'pointer',
        }}
      >
        Connect Shopify
      </button>
    </form>
  )
}
```

In `apps/web/app/connections/page.tsx`:
- Change the searchParams type (line 15) to `Promise<{ connected?: string; error?: string; syncing?: string }>` and destructure `syncing` at line 18.
- Line 28: `<ConnectNotice connectedShop={connectedShop} error={error} syncing={syncing === '1'} />`.
- Replace the whole inline `<form>…</form>` (lines 80-115) with `<ConnectForm />` and add the import.
- Update the footer copy (lines 131-134): replace \"After connecting, click **Sync now** to pull your order history…\" with e.g. \"Connecting starts your first sync automatically — we pull your order history and generate your first grounded moves. You can re-sync anytime from here. (Until then, the dashboard shows the demo store.)\"

### 7. Make the post-sync message a real link in `apps/web/components/SyncButton.tsx`

Replace the READY-state span (lines 67-70):

```tsx
      ) : status === 'READY' && !error ? (
        <a href=\"/app\" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-link)' }}>
          Synced — open This week&apos;s moves →
        </a>
      ) : error ? (
```

No other changes to SyncButton — its polling effect already picks up the auto-started sync because the server renders it with `initialStatus=\"SYNCING\"` after the callback redirect (the claim runs *before* the redirect response, so the row is already SYNCING when /connections renders).

### 8. Onboarding step 3 completion in `apps/web/app/onboarding/page.tsx`

The simplest honest rule (and the one already fed by existing code — `setMoveStatus` in apps/web/app/app/actions.ts persists VIEWED/IMPLEMENTED/DISMISSED tenant-scoped): **step 3 is done when any recommendation for the org's connected store has status != NEW**. The Prisma `RecStatus` enum is `NEW | VIEWED | IMPLEMENTED | DISMISSED` with `@default(NEW)` (packages/db/prisma/schema.prisma:42-47, :245).

After the `hasRun` line (line 22), add:

```ts
  const acted = connected
    ? (await prisma.recommendation.count({
        where: { storeId: connected.id, status: { not: 'NEW' } },
      })) > 0
    : false
```

Then change step 3 (lines 41-48): `done: acted` and `active: hasRun && !acted`. Leave the cta as-is. (This is tenant-safe by construction: `connected` is already filtered by `orgId` and `accessTokenEnc: { not: null }`, which the demo store never has.)

### 9. New test: `apps/web/lib/shop-input.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { normalizeShopInput } from './shop-input'

describe('normalizeShopInput', () => {
  it('completes a bare store name', () => {
    expect(normalizeShopInput('mystore')).toBe('mystore.myshopify.com')
  })
  it('passes a full domain through', () => {
    expect(normalizeShopInput('mystore.myshopify.com')).toBe('mystore.myshopify.com')
  })
  it('strips protocol, path, whitespace and case (mirrors server normalizeShop)', () => {
    expect(normalizeShopInput('  https://MyStore.myshopify.com/admin  ')).toBe(
      'mystore.myshopify.com',
    )
  })
  it('returns empty string unchanged', () => {
    expect(normalizeShopInput('   ')).toBe('')
  })
})
```

### 10. New test: `apps/web/lib/sync-runner.test.ts`

Define ALL mock fns inside the `vi.mock` factories (vi.mock is hoisted above const declarations — referencing outer consts in factories causes TDZ errors), then reach them via `vi.mocked` on the imports:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@ss/db', () => ({
  prisma: { store: { updateMany: vi.fn(), update: vi.fn() } },
}))
vi.mock('@ss/jobs', () => ({ backfillStore: vi.fn(), analyzeStore: vi.fn() }))
vi.mock('@ss/integrations', () => ({ RealShopifyReader: vi.fn() }))
vi.mock('@ss/engine', () => ({ createLlmClient: vi.fn(() => ({})) }))
vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { prisma } from '@ss/db'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { backfillStore, analyzeStore } from '@ss/jobs'
import { startStoreSync } from './sync-runner'

const updateMany = vi.mocked(prisma.store.updateMany)
const update = vi.mocked(prisma.store.update)
const afterMock = vi.mocked(after)

/** Run the callback captured by after() (the background pipeline). */
async function runPipeline(): Promise<void> {
  const cb = afterMock.mock.calls[0]![0] as () => Promise<void>
  await cb()
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('startStoreSync', () => {
  it('reports started:false and schedules nothing when the claim loses', async () => {
    updateMany.mockResolvedValue({ count: 0 })
    const r = await startStoreSync('s1', 'x.myshopify.com', 'tok')
    expect(r).toEqual({ started: false })
    expect(afterMock).not.toHaveBeenCalled()
  })

  it('claims atomically with the stale-recovery OR clause and starts the pipeline', async () => {
    updateMany.mockResolvedValue({ count: 1 })
    const r = await startStoreSync('s1', 'x.myshopify.com', 'tok')
    expect(r).toEqual({ started: true })
    const arg = updateMany.mock.calls[0]![0]!
    expect(arg.where).toMatchObject({ id: 's1' })
    expect(arg.where!.OR).toHaveLength(3)
    expect(arg.data).toMatchObject({ syncStatus: 'SYNCING', syncError: null })
    expect(afterMock).toHaveBeenCalledTimes(1)
  })

  it('pipeline: backfill → re-assert SYNCING → analyze → READY, then revalidates both paths', async () => {
    updateMany.mockResolvedValue({ count: 1 })
    await startStoreSync('s1', 'x.myshopify.com', 'tok')
    await runPipeline()
    expect(vi.mocked(backfillStore)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(analyzeStore)).toHaveBeenCalledTimes(1)
    // 1st update re-asserts SYNCING (backfillStore flips READY internally), 2nd lands READY
    expect(update.mock.calls[0]![0]!.data).toMatchObject({ syncStatus: 'SYNCING' })
    expect(update.mock.calls[1]![0]!.data).toMatchObject({ syncStatus: 'READY', syncError: null })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/connections')
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/app')
  })

  it('pipeline failure writes ERROR with a 500-char-truncated message', async () => {
    updateMany.mockResolvedValue({ count: 1 })
    vi.mocked(backfillStore).mockRejectedValueOnce(new Error('boom '.repeat(200)))
    await startStoreSync('s1', 'x.myshopify.com', 'tok')
    await runPipeline()
    const last = update.mock.calls.at(-1)![0]!
    expect(last.data).toMatchObject({ syncStatus: 'ERROR' })
    expect((last.data as { syncError: string }).syncError.length).toBeLessThanOrEqual(500)
  })

  it('a revalidatePath failure does NOT flip a successful sync to ERROR', async () => {
    updateMany.mockResolvedValue({ count: 1 })
    vi.mocked(revalidatePath).mockImplementationOnce(() => {
      throw new Error('no request scope')
    })
    await startStoreSync('s1', 'x.myshopify.com', 'tok')
    await runPipeline()
    expect(update.mock.calls.at(-1)![0]!.data).toMatchObject({ syncStatus: 'READY' })
  })
})
```

If TypeScript complains about the mocked `updateMany` payload shape, cast: `updateMany.mockResolvedValue({ count: 1 } as never)`.

### 11. Verification gate

```
pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build
```

All must pass (baseline: 145 tests green; you are adding ~9 more). Fix anything the gate surfaces before committing.

### 12. Commit

Suggested message:

```
feat: first-run funnel — auto-sync on OAuth connect, onboarding step-3 completion, connect-form polish

- extract sync claim+pipeline into shared lib/sync-runner (server action + callback route)
- callback auto-starts the first sync; /connections lands already syncing (&syncing=1 banner)
- onboarding step 3 completes when any move has status != NEW
- labeled + client-validated connect form, bare names normalized to *.myshopify.com
- post-sync \"open This week's moves\" is a real link to /app
```

## Edge cases & landmines

- **Do NOT put `'use server'` on `apps/web/lib/sync-runner.ts`.** Server actions cannot be invoked from route handlers — that constraint is the entire reason the runner exists as a plain module. Worse: `'use server'` would turn `startStoreSync` (which has NO session/demo/tenant guards by design) into a client-invokable POST endpoint — a tenant-isolation hole. The guards live in the callers: `syncStoreAction` (actions.ts:41-45) and the callback's auth check (callback/route.ts:45-46, which fails closed to `?error=auth` because `getSession()` falls back to the shared DEMO org when unauthenticated).
- **`'use server'` files may only export async functions** — that's also why `STUCK_AFTER_MS` moves out of actions.ts into the runner rather than being exported from actions.ts.
- **The callback upsert result is currently discarded** (callback/route.ts:59 — `await prisma.store.upsert(...)` with no assignment). You MUST capture it (`const store = ...`) to get `store.id` for the runner. Everything else the runner needs (`shop`, `token`) is already in scope.
- **`after()` in a route handler is supported but unproven in this repo** (Next 15.5.19 installed; the only existing usage is the server action at actions.ts:67). It works without config, BUT `revalidatePath` inside `after()` in a *route* context is the risky bit — that's why the runner wraps the two `revalidatePath` calls in their own try/catch. Without that, a revalidation throw would fall into the outer catch and mark a **successful** sync as ERROR. The new test \"revalidatePath failure does NOT flip…\" pins this.
- **Call `startStoreSync` BEFORE returning the redirect.** `after()` must be registered while the request is alive; its callback then runs after the response is sent, so the OAuth redirect still returns immediately (same property the current comment at callback/route.ts:84-86 protects).
- **The claim runs synchronously in the request, so the redirect races nothing:** by the time /connections server-renders, the store row is already `SYNCING`, and `<SyncButton initialStatus=\"SYNCING\">` starts polling with zero clicks. Don't add any client-side \"auto-click\" hack.
- **`started: false` still means a sync is in flight** (claim lost = someone else is running it). The callback sets `syncing=1` in that case too — the banner copy is correct either way. (SyncButton's `run()` already relies on the same fact at SyncButton.tsx:47-55.)
- **Keep the re-assert-SYNCING line.** `backfillStore` flips status to READY internally (comment at actions.ts:70-71); dropping the intermediate `update({ syncStatus: 'SYNCING' })` makes the UI say \"Synced\" while the LLM analysis is still running — a grounding-adjacent lie.
- **HTML `pattern` validation runs BEFORE the submit event fires.** So the pattern must accept the RAW input — bare `mystore`, pasted `https://…` URLs *including a trailing path* like `https://mystore.myshopify.com/admin` (hence the `(/.*)?` tail; a bare `/?` would block pasted admin URLs whose path the normalizer exists to strip) — the strictly-valid-domain check stays server-side (`isValidShopDomain`, oauth.ts:12-14). And the normalization must be a **direct DOM write via ref** in `onSubmit` — React `setState` will not flush before the browser serializes the native GET submission.
- **Server `normalizeShop` does NOT append `.myshopify.com`** (oauth.ts:4-10). A bare \"mystore\" today sails past the form and dies on start/route.ts:34's raw JSON 400. Only the client helper appends. Don't \"fix\" the server to append — out of scope and it would change what `isValidShopDomain` guards.
- **Keep `revalidatePath` imported in actions.ts** after the cleanup — `disconnectStoreAction` (actions.ts:20-21) still uses it. Removing it breaks the build.
- **The syncStoreAction doc comment must stop saying `after()`** (currently at actions.ts:34) — step 3 rewords it. Leaving it would fail the `grep -c \"backfillStore\\|analyzeStore\\|after(\"` acceptance check even though the code is clean.
- **Onboarding page is `force-dynamic`** (page.tsx:5) — no revalidation plumbing needed for step 3; it recomputes per request. The `connected` lookup (orgId + `accessTokenEnc: { not: null }`) can never match the demo store (it has no token — actions.ts:42), so `acted` never counts demo recommendations.
- **`vi.mock` hoisting TDZ trap:** vitest hoists `vi.mock` calls above `const` declarations. Declare mock fns *inside* the factories (`vi.fn()` is available there) and retrieve them via `vi.mocked(importedThing)` — the pattern in step 10. Referencing a top-level `const updateMany` from a factory throws at import time.
- **Do not touch the atomic-claim `updateMany` OR-clause** (three branches: not-SYNCING, null `syncStartedAt`, stale `syncStartedAt`). It is the only thing preventing double-syncs across the action, the callback, and a merchant double-click — and `syncStartedAt` is written nowhere else in the codebase.

## Acceptance criteria

- [ ] `pnpm format && pnpm typecheck && pnpm test && pnpm lint && pnpm --filter @ss/web build` all pass.
- [ ] All 145 pre-existing tests still pass; new tests added and green: `apps/web/lib/sync-runner.test.ts` (5 cases: claim-lost, claim-won shape, happy pipeline order, ERROR truncation, revalidate-failure isolation) and `apps/web/lib/shop-input.test.ts` (4 cases).
- [ ] `grep -c \"backfillStore\\|analyzeStore\\|after(\" apps/web/app/connections/actions.ts` prints 0 — the pipeline lives only in `apps/web/lib/sync-runner.ts` (requires the step-3 doc-comment reword; grep exits 1 on zero matches, so check the printed count, not the exit code).
- [ ] `grep -c \"'use server'\" apps/web/lib/sync-runner.ts` prints 0 (runner is a plain module).
- [ ] `grep -n \"const store = await prisma.store.upsert\" apps/web/app/api/stores/connect/callback/route.ts` matches, and `grep -n \"startStoreSync\" apps/web/app/api/stores/connect/callback/route.ts` shows the call before the final redirect, which includes `syncing=1` on success.
- [ ] Screen check (`pnpm --filter @ss/web dev`, signed in, non-demo org): visiting `/connections?connected=test.myshopify.com&syncing=1` shows the \"pulling your history and analyzing it now\" banner; visiting with only `?connected=…` shows the old \"Click Sync now\" copy; each of `?error=state|hmac|auth|shop|config|exchange` still shows its mapped message.
- [ ] Screen check: the connect form (visible when Shopify creds set and no store connected) renders a `<label for=\"connect-shop\">`; submitting empty is blocked by the browser (`required`); typing `mystore` and submitting produces a request to `/api/stores/connect/start?shop=mystore.myshopify.com` (Network tab); typing `not_a_store!` is blocked by `pattern`; pasting `https://mystore.myshopify.com/admin` passes `pattern` and submits as `shop=mystore.myshopify.com`.
- [ ] Screen check: with a store in `syncStatus='READY'`, the SyncButton row renders \"Synced — open This week's moves →\" as an anchor whose `href=\"/app\"`.
- [ ] Onboarding: with a connected store + run and all recommendations `NEW`, `/onboarding` shows step 3 active-not-done; after flipping one rec (`UPDATE \"Recommendation\" SET status='VIEWED' WHERE \"storeId\"='<store>' LIMIT`-equivalent via Prisma studio or acting on a move in `/app`), step 3 renders with the check mark.
- [ ] `syncStoreAction` behavior unchanged for its callers: demo org/store still returns `{ ok: false, error: 'demo store' }`; unowned store still returns `{ ok: false, error: 'not connected' }` (guards at actions.ts:41-45 untouched — verify by reading the diff).
- [ ] No Prisma schema changes: `git diff --stat packages/db/prisma/schema.prisma` is empty.

## Out of scope

- **Durable job queue (Inngest)** — sync stays in-process via `after()`; the `TODO(Slice 3)` in the webhook route and the Inngest wiring remain untouched.
- **The start route's raw-JSON failure responses** (start/route.ts 400/429/503) — client validation makes the invalid-shop dead-end unreachable for form users; converting those to friendly redirects is a separate slice.
- **Shopify GDPR/compliance webhooks**, App Store embedded track, webhook topic handling — parked per docs/SHOPIFY_APP_STORE_PLAN.md.
- **No new DB fields** for onboarding (no `onboardingComplete` column) — the status-derived rule is the whole fix.
- **No changes to tier gating, grounding, ranking, exports, or the demo-store showcase behavior.**
- **No changes to `packages/integrations` `normalizeShop`/`isValidShopDomain`** — the client mirrors them; it does not replace them.
- **No SettingsView tabs, charts kit, audit publicSlug, Sentry, Resend, Playwright** — all separately tracked backlog items.
- **No dependency additions** (no form libraries, no zod on the client) — the form is native HTML validation + one pure helper.
