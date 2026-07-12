# Admin operations console

> Status: **shipped** (v1 redesign)  
> Last updated: 2026-06-02

## UX goal

Admins understand platform health within **10 seconds** of login: laundries, customers, orders, revenue, commission, approvals, and alerts.

## Layout

- **Left sidebar** — module navigation (responsive drawer on mobile)
- **Top bar** — context title, quick search placeholder, logout
- **Main area** — module content
- **Right panel** (xl+) — operational alerts and today’s snapshot

## Routes

| Path | Module |
| ---- | ------ |
| `/admin` | Overview + KPIs + charts |
| `/admin/approvals` | Approval center |
| `/admin/laundries` | Laundry management + create |
| `/admin/customers` | Customer table |
| `/admin/orders` | Orders table |
| `/admin/revenue` | Revenue + transactions |
| `/admin/commission` | Global + per-laundry commission |
| `/admin/audit` | Audit logs |
| `/admin/notifications` | Alert feed |
| `/admin/settings` | Platform settings + RBAC preview |

## APIs

| Endpoint | Purpose |
| -------- | ------- |
| `GET /admin/dashboard` | KPI snapshot |
| `GET /admin/analytics?days=14` | Chart series + top cities/laundries |
| `GET /admin/laundries/management` | Enriched laundry rows |
| `GET /admin/audit-logs` | Audit trail |
| `PATCH /admin/laundries/{id}/commission` | Per-laundry override |

## Frontend structure

- Shell: `components/layout/admin-shell.tsx`
- Views: `features/admin/views/*`
- Charts: Recharts in `features/admin/charts/`
