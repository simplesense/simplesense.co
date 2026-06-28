**MetricCard** — KPI tile for the operator dashboard. Lay 3–4 across a grid row.

```jsx
<MetricCard label="Conversion rate" value="1.8%" delta="+0.4pt" icon="graph-up-arrow" />
<MetricCard label="Refund rate" value="3.1%" delta="-0.6pt" deltaTone="success" icon="arrow-counterclockwise" />
<MetricCard label="Draft products" value="148" delta="Review" deltaTone="warning" icon="box-seam" />
```

Pre-format `value` and `delta` yourself. `deltaTone` matches Badge tones.
