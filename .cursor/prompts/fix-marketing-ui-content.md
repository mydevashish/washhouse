# Prompt: Fix marketing homepage text & placeholders

Act as **frontend-architect** + **ui-ux-designer**.

## Problem

The WashHouse marketing site (`/`, `/contact`, footer) still shows placeholder or inconsistent copy:

- Footer address showed `[Street address placeholder]` (fix via env or `contact-constants.ts`)
- Phone/WhatsApp default to `+91 98765 43210` until `NEXT_PUBLIC_*` env vars are set
- Stats band used "DLM by the numbers" while customer-facing brand is **The WashHouse Laundry & Dryclean**
- Testimonials fallback may say "DLM" instead of WashHouse
- Privacy policy has legal placeholders (`privacy-content.tsx`)
- "Download brochure" links to contact form, not a PDF

## Your task

1. Read `docs/features/marketing-homepage.md`, `.cursor/rules/13-ui-ux.md`, `frontend/features/marketing/contact/contact-constants.ts`.
2. Audit all marketing pages for placeholder text, brand inconsistency (DLM vs WashHouse), and broken expectations.
3. Fix copy to use **WashHouse** for customers; reserve **DLM** for internal/technical docs only.
4. Set sensible non-placeholder defaults OR document required env vars in `frontend/.env.example`.
5. Update `frontend/.env.local` example values (do not commit secrets):
   - `NEXT_PUBLIC_SUPPORT_PHONE`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
   - `NEXT_PUBLIC_OFFICE_ADDRESS`
   - Social URLs if real accounts exist
6. Rename "Download brochure" → "Request brochure" OR wire a real PDF in `public/`.
7. Run Playwright: `npm run test:e2e -- marketing-homepage marketing-a11y`
8. Manual QA on mobile (390×844) + desktop: footer contact block, hero subcopy, stats labels.

## Files likely touched

- `frontend/features/marketing/contact/contact-constants.ts`
- `frontend/features/marketing/home/stats-band.tsx`
- `frontend/features/marketing/testimonials/testimonials-fallback.ts`
- `frontend/features/marketing/legal/privacy-content.tsx`
- `frontend/features/marketing/home/franchise-teaser.tsx`
- `frontend/.env.example`

## Done when

- No `[placeholder]` strings visible on `/` or `/contact`
- Brand name consistent on homepage
- Env vars documented for production setup
