# Pickup Evidence System

Production-ready pickup photo capture for DLM partners and pickup agents. Evidence is immutable after upload and visible to customers and admins.

## Overview

When a partner or pickup agent collects clothes, they must capture **1–10 photos** before marking an order as **picked up**. Each photo stores:

| Field | Description |
| ----- | ----------- |
| Original image | Full-resolution file as uploaded |
| Compressed image | JPEG max 1280px width, quality 82 |
| `captured_at` | Client-provided or server UTC timestamp |
| `latitude` / `longitude` | GPS from device (optional but recommended) |
| `uploaded_by_user_id` | Partner user who uploaded |
| `created_at` | Server upload timestamp (immutable) |

Photos are linked to **order ID**, **customer ID**, and **laundry ID**.

## Database

**Table:** `pickup_evidence_photos`

```sql
CREATE TABLE pickup_evidence_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  laundry_id UUID NOT NULL REFERENCES laundries.id ON DELETE RESTRICT,
  original_storage_key VARCHAR(512) NOT NULL,
  compressed_storage_key VARCHAR(512) NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Migration:** `backend/alembic/versions/20260603_0006_pickup_evidence.py`

**Immutability:** No `updated_at`, no soft delete, no PATCH/DELETE APIs. One upload batch per order (enforced in service).

**Storage:** `backend/uploads/pickup-evidence/{order_id}/{photo_id}/original.*` and `compressed.jpg`

## API

Base path: `/api/v1`

### Upload (partner)

`POST /partner/orders/{order_id}/pickup-evidence`

- **Auth:** Bearer JWT, role `partner`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `files` — 1–10 image files (JPEG, PNG, WebP; max 10 MB each)
  - `latitude` — optional float
  - `longitude` — optional float
  - `captured_at` — optional ISO datetime
- **Rules:**
  - Order must belong to partner’s laundry
  - Order status must be `confirmed` or `pickup_assigned`
  - No prior evidence for this order
- **Side effect:** Appends `order_status_events` row with `note = "Pickup photos uploaded"`

### List evidence

| Endpoint | Role |
| -------- | ---- |
| `GET /orders/{order_id}/pickup-evidence` | Customer (order owner) |
| `GET /partner/orders/{order_id}/pickup-evidence` | Partner |
| `GET /admin/orders/{order_id}/pickup-evidence` | Admin |

Customer order detail (`GET /orders/{order_id}`) also includes `pickup_evidence[]`.

### Protected image delivery

| Endpoint | Variant |
| -------- | ------- |
| `GET /pickup-evidence/photos/{photo_id}/compressed` | Gallery / thumbnails |
| `GET /pickup-evidence/photos/{photo_id}/original` | Full resolution |

Requires JWT; access granted if viewer is order customer, owning partner, or admin.

### Pickup completion gate

`PATCH /partner/orders/{order_id}/status` with `status: picked_up` returns **422** if no pickup evidence exists.

## Timeline

On successful upload, an append-only event is written:

```json
{
  "status": "<current order status>",
  "note": "Pickup photos uploaded",
  "created_at": "..."
}
```

The customer **Order Details** page shows this note in the order journey and renders the photo gallery below.

## Frontend

| Location | Component |
| -------- | --------- |
| Partner orders (mobile card) | `PickupEvidenceUpload` when status is `pickup_assigned` |
| Partner orders | `PickupEvidenceGallery` after upload |
| Customer `/orders/[id]` | Gallery + timeline note |
| Admin orders table | **Photos** button → `AdminPickupEvidenceDialog` |

**Feature module:** `frontend/features/pickup-evidence/`

**Service:** `frontend/services/pickup-evidence.ts`

Images are loaded via authenticated blob fetch (`PickupEvidenceImage`) because URLs require `Authorization`.

## Configuration

```env
# backend/.env (optional override)
PICKUP_EVIDENCE_UPLOAD_DIR=uploads/pickup-evidence
```

## Security

- JWT required for all read/write endpoints
- Image bytes served only after order ownership check
- No delete or replace endpoints
- File type and size validated server-side
- GPS validated to WGS84 ranges

## Dependencies

- **Pillow** — server-side compression (`backend/requirements/base.txt`)

## Local development

```bash
# Backend
cd backend
DLM_env\Scripts\activate
pip install -r requirements/base.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```

**Partner flow:** Accept order → status `pickup_assigned` → upload 1–10 photos → **Mark picked up**.

## Tests

```bash
cd backend
pytest tests/api/test_pickup_evidence.py -v
```

## Future enhancements (out of scope)

- S3/R2 object storage adapter
- Signed short-lived image URLs for CDN
- Dedicated `delivery` role staff login for pickup-only agents
- EXIF timestamp extraction as fallback for `captured_at`
