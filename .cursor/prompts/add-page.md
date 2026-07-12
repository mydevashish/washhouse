# Prompt: Add a Next.js page

Act as **frontend-architect** delegating to **responsive-layout-engineer**.

Page: **<route>**
Persona: **<customer | partner | admin | marketing>**
Purpose: **<one line>**

## Steps

1. Read `.cursor/rules/13-ui-ux.md`, `.cursor/rules/19-responsive-design.md`.
2. Run `.cursor/checklists/pre-flight.md`.
3. Place under correct route group (`(customer)`, `(partner)`, `(admin)`, `(marketing)`).
4. Use `.cursor/templates/react-page.tsx`.
5. Server Component by default; mark `'use client'` only on islands.
6. Add `metadata` export.
7. Add `loading.tsx` and `error.tsx`.
8. Compose `frontend/features/<feature>/` components.
9. Mobile-first layout; bottom CTA on mobile if applicable.
10. Lighthouse mobile ≥ 90.
11. Tests:
    - Playwright happy path
    - Axe scan
    - Mobile viewport (375 px)
12. Update `logs/implementation-log.md`.
13. Run `.cursor/checklists/new-page.md` + `post-flight.md`.

Confirm the persona / route group, then proceed.
