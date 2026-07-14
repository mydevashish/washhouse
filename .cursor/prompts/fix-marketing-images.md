# Prompt: Fix marketing homepage images

Act as **frontend-architect** + **animation-specialist** (for hero carousel).

## Problem

Marketing images use generic Unsplash stock with issues:

- Welcome hero and franchise hero shared the same image (`photo-1558618666-fcd25c85cd64`)
- Service cards repeat the same laundry photo across multiple services
- Some Unsplash IDs were previously 404 (see comment in `laundry-images.ts`)
- Hero carousel is client-only (`ssr: false`) — verify LCP/fallback on slow networks
- Lighthouse mobile performance ~53 (LCP 3.7s) — images are a factor

## Your task

1. Read `frontend/features/marketing/home/hero-slides.ts`, `services-data.ts`, `laundry-images.ts`, `next.config.mjs`.
2. Assign **unique, relevant** images per hero slide and per service card (verified Unsplash IDs or owned assets in `public/marketing/`).
3. Ensure each `imageAlt` accurately describes the photo (accessibility).
4. Deduplicate: no two adjacent carousel slides should use the same image.
5. Prefer `public/marketing/*.webp` for hero LCP if adding owned brand photography.
6. Keep `images.unsplash.com` in `next.config.mjs` remote patterns if still using CDN.
7. Verify `object-cover` crops look good on mobile (390px) and desktop (1280px) — no cut-off faces or wrong aspect ratios.
8. Run visual check on `/` all 4 carousel slides + services grid.
9. Optional: reduce first-load JS by lazy-loading below-fold marketing sections.

## Image map (target)

| Section | File | Requirement |
| ------- | ---- | ----------- |
| Hero welcome | `hero-slides.ts` | Folded fresh laundry |
| Hero services | `hero-slides.ts` | Professional facility |
| Hero franchise | `hero-slides.ts` | Partner/shop owner (different from welcome) |
| Hero delivery | `hero-slides.ts` | Van/pickup + phone mock |
| Services grid | `services-data.ts` | 7 unique images matching each service |

## Done when

- All hero slides visually distinct
- Service cards have appropriate unique images
- No broken images in Network tab
- Alt text matches content
