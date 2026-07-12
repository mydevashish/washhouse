# Chain Of Custody Timeline

Production-ready immutable audit trail for every order handoff in DLM. Each milestone is recorded automatically with timestamp, actor, role, and metadata.

## Overview

The chain of custody answers: **who touched this order, when, and in what capacity?** Events are append-only — no updates or deletes.

| Field | Description |
| ----- | ----------- |
| `event_type` | Canonical milestone identifier |
| `created_at` | Server UTC timestamp (immutable) |
| `actor_user_id` | User who performed the action (`null` for system) |
| `actor_role` | `customer`, `partner`, `admin`, `system`, or `delivery` |
| `metadata` | JSON context (GPS, counts, status, etc.) |

## Event types

| Event | Label | Trigger |
| ----- | ----- | ------- |
| `order_confirmed` | Order Confirmed | Customer places order |
| `pickup_assigned` | Pickup Assigned | Partner accepts order |
| `pickup_photos_uploaded` | Pickup Photos Uploaded | Partner uploads pickup evidence |
| `inventory_recorded` | Inventory Recorded | Partner records item counts |
| `inventory_confirmed` | Inventory Confirmed | Customer confirms inventory |
| `pickup_completed` | Pickup Completed | Partner marks picked up |
| `washing_started` | Washing Started | Partner advances to washing |
| `ironing_started` | Ironing Started | Partner advances to ironing |
| `packaging_completed` | Packaging Completed | Partner marks ready |
| `delivery_assigned` | Delivery Assigned | Partner marks out for delivery |
| `delivery_proof_uploaded` | Delivery Proof Uploaded | Agent uploads delivery photo |
| `otp_verified` | OTP Verified | Agent verifies customer OTP |
| `delivered` | Delivered | Order completed after OTP |
| `order_cancelled` | Order Cancelled | Partner rejects / cancels |

## Database

**Table:** `order_custody_events`

```sql
CREATE TYPE custody_event_type AS ENUM (
  'order_confirmed', 'pickup_assigned', 'pickup_photos_uploaded',
  'inventory_recorded', 'inventory_confirmed', 'pickup_completed',
  'washing_started', 'ironing_started', 'packaging_completed',
  'delivery_assigned', 'delivery_proof_uploaded', 'otp_verified',
  'delivered', 'order_cancelled'
);

CREATE TYPE custody_actor_role AS ENUM (
  'customer', 'partner', 'admin', 'system', 'delivery'
);

CREATE TABLE order_custody_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type custody_event_type NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role custody_actor_role NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Migration:** `backend/alembic/versions/20260603_0010_chain_of_custody.py`

**Immutability:** No PATCH/DELETE APIs. Events are never modified after insert.

## API

Base path: `/api/v1`

| Endpoint | Role |
| -------- | ---- |
| `GET /orders/{order_id}/custody-timeline` | Customer (order owner) |
| `GET /partner/orders/{order_id}/custody-timeline` | Partner |
| `GET /admin/orders/{order_id}/custody-timeline` | Admin |

Customer order detail (`GET /orders/{order_id}`) also includes `custody_timeline`.

### Response shape

```json
{
  "order_id": "uuid",
  "events": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "event_type": "pickup_assigned",
      "label": "Pickup Assigned",
      "actor_user_id": "uuid",
      "actor_role": "partner",
      "actor_name": "Raj Laundry",
      "metadata": { "status": "pickup_assigned" },
      "created_at": "2026-06-03T10:00:00Z"
    }
  ]
}
```

## Automatic recording

Events are emitted from existing services — no manual API to create events:

| Service | Events recorded |
| ------- | ----------------- |
| `OrderService.create_order` | `order_confirmed` |
| `OrderService.update_status_partner` | Status-mapped milestones |
| `PickupEvidenceService` | `pickup_photos_uploaded` |
| `InventoryVerificationService` | `inventory_recorded`, `inventory_confirmed` |
| `DeliveryProofService` | `delivery_proof_uploaded` |
| `DeliveryOtpService.verify_and_complete_delivery` | `otp_verified`, `delivered` |

Legacy `order_status_events` (status + note) remain for backward compatibility and WebSocket updates.

## Frontend

| Surface | Component |
| ------- | --------- |
| Customer `/orders/[id]` | `ChainOfCustodyTimeline` (from order detail) |
| Partner orders table | Shield button → `CustodyTimelineDialog` |
| Admin orders table | **Custody** button → `CustodyTimelineDialog` |

**Feature module:** `frontend/features/chain-of-custody/`

**Service:** `frontend/services/custody-timeline.ts`

## Typical custody sequence

```
Order Confirmed (customer)
  → Pickup Assigned (partner)
  → Pickup Photos Uploaded (partner)
  → Inventory Recorded (partner)
  → Inventory Confirmed (customer)
  → Pickup Completed (partner)
  → Washing Started (partner)
  → Ironing Started (partner)
  → Packaging Completed (partner)
  → Delivery Assigned (partner)
  → Delivery Proof Uploaded (partner)
  → OTP Verified (partner)
  → Delivered (partner)
```

## Security

- JWT required on all timeline endpoints
- Customer sees only own orders; partner only own laundry orders; admin sees all
- Actor names resolved from `users.full_name` at read time
- Metadata may contain GPS coordinates — same access rules as order detail

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
pytest tests/api/test_custody_timeline.py -v
```

## Notes

- **Existing orders:** Events are recorded from deployment forward; historical orders before migration have no custody rows.
- **Related docs:** `PICKUP_EVIDENCE.md`, `INVENTORY_VERIFICATION.md`, `DELIVERY_OTP.md`, `DELIVERY_PROOF.md`

## Future enhancements (out of scope)

- WebSocket push when new custody event appended
- Export custody PDF for disputes
- Backfill script from legacy `order_status_events`
