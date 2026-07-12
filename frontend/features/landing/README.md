# `features/landing`

The marketing landing experience. **The only place where R3F lives.**

## Structure

```
landing/
├── components/
│   ├── hero/
│   │   ├── index.tsx          # Hero entry; loads HeroScene dynamically
│   │   ├── hero-scene.tsx     # R3F scene
│   │   └── hero-poster.tsx    # Reduced-motion fallback
│   ├── features.tsx
│   ├── how-it-works.tsx
│   ├── pricing.tsx
│   └── testimonials.tsx
└── index.ts
```

## Rules

- Lazy-load R3F (`dynamic` + `ssr: false`).
- Provide a static `HeroPoster` for reduced-motion.
- Lighthouse mobile ≥ 90 on the route.
- Bundle delta < 120 KB gz for the scene.
- See `.cursor/rules/20-three-d-rules.md`.
