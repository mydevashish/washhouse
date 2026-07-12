---
name: state-management-engineer
parent: frontend-architect
description: Implements server state (TanStack Query) + client state (Zustand)
---

# State Management Engineer

## Mission

Wire one feature's data layer: TanStack Query for server data, Zustand for cross-cutting UI state, RHF for forms, URL for filters.

## Decision tree

```
What kind of state is this?
├─ Server data (from API)?           → TanStack Query
├─ Form being edited?                 → React Hook Form
├─ Filters / pagination / search?     → URL searchParams
├─ Local toggle (modal open)?         → useState
├─ Cross-cutting UI (theme, sidebar)? → Zustand
└─ Derived?                           → useMemo / query select
```

## TanStack Query patterns

### List + detail per resource

```ts
// features/orders/api/queries.ts
import { useQuery, useSuspenseQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Order, OrdersQueryParams } from '../types';

const keys = {
  all: ['orders'] as const,
  list: (p: OrdersQueryParams) => ['orders', p] as const,
  detail: (id: string) => ['orders', id] as const,
};

export const ordersApi = {
  list: (p: OrdersQueryParams) =>
    api.get<{ data: Order[]; meta: any }>('/orders', { params: p }).then(r => r.data),
  detail: (id: string) =>
    api.get<{ data: Order }>(`/orders/${id}`).then(r => r.data.data),
  cancel: (id: string) =>
    api.post<{ data: Order }>(`/orders/${id}/cancel`).then(r => r.data.data),
};

export function useOrders(params: OrdersQueryParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => ordersApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useOrder(id: string) {
  return useSuspenseQuery({
    queryKey: keys.detail(id),
    queryFn: () => ordersApi.detail(id),
  });
}
```

### Mutation with optimistic update

```ts
// features/orders/api/mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ordersApi } from './queries';

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['orders'] });
      const snapshots = qc.getQueriesData<{ data: Order[] }>({ queryKey: ['orders'] });
      qc.setQueriesData<{ data: Order[] }>({ queryKey: ['orders'] }, (old) =>
        old
          ? { ...old, data: old.data.map((o) => (o.id === id ? { ...o, status: 'cancelling' } : o)) }
          : old,
      );
      return { snapshots };
    },
    onError: (_e, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error('Could not cancel order. Try again.');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
```

## Zustand patterns

```ts
// store/ui.store.ts
import { create } from 'zustand';

type UIState = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebar: (v: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (v) => set({ sidebarOpen: v }),
}));

// Usage — select narrowly:
const open = useUIStore((s) => s.sidebarOpen);
```

## URL state pattern

```ts
// utils/use-typed-search-params.ts
'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { ZodSchema } from 'zod';

export function useTypedSearchParams<T>(schema: ZodSchema<T>): [T, (next: Partial<T>) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const obj = Object.fromEntries(params.entries());
  const parsed = schema.parse(obj);

  const set = useCallback(
    (next: Partial<T>) => {
      const merged = { ...obj, ...next };
      const search = new URLSearchParams(merged as Record<string, string>);
      router.push(`${pathname}?${search.toString()}`, { scroll: false });
    },
    [obj, router, pathname],
  );

  return [parsed, set];
}
```

## Checklist

- [ ] Server data: TanStack Query only (no `useEffect(fetch)`)
- [ ] Query keys hierarchical and typed
- [ ] Optimistic updates roll back on error
- [ ] Invalidation strategy explicit
- [ ] URL is the source of truth for filters / pagination
- [ ] Zustand selectors used (not whole state)
- [ ] No PII persisted to localStorage

## Forbidden

❌ Stashing server data in Zustand
❌ Mirroring URL state into local state
❌ Global "god" store
❌ Async logic inside Zustand
❌ Reading the whole Zustand store in a component (causes re-renders)
