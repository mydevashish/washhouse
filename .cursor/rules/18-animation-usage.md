---
description: When and how to use animations (Framer Motion + R3F)
globs: frontend/**
alwaysApply: false
---

# Animation Usage

## Philosophy

Motion is a **communication tool**, not decoration. Every animation must do at least one of:
- Direct attention
- Communicate state change
- Reinforce hierarchy
- Provide affordance / feedback
- Establish brand identity (landing only)

If it can't justify itself, cut it.

## Framer Motion — when to use

✅ Use for:
- Page / route transitions (subtle)
- Modal / sheet / drawer entrance & exit
- Toast / alert in/out
- List stagger on initial render
- Hover affordances (buttons, cards)
- Status / progress changes
- Form success / error microinteractions

❌ Do not use for:
- Decorative continuous motion
- Animating layout-affecting props (`width`, `height`, `top`, `left`)
- Long sequences > 500 ms
- Cascading animations triggered by scroll on long pages
- Anything that runs while off-screen

## Durations & easings

| Type                    | Duration        | Easing                       |
| ----------------------- | --------------- | ---------------------------- |
| Hover/press feedback    | 100–150 ms      | `ease-out`                   |
| Tooltips, dropdowns     | 150–220 ms      | `ease-out`                   |
| Cards, modals, sheets   | 220–360 ms      | custom `[0.16,1,0.3,1]`      |
| Page transitions        | 200–300 ms      | `ease-in-out`                |
| List stagger            | 30–60 ms / item | `ease-out`                   |

## Performance rules

1. Animate **`transform`** and **`opacity`** only when possible.
2. Use `will-change` sparingly (release after animation).
3. Cap simultaneously animating elements to ~6 above the fold.
4. Use `layout` prop judiciously — measure cost.
5. Disable on `prefers-reduced-motion: reduce`.
6. Off-screen animations: pause with `useInView` or unmount.

## Reduced-motion handling

```tsx
import { useReducedMotion } from 'framer-motion';

const reduce = useReducedMotion();

<motion.div
  initial={reduce ? false : { opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: reduce ? 0 : 0.22, ease: [0.16,1,0.3,1] }}
/>
```

## Canonical patterns

### Card entry
```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
>
```

### List stagger
```tsx
<motion.ul
  initial="hidden"
  animate="show"
  variants={{
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  }}
>
  {items.map((it) => (
    <motion.li
      key={it.id}
      variants={{
        hidden: { opacity: 0, y: 6 },
        show:   { opacity: 1, y: 0 },
      }}
    >
      ...
    </motion.li>
  ))}
</motion.ul>
```

### Modal
```tsx
<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{   opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
      >
        ...
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

## React Three Fiber rules

R3F = **landing/hero only**. Never on dashboards, lists, or forms.

### Setup contract

- Dynamic-import: `dynamic(() => import('./HeroScene'), { ssr: false })`.
- Render only when in viewport (`IntersectionObserver`).
- Pause `useFrame` when off-screen.
- Provide a static fallback `<Image>` for reduced motion + slow networks.
- Hard budget:
  - One scene per page.
  - ≤ 1–2 meshes.
  - ≤ 60 KB textures.
  - Hits 60 FPS on a Pixel 6a / iPhone 12.

### Skeleton

```tsx
'use client';
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';
import { useReducedMotion } from 'framer-motion';

const HeroScene = dynamic(() => import('./hero-scene'), { ssr: false });

export function Hero() {
  const reduce = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: false, threshold: 0.05 });
  return (
    <div ref={ref} className="relative h-[80vh] w-full">
      {!reduce && inView ? <HeroScene /> : <HeroPoster /> }
    </div>
  );
}
```

## Banned patterns

❌ Scroll-jacking
❌ Parallax that affects layout
❌ Auto-rotating carousels
❌ Lottie animations > 200 KB
❌ R3F on dashboards
❌ Multiple competing animations in one viewport
❌ Animating during data loading (use skeletons)

## Mandatory before merge (motion changes)

- ✅ Reduced-motion path verified
- ✅ Mobile performance verified (no jank at 60 FPS)
- ✅ Off-screen animation paused or removed
- ✅ No layout-shifting animations introduced
- ✅ R3F (if any) gated behind viewport intersection + SSR off
