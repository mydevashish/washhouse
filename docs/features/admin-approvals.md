# Feature: Admin approvals and areas

> Status: planned  
> Last updated: 2026-06-01

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/admin/laundries/pending` | Approval queue | admin |
| POST | `/api/v1/admin/laundries/{id}/approve` | Approve | admin |
| POST | `/api/v1/admin/laundries/{id}/reject` | Reject | admin |
| GET | `/api/v1/admin/service-areas` | Cities/zones | admin |
| PUT | `/api/v1/admin/service-areas` | Enable/disable | admin |
| GET | `/api/v1/admin/dashboard` | KPI summary | admin |

## Frontend

- `frontend/app/(admin)/`, `frontend/features/admin-dashboard/`
