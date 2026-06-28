**Button** — the primary action control; signal-blue `primary` for the one key action per view, `secondary`/`ghost` for everything else, `clay` for warm marketing accents.

```jsx
<Button variant="primary" iconRight="arrow-right">Get your free audit</Button>
<Button variant="secondary" icon="funnel">Filter</Button>
<Button variant="ghost" size="sm">Skip</Button>
<Button variant="clay" pill>Link up</Button>
```

Variants: `primary` (blue + inner glint), `clay`, `secondary`, `ghost`. Sizes: `sm` / `md` / `lg`. `pill` for nav & marketing CTAs. Press darkens color (never shrinks); the glint widens slightly on hover. Icons are Bootstrap Icons names (no `bi-` prefix).
