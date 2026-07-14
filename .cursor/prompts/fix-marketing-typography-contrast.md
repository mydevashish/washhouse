# Prompt: Fix marketing typography, font colors & contrast (production)

Act as **frontend-architect** + **accessibility-reviewer** + **ui-ux-designer**.

## Problem

On the WashHouse marketing site (`/`, `/services`, `/about`, `/franchise`, `/contact`, `/staff`) some text is hard to read:

- Glass cards (`GlassSurface`) over gradients can show low-contrast `text-muted-foreground` in **dark mode** (hero, how-it-works, why-choose, stats band).
- Navbar links use `text-muted-foreground` on a transparent header over bright hero images — can fail WCAG AA on some slides.
- `text-on-hero-muted` (`rgb(255 255 255 / 0.85)`) on brand gradients may be borderline on low-end Android screens.
- Compact token scale (`--text-sm: 13px`) makes small labels (hero pills, promo fine print) hard to read on mobile.
- Success/outline CTA buttons (`text-success` on light backgrounds) need verified contrast in both themes.

## Your task

1. Read `.cursor/rules/10-accessibility.md`, `.cursor/rules/13-ui-ux.md`, `frontend/styles/tokens.css`, `frontend/features/marketing/shared/marketing-layout.ts`, `frontend/styles/glass.css`.
2. Audit **every marketing section** at these viewports in **light + dark** mode:
   - Phone 390×844
   - Tablet 768×1024
   - Desktop 1280×800
3. Fix contrast using **semantic tokens** — do not hardcode one-off hex colors:
   - Prefer `text-foreground` for primary copy on glass cards.
   - Use `GLASS_MOBILE_SOLID_CARD`, `GLASS_MOBILE_ON_DARK`, `GLASS_MOBILE_ON_BRAND` fallbacks where backdrop-blur hurts readability.
   - Ensure stats band labels use `text-on-hero` / `text-on-hero-muted` only on `bg-brand-*` gradients with solid mobile fallback.
4. Navbar: when `scrolled === false` over hero, ensure nav link text meets **4.5:1** (e.g. subtle scrim, `text-foreground/90`, or always-on `glass-surface--subtle`).
5. Hero carousel: verify headline (`MARKETING_HERO_HEADLINE`), pills, trust items, and promo badge are readable on every slide background.
6. Bump minimum marketing body copy to **14px effective** on mobile where currently `text-xs` (11px) is used for meaningful content (not legal fine print).
7. Add or extend Playwright a11y assertions if gaps found: `frontend/tests/e2e/marketing-a11y.spec.ts`.
8. Run:
   ```bash
   cd frontend && npm run test:e2e -- marketing-a11y
   ```
9. Document any token tweaks in `frontend/styles/tokens.css` with a one-line comment (WCAG rationale).

## Files likely touched

- `frontend/features/marketing/shared/marketing-layout.ts`
- `frontend/components/layout/global-navbar/marketing-navbar.tsx`
- `frontend/features/marketing/home/hero-carousel.tsx`
- `frontend/features/marketing/home/stats-band.tsx`
- `frontend/features/marketing/home/why-choose-section.tsx`
- `frontend/features/marketing/home/how-it-works-section.tsx`
- `frontend/components/ui/glass-surface.tsx`
- `frontend/app/globals.css` (`.text-on-hero-muted` only if needed)
- `frontend/tests/e2e/marketing-a11y.spec.ts`

## Done when

- No marketing section has body text below WCAG AA contrast (4.5:1 normal, 3:1 large text) in light **and** dark mode.
- Navbar links readable on hero slide 1 at top of page (not only when scrolled).
- `marketing-a11y` Playwright suite passes.
- Manual QA checklist in `docs/features/marketing-homepage.md` dark-mode items checked off.
