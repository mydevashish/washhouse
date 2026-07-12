# Accessibility Checklist (WCAG 2.1 AA)

Run for any UI change.

## Semantic HTML

- [ ] Buttons are `<button>`, links are `<a href>`
- [ ] Inputs have `<label htmlFor>`
- [ ] One `<h1>` per page; no skipped heading levels
- [ ] Landmarks present: `<header>`, `<main>`, `<nav>`, `<footer>`

## Accessible name

- [ ] Every interactive element has a name (visible text or `aria-label`)
- [ ] Icon-only buttons have `aria-label`

## Color & contrast

- [ ] Body text ≥ 4.5:1
- [ ] UI components ≥ 3:1
- [ ] Color is never the only signal

## Focus

- [ ] Focus ring visible on all interactive elements
- [ ] Focus order matches visual order
- [ ] Modals trap focus + ESC closes
- [ ] No autofocus on page load (annoys SR)

## Keyboard

- [ ] All flows operable with keyboard
- [ ] Enter / Space activate buttons
- [ ] Arrow keys for menus / lists
- [ ] No keyboard traps

## Forms

- [ ] Labels associated
- [ ] Errors announced (`aria-live="polite"`)
- [ ] Errors linked (`aria-describedby`)
- [ ] `aria-invalid` on errored inputs
- [ ] `autoComplete` set appropriately
- [ ] `inputMode` appropriate for mobile

## Motion

- [ ] `prefers-reduced-motion` respected
- [ ] No auto-playing media without controls
- [ ] No motion-only signals

## Images / media

- [ ] All images have `alt`
- [ ] Decorative images have `alt=""`
- [ ] Video has captions; audio has transcript

## Mobile

- [ ] Tap targets ≥ 44 × 44 px
- [ ] No essential content behind hover

## Automated checks

- [ ] ESLint `jsx-a11y` passes
- [ ] `@axe-core/playwright` scan: no critical / serious violations

## Manual checks

- [ ] Keyboard sweep on changed routes
- [ ] Screen-reader sanity check (VoiceOver / NVDA) for new patterns
