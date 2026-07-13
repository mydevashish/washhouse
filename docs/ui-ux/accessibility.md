# Accessibility Guidelines

Target: **WCAG 2.1 AA**. Tested via automated + manual checks.

## Tools

- `eslint-plugin-jsx-a11y` (lint)
- `@axe-core/playwright` (E2E)
- `@axe-core/react` (dev runtime)
- VoiceOver / NVDA (manual)

## Common patterns

| Concern            | Pattern                                          |
| ------------------ | ------------------------------------------------ |
| Icon-only button   | `aria-label="Cancel"`                            |
| Form errors        | `aria-live="polite"` + `aria-describedby` + `aria-invalid` |
| Modal              | shadcn `Dialog` (focus trap + ESC)               |
| Toast              | sonner (`aria-live`)                             |
| Disclosure         | `aria-expanded` on trigger                       |
| Active nav item    | `aria-current="page"`                            |
| Skeleton           | `role="status"` + `<span class="sr-only">Loading…</span>` |
| Carousel slide     | `aria-hidden` + `inert` on inactive slides; move section `aria-labelledby` id to the active slide heading |
| Responsive carousel + grid | One variant visible via `hidden` / `lg:grid` — never wrap `<li>` in animation `<div>`; put motion inside `<li>` |
| FAB vs bottom CTAs | `IntersectionObserver` on `[data-marketing-sticky-cta]` / `[data-marketing-bottom-cta]`; hide with `inert` + `aria-hidden` (not opacity alone) |
| Horizontal scroll strip | `tabIndex={0}` + `focus-visible:ring-*` on scroll container |
| Glass hero copy    | Use `GlassSurface variant="strong"`; body text uses token `text-foreground` / `text-muted-foreground` (audited on opaque card mix) |

## Contrast minimums

- Body text ≥ 4.5:1
- UI components + focus indicators ≥ 3:1

## Keyboard

- Tab + Shift+Tab navigate
- Enter / Space activate
- Arrow keys for menus
- Escape closes overlays
- No keyboard traps (except modal focus traps)

## Reduced motion

- Detect via `prefers-reduced-motion: reduce`
- Use `useReducedMotion()` from Framer Motion
- Replace large transforms with crossfades ≤ 200 ms
- Disable parallax + auto-playing media

## Forms

- `<label htmlFor>` always
- `autoComplete` set
- `inputMode` for mobile
- Error messages linked + announced

See `.cursor/rules/10-accessibility.md` and `.cursor/checklists/accessibility.md`.
