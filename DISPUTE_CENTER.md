# Dispute Management Center

Production-ready customer dispute filing and admin investigation workflow for DLM.

## Overview

Customers can report order issues with **photos** and **notes**. Admins review disputes with full order evidence: chain-of-custody timeline, pickup photos, delivery proof, inventory records, and OTP verification.

## Dispute types

| Type | Label |
| ---- | ----- |
| `missing_item` | Missing Item |
| `damaged_item` | Damaged Item |
| `wrong_item` | Wrong Item |
| `late_delivery` | Late Delivery |
| `quality_issue` | Quality Issue |

Legacy enum values (`missing_items`, `damaged_items`, `delayed_delivery`, `refund_request`) remain readable for older records.

## Status workflow

| Status | Meaning |
| ------ | ------- |
| `open` | Newly filed — awaiting review |
| `investigating` | Admin is reviewing evidence |
| `resolved` | Issue closed in customer's favour or addressed |
| `rejected` | Dispute not upheld |
| `escalated` | Escalated for senior review |

Status changes append immutable rows to `complaint_status_events`.

## Database

### `complaints` (existing, extended)

Core dispute record: `user_id`, `order_id`, `complaint_type`, `description`, `status`, `admin_notes`.

### `complaint_photos` (new)

| Column | Description |
| ------ | ----------- |
| `complaint_id` | Parent dispute |
| `original_storage_key` / `compressed_storage_key` | Image storage |
| `uploaded_by_user_id` | Customer who filed |
| `sort_index` | Display order |
| `created_at` | Immutable timestamp |

Max **5 photos** per dispute. Storage: `backend/uploads/dispute-photos/{complaint_id}/{photo_id}/`

### `complaint_status_events` (new)

Append-only status history with `status`, `actor_user_id`, `actor_role`, `note`, `created_at`.

**Migration:** `backend/alembic/versions/20260603_0011_dispute_management.py`

## API

Base path: `/api/v1`

### File dispute (customer)

`POST /complaints`

- **Auth:** Bearer JWT, role `customer`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `order_id` — required UUID (must belong to customer)
  - `complaint_type` — enum
  - `description` — notes (10–5000 chars)
  - `files` — 0–5 images
- **Side effect:** Creates `open` status event

### List / detail (customer)

| Endpoint | Description |
| -------- | ----------- |
| `GET /complaints` | Customer's disputes |
| `GET /complaints/{id}` | Detail with photos, status timeline, inventory, delivery proof |

### Admin

| Endpoint | Description |
| -------- | ----------- |
| `GET /complaints/admin/list` | All disputes with customer name |
| `GET /complaints/admin/{id}` | Full evidence bundle |
| `PATCH /complaints/admin/{id}/status` | Update status + notes |

Admin detail includes:

- Dispute photos and status timeline
- **Chain of custody** timeline (`custody_timeline`)
- **Pickup evidence** (`pickup_evidence[]`)
- **Delivery proof** (`delivery_proof`)
- **Inventory verification** + history count
- **OTP verification** (`delivery_verification`)

### Protected photos

| Endpoint | Variant |
| -------- | ------- |
| `GET /complaint-photos/{id}/compressed` | Thumbnail |
| `GET /complaint-photos/{id}/original` | Full size |

Access: dispute owner or admin.

## Frontend

| Surface | Route / component |
| ------- | ----------------- |
| Customer dispute center | `/disputes` → `DisputeCenterView` |
| File from order | `FileDisputeForm` on order tracking |
| Admin disputes | `/admin/disputes` → `AdminDisputesPanel` |

**Services:** `frontend/services/disputes.ts`

**Feature module:** `frontend/features/disputes/`

## Configuration

```env
DISPUTE_UPLOAD_DIR=uploads/dispute-photos
```

## Security

- JWT required on all endpoints
- Customers can only file disputes on their own orders
- Photo bytes served after ownership check
- Dispute photos immutable after upload
- Admin-only status updates with audit trail

## Local development

```bash
cd backend
alembic upgrade head
uvicorn app.main:app --reload

cd frontend
npm run dev
```

## Tests

```bash
cd backend
pytest tests/api/test_disputes.py -v
```

## Related systems

- [CHAIN_OF_CUSTODY.md](./CHAIN_OF_CUSTODY.md) — order audit timeline
- [PICKUP_EVIDENCE.md](./PICKUP_EVIDENCE.md) — pickup photos
- [DELIVERY_PROOF.md](./DELIVERY_PROOF.md) — delivery photos
- [INVENTORY_VERIFICATION.md](./INVENTORY_VERIFICATION.md) — item counts
- [DELIVERY_OTP.md](./DELIVERY_OTP.md) — OTP verification

## Future enhancements (out of scope)

- Partner visibility into disputes for their laundry
- Email/push notifications on status change
- Refund workflow integration
- SLA timers and auto-escalation
