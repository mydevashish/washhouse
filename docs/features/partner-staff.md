# Feature: Partner staff management

> Status: in progress (Owner Command Center P6 — 2026-08-08)  
> Last updated: 2026-08-08

## Goal

Owners manage a **usable roster** — who can pick up, who can deliver, and calm add/edit — while **assign-to-run** stays on Logistics cards (operations APIs).

## Data model

- `partner_staff`: laundry_id, user_id or name, role enum (canonical): `pickup_agent` | `delivery_agent` | `operator` | `manager` | `support_staff` (+ legacy aliases `pickup_only` / `delivery_only` / `inventory` / `full_access`)
- Optional `work_schedule` (days + start/end, Asia/Kolkata) — used for local “on shift” hints

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/partner/staff-management` | List | partner |
| GET | `/api/v1/partner/staff-management/dashboard` | Counts | partner |
| GET | `/api/v1/partner/staff-management/activity` | Activity log | partner |
| POST | `/api/v1/partner/staff-management` | Add | partner |
| PATCH | `/api/v1/partner/staff-management/{id}` | Update | partner |
| POST | `…/activate` · `deactivate` · `suspend` · `unsuspend` · `reset-password` | Lifecycle | partner |
| POST | operations assign / reassign driver | Assign to pickup/delivery run | partner |

Legacy short paths in older docs (`/partner/staff`) may redirect or alias — FE uses `staff-management` + `/partner/staff` page.

## UX (Owner Command Center)

- Illustrated roster cards (role art + Active / Suspended / Offline + schedule)
- Coverage today: “Who can run pickups?” / “Who can deliver?”
- Add/Edit in dialog with role picker (image + one-line capability)
- Deep links: `/partner/staff?capability=pickup|delivery&action=add` from Logistics
- Empty: “Add your first helper”

## Acceptance criteria

- [x] Assign staff to order on status `pickup_assigned` / `out_for_delivery` via Logistics run card (operations assign) — P4/P6
- [x] Roster shows role imagery + status (not color-only) — P6
- [x] Coverage checklist for pickup/delivery — P6
- [x] Deep link from Logistics gap → pre-filtered staff / add helper — P6
- [ ] Optional on-shift server flag (currently derived client-side from schedule)

## Related

- [partner-owner-command-center.md](./partner-owner-command-center.md) (People › Staff)
- FE: `frontend/features/partner/views/partner-staff-view.tsx`, `lib/owner-staff.ts`
