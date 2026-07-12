---
description: Naming conventions across all layers
globs: "**/*.{ts,tsx,py}"
alwaysApply: false
---

# Naming Conventions

## Files

| Layer              | Convention                      | Example                         |
| ------------------ | ------------------------------- | ------------------------------- |
| React components   | `kebab-case.tsx`                | `order-card.tsx`                |
| React hooks        | `use-<name>.ts`                 | `use-auth.ts`                   |
| Zustand stores     | `<domain>.store.ts`             | `auth.store.ts`                 |
| Zod schemas        | `<domain>.schema.ts`            | `order.schema.ts`               |
| API hooks (TanStack) | `use-<verb>-<noun>.ts`        | `use-create-order.ts`           |
| Python modules     | `snake_case.py`                 | `order_service.py`              |
| Test files (TS)    | `<name>.test.ts(x)`             | `order-card.test.tsx`           |
| Test files (E2E)   | `<feature>.spec.ts`             | `checkout.spec.ts`              |
| Test files (Python)| `test_<name>.py`                | `test_order_service.py`         |
| Alembic migrations | `<ts>_<slug>.py` (auto)         | `20260315_create_orders.py`     |

## Symbols

### TypeScript

| Symbol kind          | Convention            | Example                |
| -------------------- | --------------------- | ---------------------- |
| Component            | PascalCase            | `OrderCard`            |
| Hook                 | camelCase, `use*`     | `useAuth`              |
| Function             | camelCase             | `formatPrice`          |
| Variable             | camelCase             | `currentUser`          |
| Boolean              | `is/has/can/should*`  | `isLoading`, `canEdit` |
| Constant (module)    | `UPPER_SNAKE_CASE`    | `MAX_FILE_SIZE`        |
| Type / Interface     | PascalCase            | `Order`, `OrderStatus` |
| Enum                 | PascalCase            | `OrderStatus`          |
| Enum value           | PascalCase            | `OrderStatus.Pending`  |
| Zod schema           | camelCase + `Schema`  | `orderSchema`          |
| Inferred Zod type    | PascalCase            | `Order`                |
| Generic param        | `T`, `TItem`, etc.    | `<TItem>`              |

### Python

| Symbol kind     | Convention             | Example                 |
| --------------- | ---------------------- | ----------------------- |
| Class           | PascalCase             | `OrderService`          |
| Function/method | snake_case             | `create_order`          |
| Variable        | snake_case             | `current_user`          |
| Constant        | UPPER_SNAKE_CASE       | `MAX_RETRIES`           |
| Private         | leading underscore     | `_calculate_total`      |
| Enum class      | PascalCase             | `OrderStatus`           |
| Enum value      | UPPER_SNAKE_CASE       | `OrderStatus.PENDING`   |
| Module          | snake_case             | `order_service.py`      |

## URLs / Routes

- **Frontend routes:** `kebab-case` — `/partner-dashboard/orders`
- **API routes:** plural `kebab-case` — `/api/v1/laundries`, `/api/v1/orders/{order_id}/items`
- **Query params:** snake_case — `?page_size=20&order_by=created_at`
- **Path params:** snake_case singular id — `{order_id}` not `{id}`

## Database

- Tables: plural snake_case — `users`, `orders`, `order_items`
- Columns: snake_case — `created_at`, `email`, `is_active`
- Foreign keys: `<singular_table>_id` — `user_id`, `laundry_id`
- Indexes: `ix_<table>_<column(s)>` — `ix_orders_user_id_status`
- Unique constraints: `uq_<table>_<column(s)>` — `uq_users_email`
- Enums: PascalCase (Python) → snake_case (Postgres) — `OrderStatus` → `order_status`
- Booleans: `is_*` / `has_*` — `is_active`, `has_subscription`
- Timestamps: `*_at` — `created_at`, `updated_at`, `deleted_at`

## Environment variables

- `UPPER_SNAKE_CASE` always.
- Prefix client-exposed vars with `NEXT_PUBLIC_` on frontend.
- Group by purpose:
  - `DATABASE_*`
  - `REDIS_*`
  - `JWT_*`
  - `SMTP_*`
  - `STRIPE_*`
  - `SENTRY_*`

## Branches

```
<type>/<scope>-<short-description>

feat/auth-add-otp-login
fix/orders-status-race-condition
chore/deps-bump-fastapi
docs/architecture-update-diagram
refactor/repos-extract-base-repo
```

## Commits (Conventional Commits)

```
<type>(<scope>): <subject>

feat(auth): add OTP login flow
fix(orders): resolve status race condition
chore(deps): bump FastAPI to 0.115
docs(arch): refresh architecture diagram
test(orders): cover cancellation edge cases
refactor(repos): extract base repository
perf(api): index orders.user_id+status
```

Allowed types: `feat | fix | chore | docs | test | refactor | perf | style | ci | build | revert`.

## Component naming patterns

| Pattern              | Use                                            |
| -------------------- | ---------------------------------------------- |
| `<Resource>Card`     | Compact display in a list                      |
| `<Resource>List`     | Container that renders many cards              |
| `<Resource>Detail`   | Full-page detail view                          |
| `<Resource>Form`     | Create/edit form                               |
| `<Resource>Skeleton` | Loading placeholder                            |
| `<Resource>Empty`    | Empty state                                    |
| `Use<Resource>`      | Hook for that resource                         |

Examples: `OrderCard`, `OrderList`, `OrderDetail`, `OrderForm`, `OrderSkeleton`, `OrderEmpty`, `useOrders`.
