---
description: Code quality standards across the codebase
alwaysApply: false
---

# Code Quality Rules

## Universal principles

1. **Readable > clever.** Optimize for the next reader.
2. **Small functions.** A function should do one thing. Aim ≤ 40 lines.
3. **Small files.** Aim ≤ 300 lines. Split when concerns diverge.
4. **Name things precisely.** Booleans start with `is/has/can/should`. Arrays are plural.
5. **Comment why, not what.** The code shows what.
6. **No dead code.** Delete it. Git remembers.
7. **No magic numbers.** Extract to named constants.
8. **Fail fast, fail loud.** Validate at boundaries; throw or return early.
9. **Pure where possible.** Side effects at the edges.

## TypeScript (frontend)

- `strict: true` in `tsconfig.json`. No exceptions.
- **Never** use `any`. Use `unknown` and narrow.
- Prefer `type` for unions/intersections, `interface` for object shapes that may be extended.
- Discriminated unions for state machines.
- Exhaustive `switch` with `never` default.
- Use `satisfies` for config objects.
- Explicit return types on exported functions.
- No non-null assertions (`!`) unless justified by a comment.

```ts
// ❌ Bad
function getUser(id: any) { return fetch(`/users/${id}`); }

// ✅ Good
export async function getUser(id: string): Promise<User> {
  const { data } = await api.get<User>(`/users/${id}`);
  return data;
}
```

## Python (backend)

- Python ≥ 3.11.
- **Type hints on every function.** Use `from __future__ import annotations`.
- Pydantic v2 for all schemas — `model_config = ConfigDict(from_attributes=True)`.
- Async by default; only sync where unavoidable.
- No bare `except:`. Catch specific exceptions.
- Use `pathlib.Path` not `os.path`.
- Prefer composition over inheritance; mixins only when needed.
- No mutable default arguments.
- `f-strings` for formatting, never `%` or `.format()`.

```python
# ❌ Bad
def get_orders(user_id, status=None):
    return db.query(...).all()

# ✅ Good
async def get_orders(
    self,
    user_id: UUID,
    status: OrderStatus | None = None,
) -> list[Order]:
    stmt = select(Order).where(Order.user_id == user_id)
    if status is not None:
        stmt = stmt.where(Order.status == status)
    result = await self.session.execute(stmt)
    return list(result.scalars().all())
```

## Linting & formatting

### Frontend
- **ESLint** — `next/core-web-vitals` + `@typescript-eslint/strict`
- **Prettier** — 2 spaces, single quotes, trailing comma `all`, semicolons on
- **Tailwind plugin** — class sorting
- Pre-commit: `lint-staged` runs ESLint + Prettier on staged files

### Backend
- **Ruff** — formatter + linter (replaces black, isort, flake8)
- **Mypy** — strict mode, `disallow_untyped_defs = true`
- Pre-commit: ruff format + ruff check + mypy

## Imports

### TypeScript
```ts
// 1. Node built-ins (none on web typically)
// 2. External
import { useState } from 'react';
import { z } from 'zod';

// 3. Internal absolute (@/...)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';

// 4. Relative
import { OrderCard } from './order-card';

// 5. Types
import type { Order } from '@/types/order';
```

### Python
```python
# 1. Standard library
from datetime import datetime
from uuid import UUID

# 2. Third-party
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

# 3. First-party
from app.core.config import settings
from app.services.order_service import OrderService
```

## Error handling

- **Never** swallow errors silently.
- **Never** return generic strings (`"error"`). Use typed error objects.
- Frontend: surface errors via toast + log to Sentry.
- Backend: raise domain exceptions; the global handler maps to HTTP.

## Comments

```ts
// ❌ Bad — narrates the code
// loop over users
for (const user of users) { ... }

// ✅ Good — explains the why
// Stripe webhooks can arrive out of order; we ignore older event timestamps.
if (event.created_at < lastProcessedAt) return;
```

## Console / print statements

- **Frontend:** no `console.log` in committed code. Use the structured logger (`lib/logger.ts`).
- **Backend:** no `print()`. Use the configured logger (`app.core.logging`).

## Cyclomatic complexity

- Max 10 per function. Refactor with early returns, guard clauses, or extracted helpers.

## Tests

- Every public service/repo function has at least one test.
- Every reusable component has at least one render test.
- See [`08-testing.md`](08-testing.md).
