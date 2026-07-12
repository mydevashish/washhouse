# DLM — Production Architecture & Project Structure

> **Status:** Architecture specification (target state + current inventory).  
> **Do not implement from this doc until approved.** Code changes follow phased migration in §12.  
> **Last updated:** 2026-06-02

---

## 1. Purpose

This document defines the **production-grade architecture** for **DLM (Doorstep Laundry Marketplace)** — a monorepo with:

| Stack | Role |
| ----- | ---- |
| **Next.js 15 (App Router)** | Customer, partner, and admin web apps |
| **FastAPI** | REST API (`/api/v1`) |
| **PostgreSQL** | Primary datastore |
| **TanStack Query** | Server/async state on the frontend |
| **Zustand** | Client-only global state |
| **Tailwind CSS + design tokens** | Shared UI system |

### Primary user journey (customer)

```
Home / Discover (laundry listing only)
  → Laundry detail (services & pricing per store)
    → Service selection + cart
      → Pickup address
        → Checkout / payment
          → Order tracking
```

**Design principle:** The first screen shows **laundries only**. Services appear **after** a laundry is selected.

---

## 2. Repository layout (monorepo)

```
DLM/
├── PROJECT_STRUCTURE.md          # ← this file
├── backend/                      # FastAPI application
├── frontend/                     # Next.js application
├── docs/                         # Product, API, DB, ADRs
├── logs/                         # Implementation tracking
├── scripts/                      # Cross-stack utilities
├── infrastructure/               # IaC / deploy configs
├── docker-compose.yml
├── .cursor/                      # Agent rules & context
└── README.md
```

---

## 3. Backend architecture (reference)

The backend already follows **layered clean architecture**. Frontend architecture aligns with it via typed API clients and domain-shaped features.

```
HTTP Request
    → api/v1/endpoints/*.py      (routers, deps, HTTP only)
    → services/*.py              (business logic, domain exceptions)
    → repositories/*.py          (SQLAlchemy persistence)
    → models/*.py                  (ORM)
```

| Layer | Location | Rules |
| ----- | -------- | ----- |
| API | `backend/app/api/v1/endpoints/` | No direct DB; map `DomainError` → HTTP |
| Schemas | `backend/app/schemas/` | Pydantic request/response; never expose ORM |
| Services | `backend/app/services/` | No FastAPI imports |
| Repositories | `backend/app/repositories/` | Queries only |
| Models | `backend/app/models/` | Data + relationships |

### API surface (v1)

| Prefix | Module | Consumer |
| ------ | ------ | -------- |
| `/api/v1/auth` | `auth.py` | All roles |
| `/api/v1/users` | `users.py` | Customer profile, addresses |
| `/api/v1/laundries` | `laundries.py` | Public browse + detail |
| `/api/v1/orders` | `orders.py` | Customer + partner |
| `/api/v1/payments` | `payments.py` | Checkout |
| `/api/v1/partner` | `partner.py` | Partner dashboard |
| `/api/v1/admin` | `admin.py` | Admin dashboard |
| `/api/v1/subscriptions` | `subscriptions.py` | Plans (future UI) |
| `/api/v1/complaints` | `complaints.py` | Support |
| `/api/v1/loyalty` | `loyalty.py` | Points (future UI) |
| `/health` | `health.py` | Ops |

**Envelope (all JSON):**

```ts
// Success
{ data: T, meta: { request_id, timestamp, pagination? } }

// Error
{ error: { code, message, details[] }, meta: { request_id, timestamp } }
```

---

## 4. Frontend — target feature-based structure

### 4.1 Principles

1. **`app/` = routing only** — thin `page.tsx` / `layout.tsx`; no business logic.
2. **`features/<domain>/` = product logic** — screens, hooks, feature API, schemas, types.
3. **`components/` = design system + cross-feature UI** — no domain rules.
4. **`lib/` = infrastructure** — axios, env, logger, session helpers.
5. **Server data → TanStack Query**; **UI/auth shell → Zustand**.
6. **Named exports** for shared modules (except Next.js default pages/layouts).

### 4.2 Target tree

```
frontend/
├── app/                                    # Next.js App Router (routes ONLY)
│   ├── layout.tsx                          # Root: fonts, Providers, Toaster
│   ├── loading.tsx                         # Route-level skeleton (global default)
│   ├── error.tsx                           # Global error boundary
│   ├── not-found.tsx
│   │
│   ├── (public)/                           # No auth required
│   │   ├── layout.tsx                      # AppShell + OptionalAuthRefresh
│   │   ├── discover/
│   │   │   ├── page.tsx                    # → features/discover/listing
│   │   │   └── [laundryId]/
│   │   │       └── page.tsx                # → features/discover/detail
│   │   ├── login/page.tsx                  # → features/auth
│   │   ├── register/page.tsx
│   │   └── partners/page.tsx               # Partner marketing / apply
│   │
│   ├── (customer)/                         # Auth required (customer role)
│   │   ├── layout.tsx                      # AppShell + AuthGuard
│   │   ├── orders/
│   │   │   ├── page.tsx                    # → features/orders/list
│   │   │   └── [orderId]/page.tsx          # → features/orders/tracking
│   │   ├── account/page.tsx                # → features/account
│   │   └── checkout/                       # Optional: dedicated checkout route
│   │       └── page.tsx                    # → features/checkout (future)
│   │
│   ├── (partner)/
│   │   ├── layout.tsx                      # PartnerShell + RoleGuard(partner)
│   │   └── partner/page.tsx                # → features/partner/dashboard
│   │
│   └── (admin)/
│       ├── layout.tsx                      # AdminShell + RoleGuard(admin)
│       └── admin/page.tsx                  # → features/admin/dashboard
│
├── features/                               # ★ Feature modules (heart of the app)
│   ├── discover/
│   │   ├── components/                     # Feature-only UI (cards, filters, tabs)
│   │   ├── hooks/                          # useLaundryFilters, useServiceCart, …
│   │   ├── api/                            # TanStack Query keys + hooks
│   │   │   ├── keys.ts
│   │   │   ├── queries.ts
│   │   │   └── mutations.ts                # (if any discover mutations)
│   │   ├── lib/                            # laundry-meta, enrich, sort (pure)
│   │   ├── types/                          # EnrichedLaundry, CartLine, TabId, …
│   │   ├── schemas/                        # Zod: filters, cart (when forms added)
│   │   ├── screens/
│   │   │   ├── laundry-listing-screen.tsx
│   │   │   └── laundry-detail-screen.tsx
│   │   └── index.ts                        # Public exports
│   │
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── schemas/                        # login.schema.ts, register.schema.ts
│   │   ├── screens/
│   │   └── index.ts
│   │
│   ├── orders/
│   ├── checkout/                           # Address + payment + confirm (extract from detail)
│   ├── account/
│   ├── partner/
│   ├── admin/
│   └── landing/                            # Optional marketing (not on /discover)
│
├── components/                             # Cross-feature UI
│   ├── ui/                                 # Atoms (design system primitives)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   ├── spinner.tsx
│   │   └── …
│   ├── shared/                             # Molecules (domain-agnostic)
│   │   ├── empty-state.tsx
│   │   ├── error-state.tsx
│   │   ├── info-banner.tsx
│   │   ├── rating-stars.tsx
│   │   └── page-section.tsx
│   ├── layout/                             # Shells & navigation
│   │   ├── app-shell.tsx
│   │   ├── partner-shell.tsx
│   │   ├── admin-shell.tsx
│   │   └── public-shell.tsx
│   ├── auth/                               # Guards (cross-cutting)
│   │   ├── auth-guard.tsx
│   │   ├── role-guard.tsx
│   │   ├── auth-bootstrap.tsx
│   │   └── optional-auth-refresh.tsx
│   ├── feedback/                           # Toasts wrappers, inline alerts
│   ├── form/                               # FormField, Label, ErrorMessage
│   └── data/                               # DataTable, Pagination (admin)
│
├── lib/                                    # Infrastructure (no React)
│   ├── api/
│   │   ├── client.ts                       # axios instance (today: lib/api.ts)
│   │   ├── envelope.ts                     # ApiEnvelope, ApiError types
│   │   ├── interceptors.ts
│   │   └── parse-error.ts                  # map AxiosError → AppError
│   ├── query/
│   │   └── query-client.ts                 # Default QueryClient options
│   ├── session.ts                          # tryRefreshSession, shouldAttemptSessionRestore
│   ├── env.ts
│   ├── logger.ts
│   └── utils.ts                            # cn, formatPrice, …
│
├── providers/
│   ├── index.tsx                           # QueryClient + Theme + AuthBootstrap
│   └── theme-provider.tsx
│
├── store/                                  # Global Zustand ONLY
│   ├── auth.store.ts
│   ├── ui.store.ts
│   └── checkout.store.ts                   # (future) ephemeral cart before order API
│
├── types/                                  # Global / cross-feature types
│   ├── api.ts                              # PaginationMeta, Id, ISODateTime
│   ├── user.ts
│   ├── laundry.ts
│   ├── order.ts
│   └── index.ts
│
├── styles/
│   └── tokens.css                          # CSS variables (source of truth with tailwind)
│
└── tests/
    ├── unit/
    └── e2e/
```

### 4.3 Current vs target (frontend features)

| Area | Current location | Target / action |
| ---- | ---------------- | ----------------- |
| Laundry listing | `features/discover/listing/` | Keep; rename group → `screens/laundry-listing-screen.tsx` |
| Laundry detail | `features/discover/detail/` | Keep; extract checkout → `features/checkout/` |
| Legacy marketplace | `features/discover/marketplace/` | **Deprecate / remove** (not on listing page) |
| Legacy discover list | `features/discover/discover-list.tsx` | **Remove** |
| Auth pages | `app/login`, `app/register` | Move forms → `features/auth/screens/` |
| Orders | `features/orders/*.tsx` | Add `api/`, `hooks/`, `screens/` |
| Partner / Admin | `features/partner`, `features/admin` | Same pattern as discover |
| API clients | `frontend/services/*.ts` | Migrate → `features/<f>/api/client.ts` + thin `lib/api` |

---

## 5. Route structure

### 5.1 URL map (production)

| URL | Access | Feature screen | Notes |
| --- | ------ | -------------- | ----- |
| `/` | Public | Redirect → `/discover` | Entry = laundry listing |
| `/discover` | Public | `LaundryListingScreen` | **Laundries only** |
| `/discover/[laundryId]` | Public | `LaundryDetailScreen` | Services, reviews, book |
| `/login` | Public | `LoginScreen` | Return URL support |
| `/register` | Public | `RegisterScreen` | |
| `/orders` | Customer | `OrdersListScreen` | Auth required |
| `/orders/[orderId]` | Customer | `OrderTrackingScreen` | Timeline + status |
| `/account` | Customer | `AccountScreen` | Addresses, profile |
| `/checkout` | Customer | `CheckoutScreen` | Optional split from detail |
| `/partner` | Partner | `PartnerDashboardScreen` | Role guard |
| `/admin` | Admin | `AdminDashboardScreen` | Role guard |
| `/partners` | Public | Partner landing | B2B signup info |

### 5.2 Route groups (Next.js)

| Group | Layout responsibilities |
| ----- | ------------------------ |
| `(public)` | `AppShell`, `OptionalAuthRefresh`, no `AuthGuard` |
| `(customer)` | `AppShell`, `AuthGuard`, customer nav |
| `(partner)` | `PartnerShell`, `RoleGuard(['partner','admin'])` |
| `(admin)` | `AdminShell`, `RoleGuard(['admin','super_admin'])` |

### 5.3 Route rules

- **One `page.tsx` per route** — imports a single `*Screen` from `features/`.
- **Layouts own shells and guards** — not individual pages.
- **Dynamic segments** use `laundryId`, `orderId` (not `id`) for clarity.
- **Metadata** in `page.tsx` (server) or `generateMetadata` when SEO needed.

---

## 6. API integration structure

### 6.1 Layered client model

```
UI (Screen)
  → feature hook (useLaundries, useCreateOrder)
    → TanStack Query (cache, status, retry)
      → feature API function (listLaundries)
        → axios client (lib/api/client.ts)
          → FastAPI /api/v1
```

### 6.2 File responsibilities

| File | Responsibility |
| ---- | -------------- |
| `lib/api/client.ts` | Single axios instance, `withCredentials`, base URL, timeouts |
| `lib/api/interceptors.ts` | Auth header, error logging, 401 refresh queue (future) |
| `lib/api/parse-error.ts` | `AxiosError` → `AppError { code, message, details, status }` |
| `features/<f>/api/keys.ts` | Query key factory (hierarchical, stable) |
| `features/<f>/api/queries.ts` | `useQuery` hooks |
| `features/<f>/api/mutations.ts` | `useMutation` hooks + invalidation |
| `features/<f>/api/client.ts` | Raw async functions (testable without React) |

### 6.3 Query key convention

```ts
// features/discover/api/keys.ts
export const laundryKeys = {
  all: ['laundries'] as const,
  lists: () => [...laundryKeys.all, 'list'] as const,
  list: (filters: LaundryListFilters) => [...laundryKeys.lists(), filters] as const,
  details: () => [...laundryKeys.all, 'detail'] as const,
  detail: (id: string) => [...laundryKeys.details(), id] as const,
  reviews: (id: string) => [...laundryKeys.detail(id), 'reviews'] as const,
};
```

### 6.4 Mutation invalidation map

| Mutation | Invalidate |
| -------- | ---------- |
| `createOrder` | `orderKeys.lists()`, `laundryKeys.detail(id)` |
| `createReview` | `laundryKeys.reviews(laundryId)` |
| `updateOrderStatus` (partner) | `orderKeys.detail(id)`, `orderKeys.lists()` |
| `login` / `logout` | Auth store only; optional `userKeys.me()` |

### 6.5 Auth & cookies

| Concern | Implementation |
| ------- | -------------- |
| Access token | Zustand `auth.store` (memory; optional short persist later) |
| Refresh token | HttpOnly cookie `dlm_refresh`, path `/api/v1/auth` |
| Silent restore | `OptionalAuthRefresh` on public routes; `AuthGuard` on protected |
| Refresh failure | `tryRefreshSession()` clears store; API clears cookie |

### 6.6 Environment

```ts
// lib/env.ts — Zod-validated at build/runtime
NEXT_PUBLIC_API_URL     // e.g. http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL     // e.g. http://localhost:3000
```

---

## 7. Zustand store structure

### 7.1 What belongs in Zustand

| Store | State | Persist? |
| ----- | ----- | -------- |
| `auth.store` | `user`, `accessToken`, actions | `user` only (localStorage) |
| `ui.store` | Sidebar, modals, command palette | No |
| `checkout.store` (future) | Selected laundryId, lines[], draft address | Session storage optional |

### 7.2 What does NOT belong in Zustand

- Laundry lists, order lists, reviews → **TanStack Query**
- Form field values → **React Hook Form** local state
- URL filters (search, sort) → **nuqs** or `useSearchParams` (recommended for shareable URLs)

### 7.3 Store template

```ts
// store/<name>.store.ts
interface FooState {
  // state
  // actions (sync only)
}
export const useFooStore = create<FooState>()(
  devtools(
    persist(/* optional */, { name: 'dlm.foo', partialize: … }),
  ),
);
```

### 7.4 Selectors

- Use atomic selectors: `useAuthStore((s) => s.user)` — avoid subscribing to full store.
- Cross-store orchestration lives in **hooks** (`useSession`, `useLogout`), not components.

---

## 8. Component architecture

### 8.1 Tiers (atomic design)

| Tier | Location | Examples | Rules |
| ---- | -------- | -------- | ----- |
| **Atoms** | `components/ui/` | `Button`, `Input`, `Badge`, `Skeleton` | No API, no feature imports |
| **Molecules** | `components/shared/` | `EmptyState`, `RatingStars`, `InfoBanner` | Composes atoms; domain-agnostic |
| **Organisms** | `features/<f>/components/` | `LaundryCard`, `ServiceCard`, `OrderTimeline` | May use feature hooks/types |
| **Screens** | `features/<f>/screens/` | `LaundryListingScreen` | Data fetching boundaries |
| **Templates** | `components/layout/` | `AppShell`, `PartnerShell` | Nav + outlet |
| **Pages** | `app/**/page.tsx` | 1–5 lines, imports Screen | Server component when possible |

### 8.2 Server vs client components

| Use Server Component | Use Client Component (`"use client"`) |
| -------------------- | ------------------------------------- |
| Static layout, metadata | Interactivity, hooks, Zustand |
| Initial SEO for marketing | TanStack Query, forms, tabs |
| Pass serializable props to client children | Framer Motion, browser APIs |

**Pattern:** `page.tsx` (server) → `Screen` (client) → presentational `components`.

### 8.3 Component rules

- Max **~150 lines** per component; split at logical boundaries.
- **No axios in components** — use hooks.
- **Props interfaces** colocated; export only if reused.
- **Accessibility:** semantic HTML, `aria-*`, focus rings via `focus-visible:ring-brand-500`.

### 8.4 Layout shells

| Shell | Used by | Contains |
| ----- | ------- | -------- |
| `AppShell` | Customer + public browse | Header, mobile nav, theme toggle |
| `PartnerShell` | Partner routes | Partner nav, back link |
| `AdminShell` | Admin routes | Admin nav, KPI context |
| `PublicShell` | Global error / marketing | Minimal chrome |

---

## 9. TypeScript types

### 9.1 Type layers

```
backend Pydantic schemas
    ↓ (manual sync or openapi-typescript codegen — future)
features/<f>/types/          # Domain types used by UI
types/                       # Shared primitives (User, UserRole, Id)
lib/api/envelope.ts          # ApiEnvelope<T>, ApiError
```

### 9.2 Naming conventions

| Kind | Convention | Example |
| ---- | ---------- | ------- |
| API DTO (matches backend) | `*Response`, `*Request` | `LaundryDetailResponse` |
| UI-enriched model | `Enriched*` | `EnrichedLaundry` |
| Form values | `*FormValues` | `LoginFormValues` |
| Query filters | `*Filters` | `LaundryListFilters` |
| Enum unions | PascalCase string union | `OrderStatus`, `PaymentMethod` |

### 9.3 Shared types (`types/`)

```ts
// types/api.ts
export type Id = string;
export type ISODateTime = string;

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// types/user.ts — User, UserRole (exists)
// types/laundry.ts — move from services/laundries.ts
// types/order.ts — move from services/orders.ts
```

### 9.4 Feature types (`features/discover/types/`)

```ts
export type LaundryTabId = 'overview' | 'services' | 'reviews' | 'info';
export type SortOption = 'top_rated' | 'nearest' | 'lowest_price' | 'fastest';
export interface CartLine {
  serviceId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}
```

### 9.5 Strictness

- `strict: true` in `tsconfig.json`
- No `any`; use `unknown` + narrowing
- Prefer `interface` for object shapes; `type` for unions/intersections
- Zod schemas infer types: `type LoginFormValues = z.infer<typeof loginSchema>`

---

## 10. Shared UI system

### 10.1 Design tokens

**Source:** `frontend/styles/tokens.css` → mirrored in `tailwind.config.ts`.

| Token | Usage |
| ----- | ----- |
| `--brand-500/600` | Primary actions, links |
| `--accent-500` | Highlights (e.g. “Most popular”) |
| `--success` | Pricing, trust checkmarks |
| `--bg-0/1/2` | Surfaces |
| `--fg-0/1/2` | Text hierarchy |
| `--shadow-soft/pop` | Cards |
| `--radius-lg/xl/2xl` | Consistent rounding |

### 10.2 Typography scale

| Role | Classes |
| ---- | ------- |
| Page title | `text-3xl sm:text-4xl font-bold tracking-tight` |
| Section title | `text-xl sm:text-2xl font-bold` |
| Card title | `text-lg font-semibold` |
| Body | `text-base text-fg-1 leading-relaxed` |
| Caption | `text-sm text-fg-2` |
| Eyebrow | `text-xs font-semibold uppercase tracking-wider text-brand-500` |

### 10.3 Spacing scale

| Context | Value |
| ------- | ----- |
| Page container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Section vertical | `py-16 lg:py-24` |
| Card padding | `p-6 sm:p-8` |
| Grid gap | `gap-6` |

### 10.4 UI primitives (target set)

| Component | Status | Path |
| --------- | ------ | ---- |
| Button | ✅ | `components/ui/button.tsx` |
| Badge | ✅ | `components/ui/badge.tsx` |
| Input, Select, Textarea | 🔲 | `components/ui/` |
| Skeleton | 🔲 | `components/ui/skeleton.tsx` |
| Spinner | 🔲 | `components/ui/spinner.tsx` |
| Card | 🔲 | `components/ui/card.tsx` |
| Tabs | 🔲 | `components/ui/tabs.tsx` |
| EmptyState | ✅ | `components/ui/empty-state.tsx` |
| InfoBanner | ✅ | `components/ui/info-banner.tsx` |
| ErrorState | 🔲 | `components/shared/error-state.tsx` |

### 10.5 Theming

- `next-themes` + `class` strategy (`darkMode: 'class'`)
- All colors via tokens — no hardcoded hex in features

---

## 11. Error handling strategy

### 11.1 Error taxonomy

| Layer | Type | Handling |
| ----- | ---- | -------- |
| Network | No response / timeout | Toast + retry CTA |
| API | `ApiError` with `code` | Map code → user message |
| Auth | 401 / refresh fail | Redirect login or silent guest |
| Validation | 422 + `details[]` | Inline field errors (RHF) |
| Unexpected | 500 / thrown Error | Error boundary + digest |

### 11.2 `AppError` shape (frontend)

```ts
interface AppError {
  code: string;
  message: string;
  status?: number;
  details?: { field: string; issue: string }[];
  requestId?: string;
}
```

### 11.3 Mapping (examples)

| `code` | User message | Action |
| ------ | ------------ | ------ |
| `AUTH_INVALID_CREDENTIALS` | Invalid email or password | Stay on form |
| `LAUNDRY_NOT_FOUND` | Laundry not found | Link to /discover |
| `ORDER_INVALID_TRANSITION` | This action is not available | Refresh order |
| `VALIDATION_FAILED` | Please fix the highlighted fields | Show field errors |
| `INTERNAL_ERROR` | Something went wrong | Retry + support ref (request_id) |

### 11.4 Where errors are handled

| Scope | Mechanism |
| ----- | --------- |
| Global | `app/error.tsx` — `PublicShell`, reset, home link |
| Route segment | `app/(customer)/orders/error.tsx` (optional) |
| Query | `useQuery({ throwOnError: false })` + `isError` → `<ErrorState onRetry={refetch} />` |
| Mutation | `onError` → `toast.error(parseError(err).message)` |
| Forms | `setError` from RHF + server `details` |

### 11.5 Logging

- **Client:** `lib/logger.ts` — warn on API errors (exclude stale refresh noise)
- **Server:** structlog `request.domain_error` / `request.unhandled`
- **Never log** tokens, passwords, or PII in client console in production

---

## 12. Loading state strategy

### 12.1 Hierarchy (first match wins)

| Level | When | UI |
| ----- | ---- | -- |
| **Route** | Navigating between pages | `app/loading.tsx` or segment `loading.tsx` |
| **Screen** | Feature data required to render | Dedicated skeleton matching final layout |
| **Section** | Tab switch / secondary data | Inline skeleton or `aria-busy` region |
| **Action** | Mutation in flight | Button `disabled` + label change (“Placing order…”) |

### 12.2 TanStack Query defaults

```ts
// providers / lib/query/query-client.ts
{
  queries: {
    staleTime: 30_000,
    gcTime: 300_000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
  mutations: { retry: 0 },
}
```

### 12.3 Skeleton guidelines

- Match **exact layout** of loaded content (card aspect ratio, text lines).
- Always include `aria-busy="true"` and `sr-only` “Loading…” on container.
- Prefer skeleton over spinners for lists and cards.
- Use **one spinner** only for full-page auth bootstrap (`AuthGuard`).

### 12.4 Per-feature loading

| Screen | Loading UI |
| ------ | ---------- |
| Laundry listing | 4 card skeletons in responsive grid |
| Laundry detail | Hero skeleton + tab bar skeleton |
| Orders list | Row skeletons |
| Order tracking | Timeline skeleton |
| Partner / Admin tables | Table row skeletons |

---

## 13. Empty state strategy

### 13.1 Principles

- **Never a blank screen** — always explain what happened and what to do next.
- Use shared `<EmptyState />` from `components/ui/empty-state.tsx`.
- Distinguish **zero data** vs **filtered to zero** vs **error**.

### 13.2 Empty state matrix

| Context | Title | Primary action |
| ------- | ----- | -------------- |
| No laundries in city | No laundries in your area yet | Change location / Refresh |
| Filters match nothing | No laundries match your filters | Reset filters |
| No orders | No orders yet | Browse laundries → `/discover` |
| No addresses | Add a delivery address | Go to account |
| No reviews | No reviews yet | Encourage first order |
| No services | Services coming soon | Back to discover |
| API error | Could not load | Try again (`refetch`) |

### 13.3 Props contract

```ts
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; onClick: () => void };
}
```

### 13.4 Illustrations

- Phase 1: Lucide icon in tinted circle (current).
- Phase 2: Optional SVG illustrations in `public/illustrations/` for marketing empty states.

---

## 14. Cross-cutting concerns

### 14.1 Forms

- **React Hook Form + Zod** for login, register, address, admin forms.
- Schemas in `features/<f>/schemas/`.
- Submit via TanStack `useMutation`.

### 14.2 Notifications

- **Sonner** toasts for mutation success/failure (root layout).
- Future: in-app notification center backed by `/api/v1/notifications`.

### 14.3 Internationalization (future)

- Reserve `lib/i18n/` and namespace per feature.
- India-first: `en-IN` locale, `₹` formatting via `formatPrice()`.

### 14.4 Performance

- `next/image` for all remote laundry photos (Unsplash allowlist in `next.config.mjs`).
- `optimizePackageImports` for `lucide-react`, `framer-motion`.
- Route-level code splitting via dynamic import for admin/partner heavy charts.

### 14.5 Testing pyramid

| Layer | Tool | Target |
| ----- | ---- | ------ |
| Unit | Vitest/Jest | `lib/`, filter utils, parse-error |
| Component | RTL | `EmptyState`, `LaundryCard` |
| Integration | MSW + RTL | Query hooks with mocked API |
| E2E | Playwright | Discover → detail → login → order |

---

## 15. Security (frontend)

| Concern | Approach |
| ------- | -------- |
| XSS | React escaping; no `dangerouslySetInnerHTML` without sanitize |
| CSRF | SameSite cookies; API stateless JWT + httpOnly refresh |
| Authz | `RoleGuard` on partner/admin; API enforces roles |
| Secrets | Only `NEXT_PUBLIC_*` in client bundle |
| Route protection | Layout-level guards, not security boundaries alone |

---

## 16. Migration plan (current → target)

### Phase A — Structure hygiene (no behavior change)

1. Add `features/*/screens/` and re-export from existing components.
2. Move `services/*.ts` types → `types/` and `features/*/api/client.ts`.
3. Add `features/*/api/keys.ts` + extract query hooks from screens.
4. Delete deprecated `features/discover/marketplace/` and `discover-list.tsx`.
5. Rename route group `(browse)` → `(public)` for clarity.

### Phase B — Checkout extraction

1. Create `features/checkout/` with address + payment steps.
2. Detail screen ends at cart; navigates to `/checkout?laundryId=…` or state in `checkout.store`.

### Phase C — Shared UI completion

1. Add `Input`, `Select`, `Skeleton`, `Tabs`, `ErrorState`.
2. Replace ad-hoc loading/error markup in orders, partner, admin.

### Phase D — URL state & polish

1. Laundry filters → `nuqs` search params (shareable links).
2. OpenAPI codegen for API types (optional).
3. Segment-level `error.tsx` / `loading.tsx` for customer routes.

---

## 17. Decision log (architecture)

| ID | Decision | Rationale |
| -- | -------- | --------- |
| AR-001 | Feature-based folders | Scales with teams; aligns routes to product |
| AR-002 | TanStack Query for server state | Caching, dedup, mutations, devtools |
| AR-003 | Zustand only for client global | Avoid duplicating server cache |
| AR-004 | Thin `app/` routes | Next.js conventions without bloated pages |
| AR-005 | Listing-first discover | User picks laundry before services (product requirement) |
| AR-006 | HttpOnly refresh cookie | XSS-resistant session refresh |
| AR-007 | Shared EmptyState / ErrorState | Consistent UX and a11y |

---

## 18. Related documents

| Document | Path |
| -------- | ---- |
| Cursor architecture rules | `.cursor/rules/01-architecture.md` |
| Folder structure rules | `.cursor/rules/03-folder-structure.md` |
| API standards | `.cursor/rules/05-api-standards.md` |
| Database schema | `docs/database/schema.md` |
| Product index | `docs/product/INDEX.md` |
| Current phase status | `.cursor/context/current-status.md` |

---

## 19. Approval checklist

Before implementation sprints, confirm:

- [ ] Route map matches product (listing-first, no services on `/discover`)
- [ ] Feature list complete for MVP (discover, auth, orders, checkout, account, partner, admin)
- [ ] Query key + invalidation conventions accepted
- [ ] Zustand boundaries (auth/ui/checkout only) accepted
- [ ] Empty / loading / error patterns accepted for all list screens
- [ ] Deprecation of legacy `marketplace/` folder approved

---

*End of architecture specification.*
