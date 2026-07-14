# Prompt: Marketing site production-ready polish (master)

Act as **product-manager** orchestrating **frontend-architect**, **ui-ux-designer**, **accessibility-reviewer**, and **qa-engineer**.

## Goal

Ship a **production-ready** WashHouse marketing site: correct copy, distinct images, readable typography, obvious partner/admin login, mobile layout without overlap, and green automated tests.

## Context

- Feature spec: `docs/features/marketing-homepage.md`
- Route: `/` and marketing shell pages (`/services`, `/about`, `/franchise`, `/contact`, `/staff`, `/stores`, `/terms`, `/privacy`)
- Brand: **The WashHouse Laundry & Dryclean** (customer-facing); reserve **DLM** for legal/internal docs only
- Known gaps (2026-07-13):
  - Placeholder phone `+91 98765 43210` until env vars set
  - Duplicate hero images (`compare` and `partner` share same Unsplash ID in `laundry-images.ts`)
  - Testimonials fallback mentions "DLM"
  - Privacy/terms have `(placeholder)` entity blocks
  - Lighthouse mobile performance ~53 (LCP 3.7s) — images + JS budget
  - Partner/admin login buried in footer; `/staff` exists but not in navbar

## Execution order (run as separate Cursor tasks or one long session)

### Phase 1 — Content & brand (`fix-marketing-ui-content.md`)

Paste and run: `.cursor/prompts/fix-marketing-ui-content.md`

- Remove all `[placeholder]` and fake contact defaults for production
- Set `frontend/.env.example` with required `NEXT_PUBLIC_*` vars
- Fix DLM → WashHouse in testimonials fallback and customer copy

### Phase 2 — Images (`fix-marketing-images.md`)

Paste and run: `.cursor/prompts/fix-marketing-images.md`

- Unique image per hero slide and service card
- Verify no 404 Unsplash URLs in Network tab
- Prefer `public/marketing/*.webp` for hero LCP if available

### Phase 3 — Typography & contrast (`fix-marketing-typography-contrast.md`)

Paste and run: `.cursor/prompts/fix-marketing-typography-contrast.md`

- WCAG AA in light + dark on all sections
- Navbar readable over hero

### Phase 4 — Mobile layout (`fix-marketing-mobile-layout.md`)

Paste and run: `.cursor/prompts/fix-marketing-mobile-layout.md`

- No content hidden behind sticky CTA / FAB
- Bottom padding on main content

### Phase 5 — Partner / Admin login (`add-marketing-partner-admin-login.md`)

Paste and run: `.cursor/prompts/add-marketing-partner-admin-login.md`

- Navbar Staff login → `/staff`
- Optional homepage partner strip

### Phase 6 — Production env & QA

1. Configure production env (Vercel / hosting):
   ```
   NEXT_PUBLIC_SUPPORT_PHONE=
   NEXT_PUBLIC_WHATSAPP_NUMBER=
   NEXT_PUBLIC_SUPPORT_EMAIL=
   NEXT_PUBLIC_OFFICE_ADDRESS=
   NEXT_PUBLIC_API_URL=
   ```
2. Run full test matrix:
   ```bash
   cd frontend && npm run test:e2e -- marketing-homepage marketing-a11y
   cd frontend && npm test -- home-hero
   cd backend && pytest tests/api/test_marketing.py
   ```
3. Manual QA per `docs/features/marketing-homepage.md` checklist (phone, tablet, desktop × light, dark).
4. Optional Lighthouse on staging URL — target: a11y ≥90, performance improve toward ≥70 mobile (document result in feature spec).

## Rules to follow

- `.cursor/rules/13-ui-ux.md`, `10-accessibility.md`, `19-responsive-design.md`, `11-performance.md`
- Minimize scope — no unrelated refactors
- Do not commit `.env.local` or secrets

## Done when (production checklist)

- [ ] No placeholder strings visible on any marketing page
- [ ] Real phone, WhatsApp, address from env in prod
- [ ] All hero slides and service images distinct and loading
- [ ] Text readable in light + dark (manual + axe pass)
- [ ] Staff / Laundry / Admin login reachable from navbar
- [ ] Mobile: no CTA overlap, no horizontal scroll
- [ ] Playwright `marketing-homepage` + `marketing-a11y` green
- [ ] Backend `test_marketing.py` green
- [ ] `docs/features/marketing-homepage.md` updated with any new sections
