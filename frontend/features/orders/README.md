# `features/orders`

Customer + partner order flows: list, detail, place, track, cancel.

## Structure (target)

```
orders/
├── components/
│   ├── order-card.tsx
│   ├── order-list.tsx
│   ├── order-detail.tsx
│   ├── order-form.tsx
│   ├── order-status-badge.tsx
│   ├── order-skeleton.tsx
│   └── order-empty.tsx
├── api/
│   ├── orders.ts          # axios calls
│   ├── queries.ts         # useOrders, useOrder
│   └── mutations.ts       # useCreateOrder, useCancelOrder
├── schemas/
│   └── create-order.schema.ts
├── hooks/
│   └── use-order-status.ts
├── types/
└── index.ts
```

## Rules

- TanStack Query for all server reads.
- Optimistic update on cancel.
- Status badge color via `order-status-badge` (single source).
- Mobile-first: card list on mobile, table on `md+`.
