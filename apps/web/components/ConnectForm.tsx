'use client'
import { useRef } from 'react'
import { normalizeShopInput } from '@/lib/shop-input'

/** Labeled, client-validated connect form. Normalizes "mystore" → "mystore.myshopify.com"
 *  at submit time (mirrors server normalizeShop + isValidShopDomain). */
export function ConnectForm() {
  const shopRef = useRef<HTMLInputElement>(null)
  return (
    <form
      action="/api/stores/connect/start"
      method="get"
      onSubmit={() => {
        const el = shopRef.current
        if (el) el.value = normalizeShopInput(el.value)
      }}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}
    >
      <div style={{ flex: 1, minWidth: 260 }}>
        <label
          htmlFor="connect-shop"
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
          id="connect-shop"
          ref={shopRef}
          name="shop"
          required
          pattern="(https?://)?[a-zA-Z0-9][a-zA-Z0-9\-]*(\.myshopify\.com)?(/.*)?"
          title="Your .myshopify.com domain — e.g. your-store.myshopify.com (or just your-store)"
          placeholder="your-store.myshopify.com"
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
        type="submit"
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
