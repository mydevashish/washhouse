---
description: Responsive / mobile-first design rules
globs: frontend/**
alwaysApply: false
---

# Responsive Design

## Mobile-first, always

Design and build for **375 px** width first. Then enhance for larger screens. Tailwind breakpoints (default):

| Token  | Min width | Used for                            |
| ------ | --------- | ----------------------------------- |
| (base) | 0         | All small phones (360–414)          |
| `sm`   | 640px     | Large phones, small tablets         |
| `md`   | 768px     | Tablets                             |
| `lg`   | 1024px    | Small laptops                       |
| `xl`   | 1280px    | Standard desktops                   |
| `2xl`  | 1536px    | Large desktops                      |

## Mandatory device matrix

Every UI change is checked on:

- **375 × 812** (iPhone X/12 size)
- **414 × 896** (iPhone Plus)
- **768 × 1024** (iPad)
- **1280 × 800** (laptop)
- **1920 × 1080** (desktop)

Test in both **portrait** and **landscape** for tablets.

## Layout rules

### Container

```tsx
<div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
```

- App max width: `1280px`.
- Marketing landing max width: `1440px` (use `max-w-[1440px]`).
- Padding scales: `px-4` mobile → `px-6` sm → `px-8` lg.

### Grids

- Default to 1 column on mobile, grow to 2/3/4 on larger screens.
- Use Tailwind grid utilities. Avoid float/absolute layouts.

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

### Sticky bottom CTA (mobile)

Long forms / detail screens get a fixed bottom action bar on mobile:

```tsx
<div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur md:static md:border-0 md:bg-transparent">
  <Button className="w-full md:w-auto">Schedule pickup</Button>
</div>
```

### Navigation

| Viewport | Pattern                                                |
| -------- | ------------------------------------------------------ |
| Mobile   | Bottom tab bar (5 items) OR top app bar + hamburger    |
| Tablet+  | Top navigation                                         |
| Desktop  | Top nav + persistent sidebar for dashboards            |

For the customer flow, use a **bottom tab bar** on mobile: Discover · Orders · Subscribe · Profile.

## Typography & spacing

- Body text: `text-base` (15/24 mobile → 16/26 on md+).
- Tap targets: **min 44 × 44 px**.
- Line length: 50–75 characters for body copy (`max-w-prose`).
- Use the type scale in `13-ui-ux.md`.

## Images

- `next/image` with `sizes`:
  ```tsx
  <Image src="..." alt="..." fill sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" />
  ```
- Provide AVIF/WebP via `next/image` defaults.
- LCP image: `priority`.

## Tables

- Stack into cards on mobile (`md:table` pattern).
- Or wrap in horizontal scroll only as a last resort.

## Modals → sheets on mobile

- Modal on `md+`, full-screen / bottom-sheet on mobile.
- Use shadcn `Sheet` for mobile, `Dialog` for desktop. Wrap in a `useMediaQuery` helper.

## Form layouts

- Single column on mobile.
- Two columns on `md+` only when fields are clearly related (first/last name).
- Inputs full-width by default.
- Primary button stacks above secondary on mobile, side-by-side on desktop.

## Touch interactions

- Hover states must have an equivalent active/focus state.
- No content reveal that requires hover.
- Swipe gestures only where they augment, never replace, taps.
- Vertical page scroll must never be blocked by horizontal UI on touch viewports.
- **Horizontal carousels (Embla):** viewport/container must use `horizontal-scroll-touch` (`touch-pan-y` + `touch-pinch-zoom` via `HORIZONTAL_SCROLL_TOUCH_CLASS`); never `touch-pan-x` alone.
- **`overflow-x-auto` marketing strips:** use `HORIZONTAL_SCROLL_NATIVE_CLASS` (`touch-action: manipulation` ≡ pan-x + pan-y). Do **not** apply `HORIZONTAL_SCROLL_TOUCH_CLASS` — `pan-y` alone blocks native horizontal swipe.

## Performance considerations

- Don't ship desktop-sized images to mobile.
- Lazy-load below-the-fold images and components.
- Defer heavy client components on mobile (`dynamic` + `ssr: false` where safe).

## Density

- Tighter on desktop OK; never compromise tap targets on mobile.
- Whitespace generous; don't fill every pixel.

## Orientation

- Landscape on mobile: ensure forms remain usable (auto-scroll on keyboard open).
- Don't lock orientation.

## Browser support

| Browser      | Versions     |
| ------------ | ------------ |
| Chrome       | Last 2 major |
| Safari       | Last 2 major |
| Firefox      | Last 2 major |
| Edge         | Last 2 major |
| Mobile Safari| 15+          |
| Chrome Android | Last 2 major |

No IE.

## Mandatory before merge

- ✅ 375 px verified
- ✅ Tap targets ≥ 44 px
- ✅ No horizontal scroll
- ✅ Fixed bottom CTA visible & not covered by keyboard
- ✅ Modal → sheet conversion present where required
- ✅ Images sized for viewport
