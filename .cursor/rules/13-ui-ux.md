---
description: UI/UX, design system, motion, and 3D usage rules
globs: frontend/**
alwaysApply: false
---

# UI/UX Rules

The product is **youth-focused**, **premium**, **fast**, **mobile-first**, and **modern**. We are NOT building a corporate enterprise tool.

## Brand voice

- **Confident, warm, witty** (not cheesy).
- Microcopy first-person where appropriate: "Schedule my pickup".
- Avoid jargon. Talk like a human.

## Design tokens

Single source of truth lives in `frontend/styles/tokens.css` and is mirrored in `tailwind.config.ts`:

```css
:root {
  /* Brand */
  --brand-50:  #ECF7FF;
  --brand-500: #2D7BFF;   /* primary action */
  --brand-600: #1F66E0;
  --brand-900: #0B2E73;

  /* Accent */
  --accent-500: #FF7A59;  /* CTAs, badges */
  --accent-600: #E8633F;

  /* Neutral */
  --bg-0:   #FFFFFF;
  --bg-1:   #F7F8FB;
  --bg-2:   #EEF1F6;
  --fg-0:   #0E1320;
  --fg-1:   #3B4252;
  --fg-2:   #6B7280;
  --border: #E5E7EB;

  /* Dark */
  --bg-0-dark:   #0A0D14;
  --bg-1-dark:   #11151E;
  --bg-2-dark:   #1A1F2B;
  --fg-0-dark:   #F4F6FA;
  --fg-1-dark:   #B7BECC;
  --fg-2-dark:   #6B7480;

  /* Status */
  --success: #16A34A;
  --warning: #F59E0B;
  --danger:  #DC2626;
  --info:    #2563EB;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 32px;

  /* Shadows (Tailwind-compatible) */
  --shadow-soft:  0 1px 2px rgba(14,19,32,.04), 0 8px 24px rgba(14,19,32,.06);
  --shadow-pop:   0 2px 6px rgba(14,19,32,.08), 0 16px 40px rgba(14,19,32,.10);

  /* Motion */
  --ease-out:  cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:   cubic-bezier(0.7, 0, 0.84, 0);
  --dur-fast:  150ms;
  --dur-base:  220ms;
  --dur-slow:  360ms;
}
```

## Typography

| Role        | Font                         | Weight | Tracking |
| ----------- | ---------------------------- | ------ | -------- |
| Display     | **Geist** / Inter Tight      | 700    | -0.02em  |
| Body        | **Geist** / Inter            | 400/500 | 0       |
| Mono        | **Geist Mono** / JetBrains   | 400    | 0        |

Use `next/font` with `display: swap`. Limit to 2 families.

Type scale (mobile → desktop):
- `text-xs` 12 / 16
- `text-sm` 14 / 20
- `text-base` 15 / 24 (default mobile) → 16 / 26 on `md+`
- `text-lg` 18 / 28
- `text-xl` 20 / 28
- `text-2xl` 24 / 32 → 28 / 36
- `text-3xl` 28 / 36 → 36 / 44
- `text-display` 40 / 48 → 56 / 64

## Spacing

Tailwind default 4-px grid. Favor multiples of 4. Section vertical padding: 64–96 px desktop, 32–48 mobile.

## Layout

- **Mobile-first.** Build 360–414 px. Then `md:` (768) and `lg:` (1024) and `xl:` (1280).
- Container: max width `1280px` for app, `1440px` for marketing landing.
- Generous whitespace. No "wall of UI."
- Use sticky bottom action bar on mobile for primary CTAs.

## Components

- Use **shadcn/ui** primitives. Don't reinvent.
- Compose into feature-specific organisms; never patch shadcn internals.
- New atoms live in `components/ui/`; require Storybook story + test.

## Motion principles

1. **Purposeful.** Motion guides attention, doesn't decorate.
2. **Fast.** 150–360 ms. Anything > 500 ms feels broken.
3. **Eased.** Use `ease-out` for entries, `ease-in` for exits.
4. **Transform + opacity** preferred over layout-affecting properties.
5. **Stagger** by 30–60 ms in lists; cap at 8 items for cost.
6. **Respect `prefers-reduced-motion`.**

### Framer Motion patterns

```tsx
// Card entry
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
>
```

### Forbidden

❌ Auto-playing video on landing without mute + control
❌ Carousels with no manual control
❌ Parallax on mobile (battery + jank)
❌ Animating `width` / `height` / `top` / `left`
❌ More than one big motion effect per viewport

## 3D rules (R3F + Drei)

- **Landing hero only.** Period.
- One scene per page max.
- Lazy-loaded with `dynamic(..., { ssr: false })` behind viewport intersection.
- Pause when off-screen (`useFrame` guard with `inView`).
- Reduced-motion fallback: static `<Image>` poster.
- Max 1–2 lightweight meshes, no high-poly imports.
- Performance gate: scene must hit 60 FPS on mid-tier Android.

## Glassmorphism

Use sparingly — at most 1–2 surfaces per page. Always pair with strong contrast text and a subtle inner border.

```css
.glass {
  background: hsla(0, 0%, 100%, 0.55);
  backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid hsla(0, 0%, 100%, 0.35);
}
```

## Dark mode

- Implemented via `class="dark"` on `<html>` (Tailwind).
- Tokens duplicated for dark variant.
- Default to **system** preference; allow override (`light` / `dark` / `system`).
- Test every screen in both modes.

## Empty / loading / error states

Every list and detail view ships with:
- `Skeleton` (loading)
- `EmptyState` (no data — illustrative, with CTA)
- `ErrorState` (retry + support link)

## Forms

- One column on mobile, two on `md+` only when fields are clearly grouped.
- Inline validation on blur; submit summary at the top.
- Primary action right, secondary left on `md+`; **stacked on mobile**, primary first.
- Disable submit only during in-flight; never on validation errors (let the user retry).

## Imagery

- Photography: real-world, warm, hands-and-products focus. Avoid stock business clichés.
- Illustrations: minimal, geometric, brand-tinted.
- No drop-shadow gradient backgrounds clichés.

## Iconography

- **lucide-react** (consistent stroke).
- 20 px in body, 24 px in nav, 16 px in dense tables.
- Always paired with a text label OR `aria-label`.

## Microinteractions

- Buttons: subtle scale-down on press (`active:scale-[0.98]`).
- Inputs: 1 px focus ring in brand-500.
- Toasts (sonner): top-right desktop, bottom mobile.
- Success: brief check icon + ease-out.

## Sound

- No sound by default.

## Mandatory before shipping UI

- ✅ Mobile (375 px) verified
- ✅ Dark + light verified
- ✅ Reduced motion verified
- ✅ Keyboard verified
- ✅ Empty / loading / error states present
- ✅ Tokens used (no hardcoded colors)
- ✅ Lighthouse mobile ≥ 90 on the route
