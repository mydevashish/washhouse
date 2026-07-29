# Feature: Admin approvals and areas

> Status: **shipped** (API + FE; audit on approve/reject 2026-07-28)  
> Last updated: 2026-07-28

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/admin/laundries/pending` | Approval queue | admin |
| POST | `/api/v1/admin/laundries/{id}/approve` | Approve (audit `laundry_approved`) | admin |
| POST | `/api/v1/admin/laundries/{id}/reject` | Reject (audit `laundry_rejected`) | admin |
| GET | `/api/v1/admin/service-areas` | Cities/zones | admin |
| PUT | `/api/v1/admin/service-areas` | Enable/disable | admin |
| GET | `/api/v1/admin/dashboard` | KPI summary | admin |

## Frontend

- `frontend/app/(admin)/`, `frontend/features/admin/` — confirmation dialog before approve/reject

## Tests

- Pytest chain: `backend/tests/api/test_admin_marketplace_chain.py`
- Playwright surfaces: `frontend/tests/e2e/admin-marketplace-chain.spec.ts`
