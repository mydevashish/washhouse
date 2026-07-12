# Motion Guidelines

> Motion communicates state. It doesn't decorate.

## Tokens

`frontend/lib/motion.ts`:

```ts
export const easing = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};
export const duration = { fast: 0.15, base: 0.22, slow: 0.36 };
```

## Patterns

| Pattern             | Where                   | Duration  | Easing      |
| ------------------- | ----------------------- | --------- | ----------- |
| Fade + Y 8 px       | Card / section reveal   | 220 ms    | `out`       |
| Scale 0.98 → 1      | Modal entrance          | 220 ms    | `out`       |
| Stagger 50 ms       | List reveal             | per item  | `out`       |
| Press shrink        | Buttons                 | 100 ms    | `out`       |
| Crossfade           | Reduced-motion fallback | 200 ms    | linear      |

## R3F

- Landing only
- Lazy-loaded with `dynamic(..., { ssr: false })`
- Viewport-gated render
- Reduced-motion fallback poster
- Bundle delta < 120 KB gz

See `.cursor/rules/18-animation-usage.md` and `.cursor/rules/20-three-d-rules.md`.

## Forbidden

❌ Parallax on mobile
❌ Auto-rotating carousels
❌ Continuous decorative motion
❌ Animating layout-affecting properties
