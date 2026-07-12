---
description: WCAG 2.1 AA accessibility baseline
globs: frontend/**
alwaysApply: false
---

# Accessibility (A11y) Rules

Target: **WCAG 2.1 Level AA**. Aspirational: AAA where painless.

## Foundations

1. **Semantic HTML first.** Use `<button>` for buttons, `<nav>` for nav, `<main>` for main, etc.
2. **Every interactive element has an accessible name** — visible text, `aria-label`, or `aria-labelledby`.
3. **All images have `alt`.** Decorative images use `alt=""`.
4. **Color is never the only signal.** Pair with icons, text, or patterns.
5. **Forms are labeled.** Every input has a `<label>` (or `aria-label`).
6. **Focus is always visible.** Don't `outline: none` without a custom focus ring.
7. **Keyboard fully supported.** No mouse-only flows.
8. **Reduced motion respected** via `prefers-reduced-motion`.

## Color contrast

| Content                          | Min ratio                |
| -------------------------------- | ------------------------ |
| Normal text                      | 4.5:1                    |
| Large text (≥ 18pt or 14pt bold) | 3:1                      |
| UI components / graphic objects  | 3:1                      |
| Disabled states                  | No min, but ≥ 3:1 ideal  |

Use the design tokens defined in `frontend/styles/tokens.css`. Audited in Storybook + Chromatic.

## Focus management

- Skip-to-content link as the first focusable element on every page.
- Modal traps focus; ESC closes.
- After navigation, focus moves to the page heading (`<h1>` with `tabindex="-1"` programmatically focused).
- Don't autofocus inputs on page load (annoys screen readers and mobile users).

## Headings

- One `<h1>` per page.
- Don't skip levels (`<h1>` → `<h3>` is wrong).
- Headings describe content, not styling.

## Forms

- `<label htmlFor>` always.
- Error messages: `aria-invalid="true"` + `aria-describedby` pointing to the message.
- Group related fields in `<fieldset>` + `<legend>`.
- Required inputs marked with `aria-required` and visually.
- Inline validation announced via `aria-live="polite"`.

## ARIA

- Use ARIA **only when native HTML can't**.
- Never set `role="button"` on a `<div>` if a `<button>` will do.
- Common patterns we use:
  - `aria-live="polite"` for toast and loading state announcements
  - `role="dialog" aria-modal="true"` for shadcn `Dialog`
  - `role="status"` for skeletons and progress
  - `aria-expanded` on disclosure triggers
  - `aria-current="page"` on active nav item

## Motion

- Respect `prefers-reduced-motion: reduce`:
  - Disable parallax, autoplay video, large transforms.
  - Replace with crossfades ≤ 200 ms.
- Never use motion to convey meaning (status changes must also be visible without motion).

## R3F / 3D

- 3D scenes must have a non-3D fallback for screen readers + reduced motion users.
- Provide an `aria-label` describing the scene.
- Don't lock scroll for 3D effects.

## Images & media

- Decorative: `alt=""`.
- Informative: short, meaningful `alt`.
- Complex (chart, infographic): short `alt` + linked long description.
- Video: captions + transcript.
- Audio: transcript.

## Tables

- `<table>` for tabular data only.
- `<th scope="col">` / `<th scope="row">`.
- Provide `<caption>` if the table needs context.

## Keyboard shortcuts

- Documented in `/help` page.
- Use `?` to open shortcut palette.
- Don't override OS / browser shortcuts.

## Testing

| Tool                            | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `@axe-core/playwright`          | Automated a11y scans in E2E              |
| `eslint-plugin-jsx-a11y`        | Lint-time rules                          |
| Manual keyboard testing         | Every PR with UI changes                 |
| Screen reader sweeps            | VoiceOver / NVDA before each release     |
| Storybook a11y addon            | Per-component audits                     |

## Mandatory before merge

- ✅ ESLint a11y plugin passes
- ✅ Axe scan passes on changed routes
- ✅ Keyboard-only walkthrough recorded for new interactive flows
- ✅ Contrast checked against design tokens
- ✅ Reduced-motion path verified

## Common violations to avoid

❌ `<div onClick>` instead of `<button>`
❌ Placeholder used as label
❌ Color-only error indication
❌ Missing `alt` on `<Image>` / `<img>`
❌ Custom dropdowns without `role` + keyboard support
❌ Modals without focus trap
❌ Carousels that auto-advance (or no pause control)
❌ Tooltips that are mouse-only
