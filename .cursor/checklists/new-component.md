# New Component Checklist

## Design

- [ ] Single responsibility
- [ ] Correct tier (atom / molecule / organism)
- [ ] Variants enumerated (TS union)
- [ ] States planned (hover / focus / active / disabled / loading / error / empty)
- [ ] Dark variant
- [ ] Mobile + desktop layout

## Implementation

- [ ] Tokens used (no hardcoded colors)
- [ ] Tailwind utilities only (no inline styles unless necessary)
- [ ] Named export
- [ ] `forwardRef` if it accepts a ref
- [ ] Props typed; no `any`
- [ ] `cn()` for class merging
- [ ] `'use client'` only if needed (state / effects / events)

## Accessibility

- [ ] Semantic HTML
- [ ] Accessible name on interactive elements
- [ ] Keyboard-operable
- [ ] Focus visible (`focus-visible:`)
- [ ] `aria-*` only when native HTML can't

## Motion

- [ ] Reduced-motion respected
- [ ] Transform/opacity only
- [ ] Off-screen pause (if continuous)

## Tests

- [ ] Renders
- [ ] Variants visually distinct (assertion or visual snapshot)
- [ ] Interaction (click / type / focus)
- [ ] Keyboard test
- [ ] A11y assertion (role + name)

## Storybook (atoms)

- [ ] Story added with variants
- [ ] Storybook a11y addon clean

## Files

- [ ] `components/ui/<name>.tsx` (or feature path)
- [ ] `components/ui/<name>.test.tsx`
- [ ] `components/ui/<name>.stories.tsx` (atoms only)
