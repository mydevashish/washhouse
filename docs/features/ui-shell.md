# Feature: Base UI shell

> Status: planned  
> Owner: ui-ux-designer + frontend-architect  
> Last updated: 2026-06-01

## Problem

App needs consistent navigation, dark mode, and mobile-first layout across customer/partner/admin areas.

## Goals

- [ ] Header with logo, nav, auth menu
- [ ] Mobile bottom nav for customer `(app)` routes
- [ ] Footer on marketing pages
- [ ] Dark mode via `next-themes`
- [ ] PWA icons `icon-192.png`, `icon-512.png`

## Frontend surface

- `frontend/components/layout/` — Header, Footer, MobileNav, AppShell
- `frontend/app/(app)/layout.tsx`, `(partner)/`, `(admin)/`
- `frontend/styles/tokens.css`, design system in `docs/ui-ux/design-system.md`

## Non-goals

- R3F on app shell (landing only)

## Acceptance criteria

- [ ] Touch targets ≥ 44px
- [ ] Works 320px–1440px
- [ ] `prefers-reduced-motion` respected
