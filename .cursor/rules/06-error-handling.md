---
description: Error handling patterns across the stack
globs: backend/**
alwaysApply: false
---

# Error Handling

## Principles

1. **Fail fast.** Validate at the boundary; throw early.
2. **Fail loud.** Don't swallow errors silently.
3. **Fail safe.** Never leak internals, stack traces, or PII.
4. **Be specific.** Domain exceptions > generic `Exception`.
5. **Be recoverable.** UI must always offer a next step (retry, contact support, go back).

## Backend (FastAPI / Python)

### Domain exception hierarchy

Live in `app/core/exceptions.py`:

```python
class DomainError(Exception):
    """Base for all domain errors. Maps to a known HTTP status."""
    code: str = "INTERNAL_ERROR"
    status_code: int = 500
    message: str = "An unexpected error occurred"

    def __init__(self, message: str | None = None, details: list | None = None):
        self.message = message or self.message
        self.details = details or []
        super().__init__(self.message)


class NotFoundError(DomainError):
    code = "NOT_FOUND"
    status_code = 404
    message = "Resource not found"


class ValidationError(DomainError):
    code = "VALIDATION_FAILED"
    status_code = 422


class AuthenticationError(DomainError):
    code = "AUTH_FAILED"
    status_code = 401


class AuthorizationError(DomainError):
    code = "FORBIDDEN"
    status_code = 403


class ConflictError(DomainError):
    code = "CONFLICT"
    status_code = 409


class RateLimitError(DomainError):
    code = "RATE_LIMITED"
    status_code = 429
```

### Per-domain subclasses

```python
class OrderNotFoundError(NotFoundError):
    code = "ORDER_NOT_FOUND"
    message = "Order not found"


class OrderInvalidTransitionError(ConflictError):
    code = "ORDER_INVALID_TRANSITION"
    message = "Cannot transition order to the requested status"
```

### Global handler (`app/middleware/error_handler.py`)

- Catches `DomainError` → returns API envelope with `error.code`, `error.message`, `error.details`.
- Catches unhandled `Exception` → logs with full context + traceback → returns sanitized 500.
- Includes `X-Request-ID` on every error.

### Where to raise

- **Repositories:** raise `NotFoundError` when an aggregate is required but missing.
- **Services:** raise domain errors for business rules.
- **API endpoints:** do not raise; pass through. Convert third-party errors into domain errors.

### Logging

- WARN-level for 4xx (client errors).
- ERROR-level for 5xx (server bugs).
- Include: `request_id`, `user_id` (if known), `route`, `method`, `error.code`.

## Frontend (Next.js)

### Three layers of error handling

1. **Per-request** (TanStack Query / axios)
2. **Per-route** (`error.tsx` boundary)
3. **App-wide** (Sentry + root `error.tsx` + `global-error.tsx`)

### Axios interceptor (`lib/api.ts`)

```ts
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      await tryRefreshToken();
      return api.request(error.config!);
    }
    if (error.response?.status === 429) {
      toast.error('Slow down a bit — too many requests.');
    }
    logger.error('api.error', {
      url: error.config?.url,
      status: error.response?.status,
      code: error.response?.data?.error?.code,
    });
    return Promise.reject(toAppError(error));
  },
);
```

### Mutations / queries

- Always return a typed `Result` or throw.
- `useMutation` calls show toast + roll back optimistic updates.
- Don't render raw error messages from backend except for validation field errors.

### Route boundaries

Every route segment has an `error.tsx`:

```tsx
'use client';
import { ErrorState } from '@/components/shared/error-state';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState error={error} onRetry={reset} />;
}
```

### UI patterns

| Scenario             | Component             | Notes                                 |
| -------------------- | --------------------- | ------------------------------------- |
| Loading              | `Skeleton`            | Always above the fold                 |
| Empty                | `EmptyState`          | Helpful CTA                           |
| Error                | `ErrorState`          | Retry button + support link           |
| Field validation     | Inline below input    | Red text, `aria-invalid`              |
| Toast                | `sonner` shadcn       | For mutation results                  |

## Mapping table

| Backend domain error            | HTTP | Frontend handling                                    |
| ------------------------------- | ---- | ---------------------------------------------------- |
| `AuthenticationError`           | 401  | Force logout, redirect to `/login`                   |
| `AuthorizationError`            | 403  | Show "Access denied" page                            |
| `NotFoundError`                 | 404  | Show `not-found.tsx`                                 |
| `ValidationError`               | 422  | Show field errors inline                             |
| `ConflictError`                 | 409  | Toast + offer retry / refresh                        |
| `RateLimitError`                | 429  | Toast with countdown                                 |
| Anything else                   | 500  | `error.tsx` boundary + Sentry                        |

## Never do this

❌ `except Exception: pass`
❌ `try { ... } catch (e) { }`  (empty)
❌ Returning `null` from a service when an error occurred
❌ Leaking stack traces to clients
❌ Showing raw `error.message` in production UI (except validation)
❌ Re-throwing without preserving the cause (`raise X from e` / `throw new X({ cause: e })`)
