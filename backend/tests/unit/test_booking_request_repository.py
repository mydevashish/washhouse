"""BookingRequestRepository data-layer coverage."""

from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.booking_request import BookingRequest, BookingRequestMessage
from app.models.enums import (
    BookingRequestCreatedByRole,
    BookingRequestEventType,
    BookingRequestMessageAuthorRole,
    BookingRequestMessageVisibility,
    BookingRequestPreferredTime,
    BookingRequestPriority,
    BookingRequestServiceType,
    BookingRequestSource,
    BookingRequestStatus,
    LaundryStatus,
    UserRole,
)
from app.models.laundry import Laundry
from app.models.user import User
from app.repositories.booking_request import BookingRequestRepository

pytestmark = pytest.mark.asyncio


async def _partner_and_laundry(session: AsyncSession) -> tuple[User, Laundry]:
    partner = User(
        email=f"br.partner.{uuid4().hex[:8]}@test.dlm",
        password_hash=hash_password("Partner@1234"),
        full_name="BR Partner",
        role=UserRole.partner,
        is_email_verified=True,
    )
    session.add(partner)
    await session.flush()
    laundry = Laundry(
        owner_user_id=partner.id,
        name="BR Laundry",
        slug=f"br-laundry-{uuid4().hex[:8]}",
        city="Bengaluru",
        address_line="1 BR Road",
        status=LaundryStatus.approved,
        is_verified=True,
    )
    session.add(laundry)
    await session.flush()
    return partner, laundry


def _make_request(
    *,
    phone: str = "+919876543210",
    public_code: str | None = None,
    status: BookingRequestStatus = BookingRequestStatus.new,
) -> BookingRequest:
    return BookingRequest(
        public_code=public_code or f"BR-{uuid4().hex[:6].upper()}",
        customer_name="Priya Sharma",
        phone_e164=phone,
        service_type=BookingRequestServiceType.wash_fold,
        preferred_time_window=BookingRequestPreferredTime.morning,
        source=BookingRequestSource.marketing_home,
        status=status,
        priority=BookingRequestPriority.normal,
        created_by_role=BookingRequestCreatedByRole.public,
        notes="≈8 kg",
        city="Bengaluru",
        pincode="560034",
    )


async def test_create_and_get_by_id(db_session: AsyncSession) -> None:
    repo = BookingRequestRepository(db_session)
    row = await repo.create(_make_request())
    got = await repo.get_by_id(row.id)
    assert got is not None
    assert got.public_code == row.public_code
    assert got.phone_e164 == "+919876543210"
    assert got.status == BookingRequestStatus.new


async def test_list_filters_and_pagination(db_session: AsyncSession) -> None:
    repo = BookingRequestRepository(db_session)
    a = await repo.create(_make_request(phone="+919811111111", status=BookingRequestStatus.new))
    b = await repo.create(
        _make_request(phone="+919822222222", status=BookingRequestStatus.reviewing),
    )
    await repo.create(_make_request(phone="+919833333333", status=BookingRequestStatus.declined))

    rows, total = await repo.list(statuses=[BookingRequestStatus.new, BookingRequestStatus.reviewing])
    assert total == 2
    assert {r.id for r in rows} == {a.id, b.id}

    page1, total_all = await repo.list(page=1, page_size=1, sort_by="created_at", sort_dir="desc")
    assert total_all == 3
    assert len(page1) == 1


async def test_soft_delete_restore_and_list_visibility(db_session: AsyncSession) -> None:
    repo = BookingRequestRepository(db_session)
    row = await repo.create(_make_request())
    await repo.soft_delete(row)

    assert await repo.get_by_id(row.id) is None
    assert await repo.get_by_id(row.id, include_deleted=True) is not None

    rows, total = await repo.list()
    assert total == 0
    assert rows == []

    included, total_del = await repo.list(include_deleted=True)
    assert total_del == 1
    assert included[0].id == row.id

    await repo.restore(row)
    assert await repo.get_by_id(row.id) is not None
    events = await repo.list_events(row.id)
    assert [e.event_type for e in events] == [
        BookingRequestEventType.soft_deleted,
        BookingRequestEventType.restored,
    ]


async def test_assign_and_transfer(db_session: AsyncSession) -> None:
    partner, laundry_a = await _partner_and_laundry(db_session)
    _, laundry_b = await _partner_and_laundry(db_session)
    repo = BookingRequestRepository(db_session)
    row = await repo.create(_make_request())

    await repo.assign(row, laundry_id=laundry_a.id, assigned_by_user_id=partner.id)
    assert row.assigned_laundry_id == laundry_a.id
    assert row.status == BookingRequestStatus.assigned
    assert row.assigned_at is not None

    # Same laundry → no-op (no second event)
    await repo.assign(row, laundry_id=laundry_a.id, assigned_by_user_id=partner.id)
    events = await repo.list_events(row.id)
    assert len(events) == 1
    assert events[0].event_type == BookingRequestEventType.assigned

    await repo.transfer(row, to_laundry_id=laundry_b.id, assigned_by_user_id=partner.id)
    assert row.assigned_laundry_id == laundry_b.id
    events = await repo.list_events(row.id)
    assert events[-1].event_type == BookingRequestEventType.transferred
    assert events[-1].from_laundry_id == laundry_a.id
    assert events[-1].to_laundry_id == laundry_b.id


async def test_list_by_phone_normalizes_input(db_session: AsyncSession) -> None:
    repo = BookingRequestRepository(db_session)
    first = await repo.create(_make_request(phone="+919876543210"))
    second = await repo.create(_make_request(phone="+919876543210"))
    await repo.create(_make_request(phone="+919900001111"))

    timeline = await repo.list_by_phone("98765 43210")
    assert [r.id for r in timeline] == [second.id, first.id]


async def test_add_and_list_messages_promotes_contacted(db_session: AsyncSession) -> None:
    partner, laundry = await _partner_and_laundry(db_session)
    repo = BookingRequestRepository(db_session)
    row = await repo.create(_make_request())
    await repo.assign(row, laundry_id=laundry.id, assigned_by_user_id=partner.id)

    note = await repo.add_message(
        BookingRequestMessage(
            booking_request_id=row.id,
            author_user_id=partner.id,
            author_role=BookingRequestMessageAuthorRole.partner,
            visibility=BookingRequestMessageVisibility.internal,
            body="Called — no answer",
        ),
    )
    assert note.id is not None
    assert row.status == BookingRequestStatus.assigned

    await repo.add_message(
        BookingRequestMessage(
            booking_request_id=row.id,
            author_user_id=partner.id,
            author_role=BookingRequestMessageAuthorRole.partner,
            visibility=BookingRequestMessageVisibility.customer_facing,
            body="Hi Priya — pickup window confirmed for morning.",
        ),
    )
    assert row.status == BookingRequestStatus.contacted
    assert row.last_response_at is not None

    messages = await repo.list_messages(row.id)
    assert len(messages) == 2
    assert messages[0].visibility == BookingRequestMessageVisibility.internal
    assert messages[1].visibility == BookingRequestMessageVisibility.customer_facing


async def test_update_sets_closed_at_on_terminal(db_session: AsyncSession) -> None:
    repo = BookingRequestRepository(db_session)
    row = await repo.create(_make_request())
    await repo.update(row, fields={"status": BookingRequestStatus.declined})
    assert row.closed_at is not None
    events = await repo.list_events(row.id)
    assert events[-1].event_type == BookingRequestEventType.status_changed
