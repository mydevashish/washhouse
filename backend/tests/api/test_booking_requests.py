"""Booking request API suite — public / admin / partner authz + CRM flows.

Covers the QA matrix:
1. Public create happy path + validation (+ rate limit)
2. Book Now payload mapping
3. Admin list filters + pagination
4. Admin update / soft delete / restore
5. Admin assign + transfer (events)
6. Admin respond → message + status/timestamps
7. Partner list assigned-only
8. Partner IDOR (unassigned / other laundry)
9. Partner respond + update allowed fields
10. Phone lookup chronological history
11. Create-on-behalf (admin + partner)
12. Duplicate open request behavior
13. Auth: anonymous mutate blocked; wrong role 403
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from uuid import UUID

from app.models.booking_request import BookingRequest
from app.models.enums import LaundryStatus, UserRole
from app.models.laundry import Laundry, LaundryService
from app.models.user import User

pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
def _disable_redis_rate_limit_middleware():
    """Exercise service-layer phone/IP limits, not Redis middleware."""
    with patch.object(settings, "RATE_LIMIT_ENABLED", False):
        yield


PUBLIC_PAYLOAD = {
    "customer_name": "Priya Sharma",
    "phone": "+919876543210",
    "service_type": "wash-fold",
    "preferred_time_window": "morning",
    "notes": "≈8 kg",
    "city": "Bengaluru",
    "pincode": "560034",
    "source": "marketing_home",
}


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _unique_phone(suffix: int | None = None) -> str:
    """Generate a valid Indian mobile (+91 9XXXXXXXXX) unique enough for one test."""
    n = suffix if suffix is not None else int(uuid4().hex[:8], 16) % 1_000_000_000
    return f"+919{n:09d}"


async def _make_partner_with_laundry(
    session: AsyncSession,
    *,
    prefix: str,
    city: str = "Bengaluru",
) -> tuple[User, Laundry, dict[str, str]]:
    partner = User(
        email=f"{prefix}.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name=f"{prefix} Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()
    laundry = Laundry(
        owner_user_id=partner.id,
        name=f"{prefix} Laundry",
        slug=f"{prefix}-{uuid4().hex[:8]}",
        city=city,
        address_line="1 Test Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()
    token = create_access_token(subject=str(partner.id), role=UserRole.partner.value)
    return partner, laundry, _headers(token)


async def _admin_detail(
    client: AsyncClient,
    admin_headers: dict[str, str],
    request_id: str,
) -> dict:
    response = await client.get(
        f"/api/v1/admin/booking-requests/{request_id}",
        headers=admin_headers,
    )
    assert response.status_code == 200
    return response.json()["data"]


# ---------------------------------------------------------------------------
# 1. Public create happy path + validation (+ rate limit)
# ---------------------------------------------------------------------------
class TestPublicCreate:
    async def test_happy_path(self, client: AsyncClient) -> None:
        response = await client.post("/api/v1/booking-requests", json=PUBLIC_PAYLOAD)
        assert response.status_code == 201
        body = response.json()
        assert body["data"]["status"] == "new"
        assert body["data"]["public_code"].startswith("BR-")
        assert body["meta"]["duplicate_warning"] is False
        assert body["meta"]["open_request_ids"] == []

    async def test_invalid_phone(self, client: AsyncClient) -> None:
        payload = {**PUBLIC_PAYLOAD, "phone": "12345"}
        response = await client.post("/api/v1/booking-requests", json=payload)
        assert response.status_code == 422

    @pytest.mark.parametrize(
        "missing_field",
        ["customer_name", "phone", "service_type", "preferred_time_window"],
    )
    async def test_required_fields(self, client: AsyncClient, missing_field: str) -> None:
        payload = {k: v for k, v in PUBLIC_PAYLOAD.items() if k != missing_field}
        response = await client.post("/api/v1/booking-requests", json=payload)
        assert response.status_code == 422

    async def test_empty_name_rejected(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "customer_name": "   "},
        )
        assert response.status_code == 422

    async def test_invalid_pincode(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "pincode": "56AB"},
        )
        assert response.status_code == 422

    async def test_rate_limited_by_phone(self, client: AsyncClient) -> None:
        phone = _unique_phone()
        payload = {**PUBLIC_PAYLOAD, "phone": phone}
        for _ in range(3):
            response = await client.post("/api/v1/booking-requests", json=payload)
            assert response.status_code == 201

        limited = await client.post("/api/v1/booking-requests", json=payload)
        assert limited.status_code == 429
        assert limited.json()["error"]["code"] == "RATE_LIMITED"

    async def test_ignores_client_laundry_id(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "assigned_laundry_id": str(uuid4())},
        )
        # extra=forbid → 422 rather than trusting client laundry
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# 2. Book Now payload mapping (service / preferred time / message → fields)
# ---------------------------------------------------------------------------
class TestBookNowPayloadMapping:
    async def test_maps_service_time_and_message_to_persisted_fields(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
    ) -> None:
        """Mirrors mapBookPickupToBookingRequest: service→service_type, etc."""
        phone = _unique_phone()
        book_now_body = {
            "customer_name": "Asha Nair",
            "phone": phone,
            "service_type": "dry-clean",
            "preferred_time_window": "evening",
            "notes": "Silk saree — handle with care",
            "source": "services",
        }
        created = await client.post("/api/v1/booking-requests", json=book_now_body)
        assert created.status_code == 201
        request_id = created.json()["data"]["id"]

        detail = await _admin_detail(client, admin_headers, request_id)
        assert detail["customer_name"] == "Asha Nair"
        assert detail["phone_e164"] == phone
        assert detail["service_type"] == "dry-clean"
        assert detail["preferred_time_window"] == "evening"
        assert detail["notes"] == "Silk saree — handle with care"
        assert detail["source"] == "services"
        assert detail["created_by_role"] == "public"
        assert detail["status"] == "new"
        assert detail["assigned_laundry_id"] is None


# ---------------------------------------------------------------------------
# 3. Admin list filters + pagination
# ---------------------------------------------------------------------------
class TestAdminListFiltersPagination:
    async def test_filters_status_unassigned_source_and_pagination(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry, _ = await _make_partner_with_laundry(db_session, prefix="br.list")

        phones = [_unique_phone(i) for i in range(1, 5)]
        ids: list[str] = []
        for phone in phones:
            created = await client.post(
                "/api/v1/booking-requests",
                json={**PUBLIC_PAYLOAD, "phone": phone, "source": "stores"},
            )
            assert created.status_code == 201
            ids.append(created.json()["data"]["id"])

        # Assign one so unassigned filter can exclude it
        await client.post(
            f"/api/v1/admin/booking-requests/{ids[0]}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry.id)},
        )

        page1 = await client.get(
            "/api/v1/admin/booking-requests",
            headers=admin_headers,
            params={
                "page": 1,
                "page_size": 2,
                "status": "new",
                "unassigned": True,
                "source": "stores",
            },
        )
        assert page1.status_code == 200
        body = page1.json()
        assert len(body["data"]) == 2
        assert body["meta"]["pagination"]["page"] == 1
        assert body["meta"]["pagination"]["per_page"] == 2
        assert body["meta"]["pagination"]["total"] == 3
        assert body["meta"]["pagination"]["has_next"] is True
        assert all(row["status"] == "new" for row in body["data"])
        assert all(row["assigned_laundry_id"] is None for row in body["data"])
        assert all(row["source"] == "stores" for row in body["data"])
        assert "inbox" in body["meta"]

        page2 = await client.get(
            "/api/v1/admin/booking-requests",
            headers=admin_headers,
            params={
                "page": 2,
                "page_size": 2,
                "status": "new",
                "unassigned": True,
                "source": "stores",
            },
        )
        assert page2.status_code == 200
        assert len(page2.json()["data"]) == 1
        assert page2.json()["meta"]["pagination"]["has_previous"] is True

        by_laundry = await client.get(
            "/api/v1/admin/booking-requests",
            headers=admin_headers,
            params={"assigned_laundry_id": str(laundry.id)},
        )
        assert by_laundry.status_code == 200
        assert any(row["id"] == ids[0] for row in by_laundry.json()["data"])

    async def test_q_search_by_public_code(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
    ) -> None:
        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        code = created.json()["data"]["public_code"]
        listed = await client.get(
            "/api/v1/admin/booking-requests",
            headers=admin_headers,
            params={"q": code},
        )
        assert listed.status_code == 200
        assert any(row["public_code"] == code for row in listed.json()["data"])


# ---------------------------------------------------------------------------
# 4. Admin update / soft delete / restore
# ---------------------------------------------------------------------------
class TestAdminUpdateSoftDeleteRestore:
    async def test_update_mutable_fields(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
    ) -> None:
        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]

        patched = await client.patch(
            f"/api/v1/admin/booking-requests/{request_id}",
            headers=admin_headers,
            json={
                "customer_name": "Priya S.",
                "service_type": "wash-iron",
                "preferred_time_window": "afternoon",
                "notes": "Updated notes",
                "city": "Mysuru",
                "pincode": "570001",
                "priority": "high",
                "status": "reviewing",
            },
        )
        assert patched.status_code == 200
        data = patched.json()["data"]
        assert data["customer_name"] == "Priya S."
        assert data["service_type"] == "wash-iron"
        assert data["preferred_time_window"] == "afternoon"
        assert data["notes"] == "Updated notes"
        assert data["city"] == "Mysuru"
        assert data["pincode"] == "570001"
        assert data["priority"] == "high"
        assert data["status"] == "reviewing"

        detail = await _admin_detail(client, admin_headers, request_id)
        assert any(e["event_type"] == "status_changed" for e in detail["events"])
        assert any(e["event_type"] == "updated" or e["event_type"] == "status_changed" for e in detail["events"])

    async def test_soft_delete_and_restore(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
    ) -> None:
        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]

        deleted = await client.delete(
            f"/api/v1/admin/booking-requests/{request_id}",
            headers=admin_headers,
        )
        assert deleted.status_code == 200
        assert deleted.json()["data"]["deleted_at"] is not None

        listed = await client.get("/api/v1/admin/booking-requests", headers=admin_headers)
        assert all(row["id"] != request_id for row in listed.json()["data"])

        with_deleted = await client.get(
            "/api/v1/admin/booking-requests",
            headers=admin_headers,
            params={"include_deleted": True},
        )
        assert any(row["id"] == request_id for row in with_deleted.json()["data"])

        restored = await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/restore",
            headers=admin_headers,
        )
        assert restored.status_code == 200
        assert restored.json()["data"]["deleted_at"] is None

        detail = await _admin_detail(client, admin_headers, request_id)
        event_types = {e["event_type"] for e in detail["events"]}
        assert "soft_deleted" in event_types
        assert "restored" in event_types


# ---------------------------------------------------------------------------
# 5. Admin assign + transfer between laundries (events recorded)
# ---------------------------------------------------------------------------
class TestAdminAssignTransfer:
    async def test_assign_then_transfer_records_events(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry_a, partner_a_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.a",
        )
        _, laundry_b, partner_b_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.b",
            city="Mumbai",
        )

        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]

        assigned = await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry_a.id)},
        )
        assert assigned.status_code == 200
        assert assigned.json()["data"]["status"] == "assigned"
        assert assigned.json()["data"]["assigned_laundry_id"] == str(laundry_a.id)

        detail_after_assign = await _admin_detail(client, admin_headers, request_id)
        assigned_events = [
            e for e in detail_after_assign["events"] if e["event_type"] == "assigned"
        ]
        assert len(assigned_events) == 1
        assert assigned_events[0]["to_laundry_id"] == str(laundry_a.id)
        assert assigned_events[0]["from_laundry_id"] is None

        assert (
            await client.get(
                f"/api/v1/partner/booking-requests/{request_id}",
                headers=partner_a_headers,
            )
        ).status_code == 200

        transferred = await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry_b.id), "note": "Closer to customer"},
        )
        assert transferred.status_code == 200
        assert transferred.json()["data"]["assigned_laundry_id"] == str(laundry_b.id)

        detail_after_transfer = await _admin_detail(client, admin_headers, request_id)
        transferred_events = [
            e for e in detail_after_transfer["events"] if e["event_type"] == "transferred"
        ]
        assert len(transferred_events) == 1
        assert transferred_events[0]["from_laundry_id"] == str(laundry_a.id)
        assert transferred_events[0]["to_laundry_id"] == str(laundry_b.id)

        assert (
            await client.get(
                f"/api/v1/partner/booking-requests/{request_id}",
                headers=partner_a_headers,
            )
        ).status_code == 404
        assert (
            await client.get(
                f"/api/v1/partner/booking-requests/{request_id}",
                headers=partner_b_headers,
            )
        ).status_code == 200

    async def test_assign_inactive_laundry_rejected(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        partner = User(
            email=f"br.inactive.{uuid4().hex[:8]}@test.dlm",
            password_hash=hash_password("Partner@1234"),
            full_name="Inactive Partner",
            role=UserRole.partner,
            is_email_verified=True,
        )
        db_session.add(partner)
        await db_session.flush()
        laundry = Laundry(
            owner_user_id=partner.id,
            name="Suspended Laundry",
            slug=f"inactive-{uuid4().hex[:8]}",
            city="Bengaluru",
            address_line="1 Inactive Road",
            status=LaundryStatus.suspended,
            is_verified=True,
        )
        db_session.add(laundry)
        await db_session.flush()

        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]

        response = await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry.id)},
        )
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "VALIDATION_FAILED"

    async def test_partner_cannot_reassign(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry_a, partner_a_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.reassign.a",
        )
        _, laundry_b, _ = await _make_partner_with_laundry(db_session, prefix="br.reassign.b")

        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]
        await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry_a.id)},
        )

        response = await client.post(
            f"/api/v1/partner/booking-requests/{request_id}/assign",
            headers=partner_a_headers,
            json={"laundry_id": str(laundry_b.id)},
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# 6. Admin respond creates customer-facing message + updates status/timestamps
# ---------------------------------------------------------------------------
class TestAdminRespond:
    async def test_customer_facing_message_bumps_to_contacted(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
    ) -> None:
        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]

        # Move to reviewing so message path is exercised from an open triage status
        await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/claim",
            headers=admin_headers,
        )

        responded = await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/messages",
            headers=admin_headers,
            json={
                "body": "Hi Priya, WashHouse here — when should we pick up?",
                "visibility": "customer_facing",
            },
        )
        assert responded.status_code == 200
        data = responded.json()["data"]
        assert data["status"] == "contacted"
        assert data["last_response_at"] is not None
        assert any(
            m["visibility"] == "customer_facing"
            and "pick up" in m["body"].lower()
            for m in data["messages"]
        )
        assert any(e["event_type"] == "responded" for e in data["events"])


# ---------------------------------------------------------------------------
# 7. Partner list only assigned-to-me
# ---------------------------------------------------------------------------
class TestPartnerListAssignedOnly:
    async def test_partner_list_excludes_unassigned_and_other_laundry(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry_a, partner_a_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.plista",
        )
        _, laundry_b, partner_b_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.plistb",
        )

        unassigned = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        unassigned_id = unassigned.json()["data"]["id"]

        for_a = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        for_a_id = for_a.json()["data"]["id"]
        await client.post(
            f"/api/v1/admin/booking-requests/{for_a_id}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry_a.id)},
        )

        for_b = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        for_b_id = for_b.json()["data"]["id"]
        await client.post(
            f"/api/v1/admin/booking-requests/{for_b_id}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry_b.id)},
        )

        list_a = await client.get(
            "/api/v1/partner/booking-requests",
            headers=partner_a_headers,
        )
        assert list_a.status_code == 200
        ids_a = {row["id"] for row in list_a.json()["data"]}
        assert for_a_id in ids_a
        assert unassigned_id not in ids_a
        assert for_b_id not in ids_a

        list_b = await client.get(
            "/api/v1/partner/booking-requests",
            headers=partner_b_headers,
        )
        ids_b = {row["id"] for row in list_b.json()["data"]}
        assert for_b_id in ids_b
        assert for_a_id not in ids_b


# ---------------------------------------------------------------------------
# 8. Partner cannot access unassigned or other laundry requests (IDOR)
# ---------------------------------------------------------------------------
class TestPartnerIdor:
    async def test_unassigned_and_other_laundry_return_404(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry_a, partner_a_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.idor.a",
        )
        _, laundry_b, partner_b_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.idor.b",
        )

        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]

        assert (
            await client.get(
                f"/api/v1/partner/booking-requests/{request_id}",
                headers=partner_a_headers,
            )
        ).status_code == 404

        await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry_a.id)},
        )

        assert (
            await client.get(
                f"/api/v1/partner/booking-requests/{request_id}",
                headers=partner_a_headers,
            )
        ).status_code == 200
        assert (
            await client.get(
                f"/api/v1/partner/booking-requests/{request_id}",
                headers=partner_b_headers,
            )
        ).status_code == 404

        # Mutations also 404 for foreign laundry
        assert (
            await client.patch(
                f"/api/v1/partner/booking-requests/{request_id}",
                headers=partner_b_headers,
                json={"notes": "hack"},
            )
        ).status_code == 404
        assert (
            await client.post(
                f"/api/v1/partner/booking-requests/{request_id}/messages",
                headers=partner_b_headers,
                json={"body": "hack", "visibility": "customer_facing"},
            )
        ).status_code == 404
        assert laundry_b.id is not None


# ---------------------------------------------------------------------------
# 9. Partner respond + update allowed fields
# ---------------------------------------------------------------------------
class TestPartnerRespondAndUpdate:
    async def test_respond_and_update_allowed_fields(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry, partner_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.msg",
        )
        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]
        await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry.id)},
        )

        responded = await client.post(
            f"/api/v1/partner/booking-requests/{request_id}/messages",
            headers=partner_headers,
            json={"body": "Hi Priya, we can pick up at 10am.", "visibility": "customer_facing"},
        )
        assert responded.status_code == 200
        assert responded.json()["data"]["status"] == "contacted"
        assert responded.json()["data"]["last_response_at"] is not None
        assert any(
            m["visibility"] == "customer_facing" for m in responded.json()["data"]["messages"]
        )

        note = await client.post(
            f"/api/v1/partner/booking-requests/{request_id}/messages",
            headers=partner_headers,
            json={"body": "Called twice — no answer", "visibility": "internal"},
        )
        assert note.status_code == 200
        visibilities = {m["visibility"] for m in note.json()["data"]["messages"]}
        assert "internal" in visibilities
        assert "customer_facing" in visibilities

        updated = await client.patch(
            f"/api/v1/partner/booking-requests/{request_id}",
            headers=partner_headers,
            json={
                "notes": "Confirmed landmark near water tank",
                "preferred_time_window": "flexible",
                "status": "confirmed",
            },
        )
        assert updated.status_code == 200
        data = updated.json()["data"]
        assert data["notes"] == "Confirmed landmark near water tank"
        assert data["preferred_time_window"] == "flexible"
        assert data["status"] == "confirmed"

    async def test_partner_release_returns_to_admin_inbox(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry, partner_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.rel",
        )
        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]
        await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry.id)},
        )

        released = await client.post(
            f"/api/v1/partner/booking-requests/{request_id}/release",
            headers=partner_headers,
        )
        assert released.status_code == 200
        assert released.json()["data"]["status"] == "reviewing"
        assert released.json()["data"]["assigned_laundry_id"] is None

        assert (
            await client.get(
                f"/api/v1/partner/booking-requests/{request_id}",
                headers=partner_headers,
            )
        ).status_code == 404

        detail = await _admin_detail(client, admin_headers, request_id)
        assert detail["status"] == "reviewing"
        assert any(e["event_type"] == "released" for e in detail["events"])

    async def test_partner_cannot_soft_delete(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry, partner_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.nodel",
        )
        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]
        await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry.id)},
        )

        deleted = await client.delete(
            f"/api/v1/partner/booking-requests/{request_id}",
            headers=partner_headers,
        )
        # No partner DELETE route — FastAPI returns 405 on the detail path
        assert deleted.status_code == 405

        detail = await _admin_detail(client, admin_headers, request_id)
        assert detail["deleted_at"] is None


# ---------------------------------------------------------------------------
# 10. Phone lookup returns chronological history
# ---------------------------------------------------------------------------
class TestPhoneLookupChronological:
    async def test_admin_phone_timeline_newest_first(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        phone = _unique_phone()
        ids: list[str] = []
        for i in range(3):
            created = await client.post(
                "/api/v1/booking-requests",
                json={
                    **PUBLIC_PAYLOAD,
                    "phone": phone,
                    "notes": f"request-{i}",
                },
            )
            # First three would hit rate limit — wait, PUBLIC_PHONE_LIMIT is 3/hour
            # so only 3 creates allowed. Use admin create for extras after first public.
            if created.status_code == 429:
                break
            assert created.status_code == 201
            ids.append(created.json()["data"]["id"])

        # Add more via admin create-on-behalf (no public rate limit)
        while len(ids) < 3:
            admin_created = await client.post(
                "/api/v1/admin/booking-requests",
                headers=admin_headers,
                json={
                    "customer_name": "Priya Sharma",
                    "phone": phone,
                    "service_type": "wash-fold",
                    "preferred_time_window": "morning",
                    "notes": f"admin-{len(ids)}",
                },
            )
            assert admin_created.status_code == 201
            ids.append(admin_created.json()["data"]["id"])

        # Force distinct created_at ordering (newest last in ids → first in timeline)
        base = datetime.now(UTC) - timedelta(hours=3)
        for offset, request_id in enumerate(ids):
            row = await db_session.get(BookingRequest, UUID(request_id))
            assert row is not None
            row.created_at = base + timedelta(hours=offset)
        await db_session.flush()

        timeline = await client.get(
            f"/api/v1/admin/booking-requests/by-phone/{phone}",
            headers=admin_headers,
        )
        assert timeline.status_code == 200
        data = timeline.json()["data"]
        assert data["phone_e164"] == phone
        returned_ids = [r["id"] for r in data["requests"]]
        assert returned_ids == list(reversed(ids))

    async def test_partner_phone_lookup_scoped(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry_a, partner_a_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.phone.a",
        )
        _, laundry_b, partner_b_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.phone.b",
        )

        phone = _unique_phone()
        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": phone},
        )
        request_id = created.json()["data"]["id"]
        await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/assign",
            headers=admin_headers,
            json={"laundry_id": str(laundry_a.id)},
        )

        admin_tl = await client.get(
            f"/api/v1/admin/booking-requests/by-phone/{phone}",
            headers=admin_headers,
        )
        assert admin_tl.status_code == 200
        assert any(r["id"] == request_id for r in admin_tl.json()["data"]["requests"])

        partner_a_tl = await client.get(
            f"/api/v1/partner/booking-requests/by-phone/{phone}",
            headers=partner_a_headers,
        )
        assert partner_a_tl.status_code == 200
        assert any(r["id"] == request_id for r in partner_a_tl.json()["data"]["requests"])

        partner_b_tl = await client.get(
            f"/api/v1/partner/booking-requests/by-phone/{phone}",
            headers=partner_b_headers,
        )
        assert partner_b_tl.status_code == 200
        assert partner_b_tl.json()["data"]["requests"] == []
        assert laundry_b.id is not None


# ---------------------------------------------------------------------------
# 11. Create-on-behalf by admin and partner
# ---------------------------------------------------------------------------
class TestCreateOnBehalf:
    async def test_admin_create_unassigned_and_assigned(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry, _ = await _make_partner_with_laundry(db_session, prefix="br.admincreate")

        unassigned = await client.post(
            "/api/v1/admin/booking-requests",
            headers=admin_headers,
            json={
                "customer_name": "Ops Lead",
                "phone": _unique_phone(),
                "service_type": "premium-laundry",
                "preferred_time_window": "flexible",
                "notes": "Called into ops desk",
                "priority": "urgent",
            },
        )
        assert unassigned.status_code == 201
        data = unassigned.json()["data"]
        assert data["source"] == "admin_created"
        assert data["created_by_role"] == "admin"
        assert data["status"] == "new"
        assert data["assigned_laundry_id"] is None
        assert data["priority"] == "urgent"

        assigned = await client.post(
            "/api/v1/admin/booking-requests",
            headers=admin_headers,
            json={
                "customer_name": "Ops Lead 2",
                "phone": _unique_phone(),
                "service_type": "shoe-cleaning",
                "preferred_time_window": "morning",
                "assigned_laundry_id": str(laundry.id),
            },
        )
        assert assigned.status_code == 201
        data = assigned.json()["data"]
        assert data["status"] == "assigned"
        assert data["assigned_laundry_id"] == str(laundry.id)
        assert data["source"] == "admin_created"

    async def test_partner_create_auto_assigned(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        _, laundry, partner_headers = await _make_partner_with_laundry(
            db_session,
            prefix="br.create",
        )

        partner_created = await client.post(
            "/api/v1/partner/booking-requests",
            headers=partner_headers,
            json={
                "customer_name": "Walk-in Priya",
                "phone": _unique_phone(),
                "service_type": "dry-clean",
                "preferred_time_window": "evening",
                "notes": "In-store request",
            },
        )
        assert partner_created.status_code == 201
        data = partner_created.json()["data"]
        assert data["status"] == "assigned"
        assert data["assigned_laundry_id"] == str(laundry.id)
        assert data["source"] == "partner_created"
        assert data["created_by_role"] == "partner"


# ---------------------------------------------------------------------------
# 12. Duplicate open request behavior per spec
# ---------------------------------------------------------------------------
class TestDuplicateOpenRequest:
    async def test_duplicate_warning_still_creates(
        self,
        client: AsyncClient,
    ) -> None:
        phone = _unique_phone()
        first = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": phone},
        )
        assert first.status_code == 201
        open_id = first.json()["data"]["id"]

        second = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": phone, "notes": "Second request"},
        )
        assert second.status_code == 201
        assert second.json()["meta"]["duplicate_warning"] is True
        assert open_id in second.json()["meta"]["open_request_ids"]
        assert second.json()["data"]["id"] != open_id


# ---------------------------------------------------------------------------
# 13. Auth: anonymous cannot mutate; wrong role 403
# ---------------------------------------------------------------------------
class TestAuthMatrix:
    async def test_wrong_role_and_anonymous(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        partner_headers: dict[str, str],
        customer_headers: dict[str, str],
    ) -> None:
        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]

        # Anonymous: no admin/partner reads or mutates
        assert (await client.get("/api/v1/admin/booking-requests")).status_code == 401
        assert (
            await client.patch(
                f"/api/v1/admin/booking-requests/{request_id}",
                json={"notes": "anon"},
            )
        ).status_code == 401
        assert (
            await client.delete(f"/api/v1/admin/booking-requests/{request_id}")
        ).status_code == 401
        assert (
            await client.post(
                f"/api/v1/admin/booking-requests/{request_id}/assign",
                json={"laundry_id": str(uuid4())},
            )
        ).status_code == 401
        assert (
            await client.post(
                f"/api/v1/admin/booking-requests/{request_id}/messages",
                json={"body": "hi", "visibility": "customer_facing"},
            )
        ).status_code == 401
        assert (await client.get("/api/v1/partner/booking-requests")).status_code == 401
        assert (
            await client.patch(
                f"/api/v1/partner/booking-requests/{request_id}",
                json={"notes": "anon"},
            )
        ).status_code == 401

        # No public read-by-id
        assert (await client.get(f"/api/v1/booking-requests/{request_id}")).status_code == 404

        # Wrong role → 403
        assert (
            await client.get("/api/v1/admin/booking-requests", headers=customer_headers)
        ).status_code == 403
        assert (
            await client.get("/api/v1/admin/booking-requests", headers=partner_headers)
        ).status_code == 403
        assert (
            await client.patch(
                f"/api/v1/admin/booking-requests/{request_id}",
                headers=partner_headers,
                json={"notes": "nope"},
            )
        ).status_code == 403
        assert (
            await client.get("/api/v1/partner/booking-requests", headers=customer_headers)
        ).status_code == 403
        assert (
            await client.get("/api/v1/partner/booking-requests", headers=admin_headers)
        ).status_code == 403
        assert (
            await client.get("/api/v1/admin/booking-requests", headers=admin_headers)
        ).status_code == 200
        assert (
            await client.get("/api/v1/partner/booking-requests", headers=partner_headers)
        ).status_code == 200


# ---------------------------------------------------------------------------
# Extra: claim, convert → assisted order, suggest
# ---------------------------------------------------------------------------
class TestClaimAndConvert:
    async def test_admin_claim(self, client: AsyncClient, admin_headers: dict[str, str]) -> None:
        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]

        claimed = await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/claim",
            headers=admin_headers,
        )
        assert claimed.status_code == 200
        assert claimed.json()["data"]["status"] == "reviewing"

    async def _seed_confirmed_request(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
        *,
        status: str = "confirmed",
        phone: str | None = None,
    ) -> tuple[str, Laundry, LaundryService]:
        _, laundry, _ = await _make_partner_with_laundry(db_session, prefix="br.convert")
        service = LaundryService(
            laundry_id=laundry.id,
            name="Wash & Fold",
            category="wash",
            unit="kg",
            price_inr=Decimal("100"),
            is_active=True,
            catalog_status="active",
        )
        db_session.add(service)
        await db_session.flush()

        phone_e164 = phone or _unique_phone()
        created = await client.post(
            "/api/v1/admin/booking-requests",
            headers=admin_headers,
            json={
                "customer_name": "Convert Me",
                "phone": phone_e164,
                "service_type": "wash-iron",
                "preferred_time_window": "flexible",
                "address_text": "12 MG Road",
                "city": "Bengaluru",
                "pincode": "560034",
                "assigned_laundry_id": str(laundry.id),
                "status": status,
            },
        )
        assert created.status_code == 201
        request_id = created.json()["data"]["id"]
        data = created.json()["data"]
        if data["status"] != status:
            # Walk legal transitions when create status was coerced
            path = ["reviewing", "assigned", "contacted", "confirmed"]
            if status == "contacted":
                path = ["reviewing", "assigned", "contacted"]
            for status_value in path:
                await client.patch(
                    f"/api/v1/admin/booking-requests/{request_id}",
                    headers=admin_headers,
                    json={"status": status_value},
                )
        return request_id, laundry, service

    def _convert_body(self, *, laundry_id, service_id, force: bool = False) -> dict:
        return {
            "force": force,
            "laundry_id": str(laundry_id),
            "pickup_at": (datetime.now(UTC) + timedelta(hours=2)).isoformat(),
            "delivery_at": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "items": [{"service_id": str(service_id), "quantity": 2}],
            "payment_method": "cod",
            "notes": "Converted from BR",
        }

    async def test_convert_happy_path(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        request_id, laundry, service = await self._seed_confirmed_request(
            client, db_session, admin_headers
        )
        response = await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/convert",
            headers=admin_headers,
            json=self._convert_body(laundry_id=laundry.id, service_id=service.id),
        )
        assert response.status_code == 200, response.text
        data = response.json()["data"]
        assert data["status"] == "converted_to_order"
        assert data["converted_order_id"]
        assert data["tracking_code"]
        assert data["order_source"] == "assisted_admin"

        detail = await client.get(
            f"/api/v1/admin/booking-requests/{request_id}",
            headers=admin_headers,
        )
        assert detail.status_code == 200
        body = detail.json()["data"]
        assert body["status"] == "converted_to_order"
        assert body["converted_order_id"] == data["converted_order_id"]
        assert any(e["event_type"] == "converted" for e in body["events"])

    async def test_convert_invalid_status(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry, _ = await _make_partner_with_laundry(db_session, prefix="br.convert.bad")
        service = LaundryService(
            laundry_id=laundry.id,
            name="Wash",
            category="wash",
            unit="kg",
            price_inr=Decimal("80"),
            is_active=True,
            catalog_status="active",
        )
        db_session.add(service)
        await db_session.flush()
        created = await client.post(
            "/api/v1/admin/booking-requests",
            headers=admin_headers,
            json={
                "customer_name": "Too Early",
                "phone": _unique_phone(),
                "service_type": "wash-fold",
                "preferred_time_window": "morning",
                "address_text": "1 Road",
                "city": "Bengaluru",
                "pincode": "560001",
                "assigned_laundry_id": str(laundry.id),
            },
        )
        assert created.status_code == 201
        rid = created.json()["data"]["id"]
        assert created.json()["data"]["status"] == "assigned"

        response = await client.post(
            f"/api/v1/admin/booking-requests/{rid}/convert",
            headers=admin_headers,
            json=self._convert_body(laundry_id=laundry.id, service_id=service.id),
        )
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"

    async def test_convert_already_converted(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        request_id, laundry, service = await self._seed_confirmed_request(
            client, db_session, admin_headers
        )
        body = self._convert_body(laundry_id=laundry.id, service_id=service.id)
        first = await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/convert",
            headers=admin_headers,
            json=body,
        )
        assert first.status_code == 200

        second = await client.post(
            f"/api/v1/admin/booking-requests/{request_id}/convert",
            headers=admin_headers,
            json=body,
        )
        assert second.status_code == 409
        assert second.json()["error"]["code"] == "ALREADY_TERMINAL"

    async def test_convert_force_from_contacted(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        # Seed assigned then walk to contacted
        _, laundry, _ = await _make_partner_with_laundry(db_session, prefix="br.convert.force")
        service = LaundryService(
            laundry_id=laundry.id,
            name="Iron",
            category="iron",
            unit="pc",
            price_inr=Decimal("50"),
            is_active=True,
            catalog_status="active",
        )
        db_session.add(service)
        await db_session.flush()
        created = await client.post(
            "/api/v1/admin/booking-requests",
            headers=admin_headers,
            json={
                "customer_name": "Force Convert",
                "phone": _unique_phone(),
                "service_type": "wash-iron",
                "preferred_time_window": "evening",
                "address_text": "9 Ring Road",
                "city": "Bengaluru",
                "pincode": "560095",
                "assigned_laundry_id": str(laundry.id),
            },
        )
        rid = created.json()["data"]["id"]
        await client.patch(
            f"/api/v1/admin/booking-requests/{rid}",
            headers=admin_headers,
            json={"status": "contacted"},
        )
        response = await client.post(
            f"/api/v1/admin/booking-requests/{rid}/convert",
            headers=admin_headers,
            json=self._convert_body(laundry_id=laundry.id, service_id=service.id, force=True),
        )
        assert response.status_code == 200, response.text
        assert response.json()["data"]["status"] == "converted_to_order"


class TestSuggestLaundries:
    async def test_admin_suggest_laundries_ranks_city_match(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_headers: dict[str, str],
    ) -> None:
        _, laundry_local, _ = await _make_partner_with_laundry(
            db_session,
            prefix="br.suggest.local",
            city="Bengaluru",
        )
        laundry_local.avg_rating = 3.2
        laundry_local.address_line = "12 MG Road 560034"
        _, laundry_remote, _ = await _make_partner_with_laundry(
            db_session,
            prefix="br.suggest.remote",
            city="Mumbai",
        )
        laundry_remote.avg_rating = 4.9
        await db_session.flush()

        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]

        response = await client.get(
            f"/api/v1/admin/booking-requests/{request_id}/suggest-laundries",
            headers=admin_headers,
            params={"limit": 5},
        )
        assert response.status_code == 200
        suggestions = response.json()["data"]["suggestions"]
        assert len(suggestions) >= 1
        top = suggestions[0]
        assert top["laundry_id"] == str(laundry_local.id)
        assert top["reason"] in {"pincode_match", "city_match", "nearest_area"}

    async def test_suggest_laundries_requires_admin(
        self,
        client: AsyncClient,
        partner_headers: dict[str, str],
    ) -> None:
        created = await client.post(
            "/api/v1/booking-requests",
            json={**PUBLIC_PAYLOAD, "phone": _unique_phone()},
        )
        request_id = created.json()["data"]["id"]
        assert (
            await client.get(
                f"/api/v1/admin/booking-requests/{request_id}/suggest-laundries",
                headers=partner_headers,
            )
        ).status_code == 403
