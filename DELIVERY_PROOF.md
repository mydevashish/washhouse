# Delivery Proof System

Production-ready delivery photo capture for DLM delivery agents. Proof is immutable after upload and visible to customers, admins, and in the dispute center.

## Overview

When a delivery agent completes handoff, they must capture **one delivery photo** before OTP verification and order completion. Each record stores:

| Field | Description |
| ----- | ----------- |
| Original image | Full-resolution file as uploaded |
| Compressed image | JPEG max 1280px width, quality 82 |
| `captured_at` | Client-provided or server UTC timestamp |
| `latitude` / `longitude` | GPS from device (optional but recommended) |
| `uploaded_by_user_id` | Delivery agent (partner user) who uploaded |
| `device_info` | JSON: user agent, platform, language, screen, timezone |
| `created_at` | Server upload timestamp (immutable) |

Photos are linked to **order ID**, **customer ID**, and **laundry ID**. **One proof per order** (enforced by unique `order_id`).

## Database

**Table:** `delivery_proof_photos`

```sql
CREATE TABLE delivery_proof_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  laundry_id UUID NOT NULL REFERENCES laundries(id) ON DELETE RESTRICT,
  original_storage_key VARCHAR(512) NOT NULL,
  compressed_storage_key VARCHAR(512) NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  device_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Migration:** `backend/alembic/versions/20260603_0009_delivery_proof.py`

**Immutability:** No `updated_at`, no soft delete, no PATCH/DELETE APIs. Second upload returns **409 Conflict**.

**Storage:** `backend/uploads/delivery-proof/{order_id}/{photo_id}/original.*` and `compressed.jpg`

## API

Base path: `/api/v1`

### Upload (partner / delivery agent)

`POST /partner/orders/{order_id}/delivery-proof`

- **Auth:** Bearer JWT, role `partner`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `file` — single image (JPEG, PNG, WebP; max 10 MB)
  - `latitude` — optional float
  - `longitude` — optional float
  - `captured_at` — optional ISO datetime
  - `device_info` — optional JSON string (client device metadata)
- **Rules:**
  - Order must belong to partner’s laundry
  - Order status must be `out_for_delivery`
  - No prior delivery proof for this order
- **Side effect:** Appends `order_status_events` row with `note = "Delivery proof uploaded"`

### Get proof

| Endpoint | Role |
| -------- | ---- |
| `GET /orders/{order_id}/delivery-proof` | Customer (order owner) |
| `GET /partner/orders/{order_id}/delivery-proof` | Partner |
| `GET /admin/orders/{order_id}/delivery-proof` | Admin |

Customer order detail (`GET /orders/{order_id}`) also includes `delivery_proof` (object or `null`).

Complaint detail (`GET /complaints/{complaint_id}`) includes `delivery_proof` when linked to an order.

### Protected image delivery

| Endpoint | Variant |
| -------- | ------- |
| `GET /delivery-proof/photos/{photo_id}/compressed` | Gallery / thumbnails |
| `GET /delivery-proof/photos/{photo_id}/original` | Full resolution |

Requires JWT; access granted if viewer is order customer, owning partner, or admin.

### Delivery completion gate

`POST /partner/orders/{order_id}/delivery/verify` returns **422** if no delivery proof exists.

Delivery proof must be uploaded **before** OTP verification completes the order.

## Timeline

On successful upload, an append-only event is written:

```json
{
  "status": "out_for_delivery",
  "note": "Delivery proof uploaded",
  "created_at": "..."
}
```

The customer **Order Details** page shows this note in the order journey and renders the delivery proof card below.

## Frontend

| Location | Component |
| -------- | --------- |
| Partner orders (mobile card) | `DeliveryProofUpload` when status is `out_for_delivery` and no proof yet |
| Partner orders | `DeliveryProofDisplay` after upload; then `DeliveryOtpVerifyForm` |
| Customer `/orders/[id]` | Timeline note + `DeliveryProofDisplay` |
| Admin orders table | **Delivery** button → `AdminDeliveryProofDialog` |
| Dispute center | `DeliveryProofDisplay` with device metadata on complaint detail |

**Feature module:** `frontend/features/delivery-proof/`

**Service:** `frontend/services/delivery-proof.ts`

Images are loaded via authenticated blob fetch (`DeliveryProofImage`) because URLs require `Authorization`.

## Partner delivery flow

1. Order status → `out_for_delivery` (delivery OTP auto-generated)
2. Agent uploads **delivery proof photo** (GPS + device info captured)
3. Agent asks customer for 6-digit OTP
4. Agent submits OTP → order marked `delivered`

Steps 2 and 3 are enforced server-side; step 4 fails without proof.

## Configuration

```env
# backend/.env (optional override)
DELIVERY_PROOF_UPLOAD_DIR=uploads/delivery-proof
```

## Security

- JWT required for all read/write endpoints
- Image bytes served only after order ownership check
- No delete or replace endpoints
- File type and size validated server-side (shared `image_processing` module)
- GPS validated to WGS84 ranges
- `device_info` stored as opaque JSONB for dispute audit

## Dependencies

- **Pillow** — server-side compression (already in `backend/requirements/base.txt`)

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

## Tests

```bash
cd backend
pytest tests/api/test_delivery_proof.py -v
```

## Related systems

- **Delivery OTP** (`DELIVERY_OTP.md`) — OTP verification runs after proof upload
- **Pickup evidence** (`PICKUP_EVIDENCE.md`) — symmetric pickup-side photo capture
- **Dispute center** — complaint detail surfaces proof for resolution

## Future enhancements (out of scope)

- S3/R2 object storage adapter
- Signed short-lived image URLs for CDN
- Multiple angles (doorstep + package) with composite proof record
- EXIF timestamp extraction as fallback for `captured_at`
