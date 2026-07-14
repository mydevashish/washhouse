# Prompt: Add Laundry / Admin login entry on marketing site

Act as **frontend-architect** + **ui-ux-designer**.

## Problem

Laundry partners and platform admins need an obvious way to sign in from the public marketing site. Today:

- `/staff` page exists with Laundry + Admin cards → `/login?audience=partner` and `/login?audience=admin`
- Footer group "Partners & Staff" has links but they are easy to miss
- **Marketing navbar** has no Staff / Login entry — partners hunt for the footer
- Login audience copy already works (`frontend/lib/auth-login-audience.ts`)

## Your task

1. Read `frontend/app/staff/page.tsx`, `frontend/lib/auth-login-audience.ts`, `frontend/lib/navigation/marketing-nav.ts`, `frontend/lib/navigation/marketing-footer.ts`, `frontend/components/layout/global-navbar/marketing-navbar.tsx`.
2. Add a clear **"Staff login"** (or "Partner login") entry in the marketing navbar:
   - **Desktop:** text link or ghost button → `/staff` (preferred) OR dropdown with "Laundry login" + "Admin login".
   - **Mobile hamburger:** same links above Book Now / Call, with `min-h-11` tap targets.
   - Do **not** clutter primary CTAs — use `variant="ghost"` or muted link style.
3. Optionally add a compact **"For laundry partners"** strip on homepage (between franchise teaser and final CTA) with:
   - Short copy: "Already a partner? Sign in to your dashboard."
   - Buttons: "Laundry login" → `/login?audience=partner`, "Admin login" → `/login?audience=admin`, "Staff portal" → `/staff`
   - Reuse `MarketingSection` + `MarketingGlassCard` patterns; match existing franchise teaser styling.
4. Ensure `/staff` page:
   - Uses `text-foreground` / `text-muted-foreground` with good contrast (see `fix-marketing-typography-contrast.md`).
   - Has correct metadata for SEO (`Staff portal — The WashHouse…`).
5. Verify login flow after changes:
   - `/login?audience=partner` → email/password only, redirects to `/partner` on success
   - `/login?audience=admin` → email/password only, redirects to `/admin` on success
   - Wrong role shows appropriate error (existing auth behavior)
6. Add Playwright coverage in `frontend/tests/e2e/marketing-homepage.spec.ts`:
   - Navbar (or mobile menu) contains link to `/staff` or partner login
   - `/staff` renders both portal cards with working hrefs
7. Update `docs/features/marketing-homepage.md` section map if homepage strip added.

## Files likely touched

- `frontend/lib/navigation/marketing-nav.ts` (optional `MARKETING_STAFF_HREF`)
- `frontend/components/layout/global-navbar/marketing-navbar.tsx`
- `frontend/features/marketing/home/marketing-homepage.tsx` (optional partner strip)
- `frontend/app/staff/page.tsx` (polish only)
- `frontend/tests/e2e/marketing-homepage.spec.ts`
- `docs/features/marketing-homepage.md`

## Copy guidance

| Surface | Label | Href |
| ------- | ----- | ---- |
| Navbar | Staff login | `/staff` |
| Staff page card | Laundry login | `/login?audience=partner` |
| Staff page card | Admin login | `/login?audience=admin` |
| Footer (keep) | Laundry Login / Admin Login | same as above |

Use **WashHouse** branding; avoid "DLM" in customer-facing UI.

## Done when

- A partner or admin can reach login in **≤2 taps** from homepage (navbar or obvious section).
- `/staff` and audience login pages work on mobile and desktop.
- Playwright marketing-homepage spec passes.
- No duplicate conflicting login links in hero CTAs.
