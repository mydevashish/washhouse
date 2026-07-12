# New Page Checklist

## Routing

- [ ] Page placed under correct route group (e.g., `(customer)`, `(partner)`, `(admin)`)
- [ ] Route uses `kebab-case`
- [ ] Metadata exported (`title`, `description`, `openGraph`)
- [ ] `loading.tsx` present
- [ ] `error.tsx` present
- [ ] `not-found.tsx` (if applicable)

## Composition

- [ ] Page is a thin shell; logic lives in `frontend/features/<feature>/`
- [ ] Server Component by default
- [ ] Data fetched server-side where possible (RSC)
- [ ] Client islands only where interactivity is needed

## States

- [ ] Loading skeleton above the fold
- [ ] Empty state with CTA
- [ ] Error state with retry + support link

## Layout

- [ ] Container respects max width (`max-w-screen-xl`)
- [ ] Mobile-first (`px-4` → `sm:px-6` → `lg:px-8`)
- [ ] Bottom action bar on mobile (if primary CTA)

## Performance

- [ ] LCP image has `priority`
- [ ] Heavy widgets `dynamic` imported
- [ ] No new big dependencies
- [ ] Lighthouse mobile ≥ 90

## Accessibility

- [ ] One `<h1>`
- [ ] Skip-to-content link works
- [ ] Focus order matches visual order

## Testing

- [ ] Playwright happy path
- [ ] Axe scan clean
- [ ] Mobile viewport test (375 px)
