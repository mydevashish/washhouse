# Frontend Architecture

## Philosophy

- **Server Components by default** (Next.js 15 App Router)
- **Feature-based** organization (`features/<feature>/`)
- **Atomic UI tiers** — atoms in `components/ui/`, molecules in `components/shared/`, organisms inside features
- **Server data via TanStack Query**, client state via Zustand, forms via RHF + Zod, URL state via `searchParams`

## Folder map

```
frontend/
├── app/                    # Routes (thin)
│   ├── (marketing)/        # Public landing
│   ├── (auth)/             # Login / register
│   ├── (customer)/         # Customer area
│   ├── (partner)/          # Partner area
│   ├── (admin)/            # Admin area
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                 # shadcn primitives
│   ├── layout/             # header, footer, sidebar, mobile-nav
│   └── shared/             # cross-feature molecules
├── features/
│   ├── landing/            # R3F hero lives here only
│   ├── auth/
│   ├── orders/
│   ├── laundries/
│   ├── payments/
│   ├── reviews/
│   ├── subscriptions/
│   ├── notifications/
│   ├── partner-dashboard/
│   └── admin-dashboard/
├── hooks/                  # cross-feature hooks
├── lib/                    # api, env, logger, motion, utils
├── providers/              # Query, Theme, Auth
├── services/               # external SDK wrappers
├── store/                  # global Zustand (auth, ui, theme)
├── styles/                 # tokens.css
├── types/                  # global types
├── utils/                  # pure helpers
├── public/
└── tests/                  # unit + e2e
```

## Routing patterns

- Route groups: `(marketing)`, `(auth)`, `(customer)`, `(partner)`, `(admin)`
- Layouts per group hold shared chrome
- `loading.tsx` + `error.tsx` per group (and per-route if needed)

## Component tiers

| Tier         | Lives in                          | Examples                       |
| ------------ | --------------------------------- | ------------------------------ |
| **Atom**     | `components/ui/`                  | `Button`, `Input`, `Badge`     |
| **Molecule** | `components/shared/`              | `SearchBar`, `RatingDisplay`   |
| **Organism** | `features/<f>/components/`        | `OrderCard`, `OrderForm`       |
| **Template** | `app/**/layout.tsx`               | Dashboard shells               |
| **Page**     | `app/**/page.tsx`                 | Route entries                  |

## State

| Kind             | Tool                 |
| ---------------- | -------------------- |
| Server data      | TanStack Query       |
| Form state       | RHF + Zod            |
| URL state        | `searchParams`       |
| Local UI         | `useState`           |
| Global UI        | Zustand              |

## API layer

- One axios instance in `lib/api.ts`
- Auth interceptor reads access token from Zustand
- 401 → attempt refresh once → otherwise force logout
- Typed responses: `ApiEnvelope<T>` + `ApiError`
- Per-feature `api/queries.ts` + `api/mutations.ts`

## Performance

- Lighthouse mobile ≥ 90
- LCP image `priority`
- `dynamic(... , { ssr: false })` for heavy widgets / R3F
- Virtualize lists > 50
- Tree-shake icons / dates / motion

## Accessibility

- WCAG 2.1 AA
- ESLint a11y plugin + axe-playwright
- Keyboard sweep per UI PR
- Focus management on route change

## Related

- `.cursor/agents/frontend-architect.md`
- `.cursor/agents/ui-ux-designer.md`
- `.cursor/rules/13-ui-ux.md`
- `.cursor/rules/14-state-management.md`
