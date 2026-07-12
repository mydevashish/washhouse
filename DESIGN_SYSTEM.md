# DLM Design System

> Production design system for the Doorstep Laundry Marketplace.  
> **Stack:** Tailwind CSS 3 · shadcn/ui patterns · Radix UI primitives · Mobile-first  
> **Implementation:** `frontend/styles/tokens.css` + `frontend/components/ui/`  
> **Audit:** See `UI_AUDIT_REPORT.md` for findings and migration status  
> **Last updated:** 2026-06-02 (compact density + semantic tokens)

---

## 0. Compact density (default)

DLM dashboards follow a **dense SaaS** scale (~15–25% smaller than the initial UI).

| Token | CSS variable | Value | Tailwind |
| ----- | ------------ | ----- | -------- |
| Navbar | `--nav-height` | 56px | `h-nav` |
| Sidebar | `--sidebar-width` | 208px | `w-sidebar` |
| Control | `--control-height` | 36px | `h-control` |
| Table row | `--table-row` | 40px | `h-table-row` |

### Typography utilities (`globals.css`)

| Utility | Use |
| ------- | --- |
| `.page-title` | Page H1 — `text-xl font-semibold` |
| `.section-title` | Section H2 — `text-base font-semibold` |
| `.card-title` | Card H3 — `text-sm font-semibold` |
| `.helper-text` | Captions — `text-xs text-muted-foreground` |
| `.rating-pill` | Star rating chip |
| `.text-on-hero` | Text on `bg-hero-gradient` (uses `--primary-foreground`) |
| `.text-on-hero-muted` | Subtext on hero bands |
| `.overlay-scrim` | Modal / drawer backdrop (`--overlay`) |
| `.table-sticky-head` | Sticky `<thead>` on scroll |

### Layout defaults

| Context | Convention |
| ------- | ---------- |
| Page content | `max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-5` |
| Card body | `p-4` |
| Section stack | `space-y-4`–`space-y-5` |
| Form fields | `gap-2` label → input |

**Rule:** Do not use `text-black`, `text-white`, `bg-white`, `bg-black`, or raw `amber-*` / `emerald-*` in feature code. Use semantic tokens (`text-foreground`, `bg-card`, `text-success`, `bg-warning-muted`, etc.).

---

## 1. Principles

| Principle | Application |
| --------- | ----------- |
| **Mobile first** | 44px min touch targets; single-column defaults; bottom drawers on small screens |
| **Accessible** | WCAG 2.1 AA contrast, focus rings, Radix a11y, semantic HTML, `aria-*` |
| **Consistent** | Tokens → Tailwind → CVA variants; no one-off hex in features |
| **Composable** | shadcn-style compound components; named exports from `@/components/ui` |
| **Trustworthy** | Blue primary, clean neutrals, clear status colors for laundry marketplace |

---

## 2. Colors

### 2.1 Brand & accent

| Token | Light | Usage |
| ----- | ----- | ----- |
| `brand-50` | `#ECF7FF` | Subtle backgrounds, badges |
| `brand-100` | `#D6EBFF` | Hover tints |
| `brand-500` | `#2D7BFF` | **Primary** — CTAs, links, focus ring |
| `brand-600` | `#1F66E0` | Primary hover |
| `brand-700` | `#1854B8` | Primary active |
| `brand-900` | `#0B2E73` | Dark gradients, stats |
| `accent-500` | `#FF7A59` | Highlights (“Most popular”) |
| `accent-600` | `#E8633F` | Accent hover |

### 2.2 Neutrals (surfaces & text)

| Token | Light | Role |
| ----- | ----- | ---- |
| `bg-0` | `#FFFFFF` | Page background |
| `bg-1` | `#F7F8FB` | Muted sections (Gray-50 feel) |
| `bg-2` | `#EEF1F6` | Skeletons, secondary fills |
| `fg-0` | `#0E1320` | Primary text (Gray-900) |
| `fg-1` | `#3B4252` | Body (Gray-600) |
| `fg-2` | `#6B7280` | Captions, placeholders |
| `border` | `#E5E7EB` | Default borders |

### 2.3 Status

| Token | Color | Usage |
| ----- | ----- | ----- |
| `success` | `#16A34A` | Verified, pricing, confirmations |
| `warning` | `#F59E0B` | Alerts, pending |
| `danger` | `#DC2626` | Errors, destructive actions |
| `info` | `#2563EB` | Informational banners |

Each status has a `*-muted` background for badges and banners.

### 2.4 shadcn semantic aliases

Mapped in `tokens.css` for component compatibility:

```
background, foreground, card, primary, secondary, muted, accent,
destructive, border, input, ring, popover
```

**Tailwind usage:** `bg-primary`, `text-muted-foreground`, `ring-ring`, `bg-card`

### 2.5 Contrast

- Body text `fg-0` on `bg-0`: **AAA**
- `fg-1` on `bg-0`: **AA** for normal text
- `brand-500` on white: use for large text / UI chrome; white on `brand-500` for buttons (**AA**)

---

## 3. Typography

**Font:** Inter (`--font-sans`) via root layout.

### Scale (compact — from `tokens.css`)

| Name | Size | Tailwind | Use |
| ---- | ---- | -------- | --- |
| xs | 11px | `text-xs` | Badges, meta, labels |
| sm | 13px | `text-sm` | **Default body**, table cells |
| base | 14px | `text-base` | Emphasized body |
| lg | 16px | `text-lg` | Section titles (marketing) |
| xl | 18px | `text-xl` | **Page titles** (`.page-title`) |
| 2xl | 22px | `text-2xl` | Marketing hero (desktop) |
| 3xl | 26px | `text-3xl` | Large hero only |

`html` stays 16px for accessible form inputs; UI chrome uses the compact scale above.

### Patterns

```tsx
<h1 className="page-title">Orders</h1>
<h2 className="section-title">Recent activity</h2>
<h3 className="card-title">Koramangala hub</h3>
<p className="helper-text">Updated 2 min ago</p>
<p className="text-sm text-muted-foreground">Body copy</p>
```

---

## 4. Spacing

**Base unit:** 4px (`--space-1` = 4px).

| Token | Value | Tailwind alias |
| ----- | ----- | -------------- |
| `--space-1` | 4px | `ds-1` |
| `--space-2` | 8px | `ds-2` |
| `--space-3` | 12px | `ds-3` |
| `--space-4` | 14px | `ds-4` |
| `--space-6` | 20px | `ds-6` |
| `--space-8` | 24px | `ds-8` |
| `--space-12` | 40px | `ds-12` |
| `--space-16` | 48px | `ds-16` |

### Layout conventions

| Context | Spacing |
| ------- | ------- |
| Page container | `max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-5` |
| Marketing section | `py-12 sm:py-14 lg:py-16` |
| Card padding | `p-4` |
| Grid gap | `gap-4` |
| Stack gap | `gap-3`–`gap-4` |
| Form field gap | `gap-2` (label → input) |

---

## 5. Radii & shadows

| Token | Value | Use |
| ----- | ----- | --- |
| `radius-sm` | 6px | Chips |
| `radius-md` | 10px | Inputs (small) |
| `radius-lg` | 10px | Cards, buttons |
| `radius-xl` | 12px | Modals |
| `radius-2xl` | 16px | Hero images (sparingly) |

| Shadow | Use |
| ------ | --- |
| `shadow-soft` | Cards at rest |
| `shadow-pop` | Hover / elevated cards |
| `shadow-modal` | Dialogs |

---

## 6. Motion

| Token | Value |
| ----- | ----- |
| `dur-fast` | 150ms |
| `dur-base` | 220ms |
| `dur-slow` | 360ms |
| `ease-out` | Enter animations |
| `ease-in` | Exit animations |

Respect `prefers-reduced-motion` (see `globals.css`).

---

## 7. Components

All live in `frontend/components/ui/`. Import from barrel:

```tsx
import { Button, Card, CardContent, Input, Label } from '@/components/ui';
```

Built with **class-variance-authority (CVA)** + **Radix UI** + **Tailwind**.

---

### 7.1 Button

**File:** `button.tsx`

| Variant | Use |
| ------- | --- |
| `default` | Primary CTA |
| `destructive` | Delete, cancel order |
| `outline` | Secondary actions |
| `secondary` | Tertiary |
| `ghost` | Toolbar, nav |
| `link` | Inline text actions |
| `success` | Confirmations |

| Size | Height (mobile → desktop) |
| ---- | ------------------------- |
| `default` | 44px → 40px |
| `sm` | 36px |
| `lg` | 48px |
| `icon` | 44px square |

```tsx
<Button>Book pickup</Button>
<Button variant="outline" size="lg">Cancel</Button>
<Button asChild><Link href="/discover">Browse</Link></Button>
```

---

### 7.2 Badge

**File:** `badge.tsx`

Variants: `default` | `secondary` | `outline` | `success` | `warning` | `destructive` | `info`

```tsx
<Badge variant="success">Verified</Badge>
```

---

### 7.3 Card

**File:** `card.tsx`

Compound: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

| `variant` | Use |
| --------- | --- |
| `default` | Standard card |
| `elevated` | Featured content |
| `interactive` | Laundry / service cards (hover lift) |
| `ghost` | Empty states |

```tsx
<Card variant="interactive">
  <CardHeader>
    <CardTitle>Sparkle Laundry</CardTitle>
    <CardDescription>2.1 km away</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter><Button>View services</Button></CardFooter>
</Card>
```

---

### 7.4 Input, Textarea, Select, Label

**Files:** `input.tsx`, `textarea.tsx`, `select.tsx`, `label.tsx`

- Min height **44px** on mobile, **40px** on `sm+`
- `Input` variant `error` for validation
- Always pair `Label` + `htmlFor` + control `id`

```tsx
<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

---

### 7.5 Dialog (Modal)

**File:** `dialog.tsx` · **Radix:** `@radix-ui/react-dialog`

- Centered on `sm+`; max width `sm:max-w-lg`
- Focus trap, ESC close, overlay click
- Built-in close button (`aria-label="Close dialog"`)

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm pickup</DialogTitle>
      <DialogDescription>We'll collect tomorrow at 10 AM.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 7.6 Drawer

**File:** `drawer.tsx` · **Library:** `vaul`

- **Mobile-first:** slides from bottom; drag handle
- Use for filters, cart summary, quick actions on small screens
- Prefer `Dialog` on desktop when a centered modal is clearer

```tsx
<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Filters</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Filter laundries</DrawerTitle>
      <DrawerDescription>Refine your search</DrawerDescription>
    </DrawerHeader>
    {/* form fields */}
    <DrawerFooter>
      <Button>Apply</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

---

### 7.7 Table

**File:** `table.tsx`

Responsive wrapper with horizontal scroll. Use in admin/partner dashboards.

```tsx
<Table>
  <TableCaption>Recent orders</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Order</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>#1042</TableCell>
      <TableCell><Badge variant="success">Delivered</Badge></TableCell>
      <TableCell className="text-right">₹499</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### 7.8 Skeleton

**File:** `skeleton.tsx`

```tsx
<Skeleton className="h-40 w-full rounded-2xl" />
```

---

### 7.9 EmptyState & InfoBanner

**Files:** `empty-state.tsx`, `info-banner.tsx`

Domain-agnostic patterns built on `Card` / tokens.

---

## 8. Responsive breakpoints

| Breakpoint | Min width | Typical use |
| ---------- | --------- | ----------- |
| default | 0 | Mobile layout, 1 column |
| `sm` | 640px | 2 columns, smaller type |
| `md` | 768px | Filters row, side-by-side |
| `lg` | 1024px | 3-col grids, sticky sidebars |
| `xl` | 1280px | 4-col laundry grid |
| `2xl` | 1440px | Max container width |

**Container:** `container` class → centered, responsive padding.

---

## 9. Accessibility checklist

- [ ] All interactive elements keyboard-focusable
- [ ] Visible `focus-visible:ring-2 ring-ring` (global + per component)
- [ ] Form fields have associated `<Label htmlFor="...">`
- [ ] Icons decorative → `aria-hidden`; meaningful → `aria-label`
- [ ] Dialogs: `DialogTitle` + `DialogDescription` required
- [ ] Loading: `role="status"` + `aria-label` or `sr-only` text
- [ ] Color not sole indicator (pair with text/icons)
- [ ] Touch targets ≥ 44×44px on mobile (`Button` default, `Input` min-height)
- [ ] `eslint-plugin-jsx-a11y` enabled in CI

---

## 10. Dark mode

Toggle via `next-themes` (`class` strategy on `<html>`).

All tokens redefined under `.dark { ... }` in `tokens.css`. Components use semantic colors (`bg-background`, `text-foreground`) so they adapt automatically.

---

## 11. File reference

```
frontend/
├── styles/tokens.css          # CSS variables (source of truth)
├── tailwind.config.ts         # Tailwind theme extension
├── app/globals.css            # Base layer, focus, reduced motion
└── components/ui/
    ├── index.ts               # Barrel exports
    ├── button.tsx
    ├── badge.tsx
    ├── card.tsx
    ├── input.tsx
    ├── textarea.tsx
    ├── select.tsx
    ├── label.tsx
    ├── dialog.tsx
    ├── drawer.tsx
    ├── table.tsx
    ├── skeleton.tsx
    ├── empty-state.tsx
    └── info-banner.tsx
```

---

## 12. Dependencies

| Package | Purpose |
| ------- | ------- |
| `tailwindcss` | Utility CSS |
| `class-variance-authority` | Variant API |
| `clsx` + `tailwind-merge` | `cn()` helper |
| `@radix-ui/react-dialog` | Accessible modals |
| `@radix-ui/react-label` | Label association |
| `@radix-ui/react-slot` | `asChild` composition |
| `vaul` | Mobile drawers |
| `lucide-react` | Icons |

---

## 13. Usage rules (for contributors)

1. **Do not** add new colors outside `tokens.css`.
2. **Do not** duplicate button/card styles in features — extend variants via CVA if needed.
3. **Prefer** `@/components/ui` over raw HTML for interactive UI.
4. **Use** `Dialog` for desktop confirmations; `Drawer` for mobile panels.
5. **Use** `Card variant="interactive"` for clickable marketplace tiles.
6. **Import** from `@/components/ui` barrel, not deep paths (unless tree-shaking requires).

---

## 14. Related docs

- `PROJECT_STRUCTURE.md` — App architecture
- `.cursor/rules/13-ui-ux.md` — UX rules
- `frontend/styles/tokens.css` — Token source
- `docs/ui-ux/design-system.md` — (optional mirror in docs/)

---

*End of design system specification.*
