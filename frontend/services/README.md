# Services

Thin wrappers over the Axios client for API resources.

## Layout

```
services/
├── auth.service.ts
├── users.service.ts
├── laundries.service.ts
├── orders.service.ts
├── reviews.service.ts
└── ...
```

## Rules

- One file per backend resource.
- Functions are `async` and return typed data.
- No state — use TanStack Query in components / hooks.
- All requests via `lib/api.ts` (Axios with interceptors).
- Errors propagate; let the interceptor normalize them.

## Example

```ts
import { api } from "@/lib/api";
import type { Order, OrderCreateInput } from "@/types/order";
import type { Paginated } from "@/types/common";

export const ordersService = {
  list: (params: { page?: number; status?: string } = {}) =>
    api.get<Paginated<Order>>("/orders", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Order>(`/orders/${id}`).then((r) => r.data),

  create: (input: OrderCreateInput) =>
    api.post<Order>("/orders", input).then((r) => r.data),

  cancel: (id: string, reason?: string) =>
    api.post<Order>(`/orders/${id}/cancel`, { reason }).then((r) => r.data),
};
```
