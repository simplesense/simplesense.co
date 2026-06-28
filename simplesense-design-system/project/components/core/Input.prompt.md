**Input** — labelled single-line text field with optional leading icon and hint.

```jsx
<Input label="Store URL" icon="shop" placeholder="yourstore.myshopify.com" />
<Input label="Email" type="email" hint="We'll send your audit here" />
<Input invalid hint="That doesn't look right" defaultValue="…" />
```

Focus shows the blue ring; `invalid` switches border + hint to danger.
