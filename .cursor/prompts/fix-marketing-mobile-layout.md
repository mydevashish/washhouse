# Prompt: Fix marketing mobile layout & overlapping CTAs

Act as **responsive-layout-engineer** + **ui-ux-designer**.

## Problem

On mobile viewports the marketing homepage has layout friction:

- Sticky bottom CTA (WhatsApp + Call) can overlap section content
- Floating phone FAB may collide with sticky CTA or hero buttons
- "Why Choose Us" and other sections may clip at bottom above sticky bar
- Service carousel shows ~1.2 cards — verify snap scroll and tap targets
- Hero mobile CTAs duplicate carousel CTAs

## Your task

1. Read `frontend/components/marketing/mobile-sticky-cta.tsx`, `floating-contact-actions.tsx`, `marketing-shell-overlays.tsx`.
2. Test `/` at **390×844** in Chrome DevTools — scroll full page.
3. Fix overlap using existing `data-marketing-bottom-cta` pattern on final CTA band.
4. Ensure `min-h-11` tap targets on all mobile buttons/links.
5. Add bottom padding to main content so last sections aren't hidden behind sticky CTA.
6. Verify hamburger menu: body scroll lock, focus trap, closes on navigate.
7. Check dark mode: glass cards readable on gradients (`why-choose-section`, hero).
8. Run `npm run test:e2e -- marketing-homepage` and axe: `marketing-a11y`.

## Files likely touched

- `frontend/components/layout/marketing-shell.tsx`
- `frontend/components/marketing/mobile-sticky-cta.tsx`
- `frontend/components/marketing/floating-contact-actions.tsx`
- `frontend/features/marketing/home/home-hero.tsx`
- `frontend/features/marketing/home/final-cta-band.tsx`

## Done when

- No content permanently hidden behind fixed CTAs
- FAB hides when sticky CTA or final CTA is in view
- No horizontal scroll on mobile
- Playwright marketing specs pass
