---
description: Frontend state management rules
globs: frontend/**
alwaysApply: false
---

# State Management Rules

We use a **layered** approach. Pick the right tool for each kind of state.

## State taxonomy

| Kind                | Examples                                  | Tool                            |
| ------------------- | ----------------------------------------- | ------------------------------- |
| **Server state**    | Orders list, laundries, profile           | **TanStack Query**              |
| **URL state**       | Page, filters, search query               | **`searchParams`** (App Router) |
| **Form state**      | A form being edited                       | **React Hook Form + Zod**       |
| **UI state (local)**| Open/closed modal, hover                  | **`useState`**                  |
| **UI state (global)**| Theme, command palette, toasts           | **Zustand**                     |
| **Auth state**      | Current user, tokens                      | **Zustand** + httpOnly cookies  |
| **Derived state**   | Filtered list                             | `useMemo` / selector            |

## Server state — TanStack Query

### Conventions

- One query per resource list + one per detail.
- Keys are arrays: `['orders']`, `['orders', orderId]`, `['orders', { status, page }]`.
- Set sensible defaults:
  ```ts
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
  ```
- **Always** type the query function return.
- Prefer `useSuspenseQuery` in server components / streamed routes.

### Patterns

```ts
// features/orders/api/use-orders.ts
export function useOrders(params: OrdersQueryParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => ordersApi.list(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
```

```ts
// Mutation with optimistic update
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['orders'] });
      const prev = qc.getQueriesData<Order[]>({ queryKey: ['orders'] });
      qc.setQueriesData<Order[]>({ queryKey: ['orders'] }, (old) =>
        old?.map((o) => (o.id === id ? { ...o, status: 'cancelling' } : o)),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error('Could not cancel order');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
```

### Prefetching

- Prefetch on hover for navigation cards: `qc.prefetchQuery(...)` inside `onMouseEnter`.
- Prefetch in server components via `Hydrate` for initial paint.

## URL state

- **Filters, pagination, search, sort live in `searchParams`.** They are shareable, bookmarkable, back-button-friendly.
- Use a small helper hook `useTypedSearchParams<Schema>(zodSchema)` to validate + parse.
- Don't mirror URL state into local state.

## Zustand stores

### When to use

Only for cross-cutting client UI state that doesn't belong on the server, in URL, or in a form.

Approved stores:
- `auth.store.ts` — currentUser, role, hasHydrated
- `ui.store.ts` — sidebar open, command palette
- `theme.store.ts` — light/dark/system (or use next-themes; either is fine)

### Conventions

```ts
// store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AuthState = {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'dlm.auth', partialize: (s) => ({ user: s.user }) },
  ),
);
```

### Rules

- One concern per store. No "god store."
- Selectors only: `useAuthStore((s) => s.user)`, never the whole state in renders.
- No async logic inside the store; orchestrate in services/hooks.
- Persist sparingly; avoid PII in localStorage.

## Forms — React Hook Form + Zod

```ts
// features/auth/schemas/login.schema.ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
});
export type LoginValues = z.infer<typeof loginSchema>;
```

```ts
const form = useForm<LoginValues>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: '', password: '' },
});
```

- Server validation errors are mapped onto fields with `form.setError`.
- Submit handler is a thin wrapper around a TanStack mutation.

## Local UI state

- `useState`, `useReducer` for simple things.
- For complex state machines, prefer `useReducer` or `XState` (only if truly needed — discuss in an ADR first).

## Do / Don't

✅ Use TanStack Query for **every** server fetch.
✅ Pull derived data with `select` in `useQuery` to memoize.
✅ Use `searchParams` for filters.
✅ Co-locate query hooks with the feature.

❌ Don't store server data in Zustand "for convenience."
❌ Don't `useEffect(fetch)` — ever.
❌ Don't mix server + form state in the same store.
❌ Don't write a global reducer for app-wide state — split by concern.
