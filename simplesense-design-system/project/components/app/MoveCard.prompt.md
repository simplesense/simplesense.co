**MoveCard** — the hero component. A ranked, prescriptive recommendation following the brand's Pattern → Why → Move → Impact unit. Reach for this whenever SimpleSense tells the operator what to do next.

```jsx
<MoveCard
  rank={1}
  category="Geographic concentration"
  pattern="82% of your customers come from within 5 miles of your stores."
  why="You're paying national ad rates to reach a local audience."
  moves={[
    "Geo-fence Meta & Google to a 5-mile radius",
    "Turn on local pickup (BOPIS) via Shopify Flow",
    "Shift budget from national spray to local high-intent",
  ]}
  impact="+$4–7k / mo"
  confidence="Grounded in 3.2 yrs of order data"
/>
```

`pattern` renders in Instrument Serif (the editorial finding); `moves` become a green ✓ list; `impact` is a success badge. Keep copy operator-to-operator and specific.
