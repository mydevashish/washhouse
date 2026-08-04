"""Booking request HTTP APIs — public create + admin/partner inbox."""

from __future__ import annotations

from datetime import datetime
from math import ceil
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Path, Query, Request, status

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin, get_current_partner
from app.models.enums import (
    BookingRequestPriority,
    BookingRequestSource,
    BookingRequestStatus,
)
from app.schemas.booking_request import (
    BookingRequestAdminCreate,
    BookingRequestAssign,
    BookingRequestConvert,
    BookingRequestMessageCreate,
    BookingRequestPartnerCreate,
    BookingRequestPublicCreate,
    BookingRequestUpdate,
)
from app.schemas.common import PaginationMeta
from app.services.booking_request_service import BookingRequestService
from app.utils.request_meta import client_ip

public_router = APIRouter(prefix="/booking-requests", tags=["booking-requests"])
admin_router = APIRouter(prefix="/admin/booking-requests", tags=["admin-booking-requests"])
partner_router = APIRouter(prefix="/partner/booking-requests", tags=["partner-booking-requests"])


def _parse_statuses(raw: str | None) -> list[BookingRequestStatus] | None:
    if not raw:
        return None
    values: list[BookingRequestStatus] = []
    for part in raw.split(","):
        token = part.strip()
        if not token:
            continue
        values.append(BookingRequestStatus(token))
    return values or None


def _list_envelope(
    request: Request,
    *,
    items: list,
    total: int,
    page: int,
    page_size: int,
    inbox: dict[str, int] | None = None,
) -> dict:
    total_pages = max(1, ceil(total / page_size)) if page_size else 1
    envelope = success_envelope(
        [item.model_dump(mode="json") for item in items],
        request,
        pagination=PaginationMeta(
            page=page,
            per_page=page_size,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        ),
    )
    if inbox is not None:
        envelope["meta"]["inbox"] = inbox
    return envelope


# ---------- Public ----------
@public_router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create a public booking request",
    description="Book Now / marketplace pickup intent without selecting a laundry.",
    responses={
        422: {"description": "Validation error"},
        429: {"description": "Rate limited"},
    },
)
async def create_public_booking_request(
    body: BookingRequestPublicCreate,
    request: Request,
    session: SessionDep,
) -> dict:
    created, duplicate_warning, open_ids = await BookingRequestService(session).create_public(
        body,
        client_ip=client_ip(request),
    )
    envelope = success_envelope(created.model_dump(mode="json"), request)
    envelope["meta"]["duplicate_warning"] = duplicate_warning
    envelope["meta"]["open_request_ids"] = [str(i) for i in open_ids]
    return envelope


# ---------- Admin ----------
@admin_router.get(
    "",
    summary="List booking requests (admin)",
    description="Admin inbox with SLA-aware default sort and optional filters.",
)
async def admin_list_booking_requests(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
    priority: BookingRequestPriority | None = None,
    assigned_laundry_id: UUID | None = None,
    unassigned: bool = False,
    phone: str | None = None,
    q: str | None = None,
    source: BookingRequestSource | None = None,
    include_deleted: bool = False,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    sort: str = Query(default="sla"),
) -> dict:
    statuses = _parse_statuses(status_filter)
    single_status = statuses[0] if statuses and len(statuses) == 1 else None
    multi = statuses if statuses and len(statuses) > 1 else None
    items, total, inbox = await BookingRequestService(session).admin_list(
        page=page,
        page_size=page_size,
        status=single_status if multi is None else None,
        statuses=multi,
        priority=priority,
        assigned_laundry_id=assigned_laundry_id,
        unassigned=unassigned,
        phone=phone,
        q=q,
        source=source,
        include_deleted=include_deleted,
        created_from=created_from,
        created_to=created_to,
        sort=sort,
    )
    return _list_envelope(
        request,
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        inbox=inbox,
    )


@admin_router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create booking request on behalf of a phone (admin)",
)
async def admin_create_booking_request(
    body: BookingRequestAdminCreate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    row = await BookingRequestService(session).admin_create(
        body,
        admin_user_id=UUID(payload["sub"]),
    )
    return success_envelope(row.model_dump(mode="json"), request)


@admin_router.get(
    "/by-phone/{phone}",
    summary="Phone CRM timeline (admin)",
)
async def admin_booking_requests_by_phone(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    phone: str = Path(min_length=8, max_length=20),
) -> dict:
    data = await BookingRequestService(session).admin_by_phone(phone)
    return success_envelope(data.model_dump(mode="json"), request)


@admin_router.get(
    "/{booking_request_id}",
    summary="Booking request detail (admin)",
)
async def admin_get_booking_request(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).admin_get(booking_request_id)
    return success_envelope(data.model_dump(mode="json"), request)


@admin_router.patch(
    "/{booking_request_id}",
    summary="Update booking request (admin)",
)
async def admin_update_booking_request(
    body: BookingRequestUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).admin_update(
        booking_request_id,
        body,
        admin_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data.model_dump(mode="json"), request)


@admin_router.delete(
    "/{booking_request_id}",
    summary="Soft-delete booking request (admin)",
)
async def admin_soft_delete_booking_request(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).admin_soft_delete(
        booking_request_id,
        admin_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data.model_dump(mode="json"), request)


@admin_router.post(
    "/{booking_request_id}/restore",
    summary="Restore soft-deleted booking request (admin)",
)
async def admin_restore_booking_request(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).admin_restore(
        booking_request_id,
        admin_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data.model_dump(mode="json"), request)


@admin_router.post(
    "/{booking_request_id}/claim",
    summary="Claim booking request (new → reviewing)",
)
async def admin_claim_booking_request(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).admin_claim(
        booking_request_id,
        admin_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data.model_dump(mode="json"), request)


@admin_router.post(
    "/{booking_request_id}/assign",
    summary="Assign or transfer booking request to a laundry",
)
async def admin_assign_booking_request(
    body: BookingRequestAssign,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).admin_assign(
        booking_request_id,
        body,
        admin_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data.model_dump(mode="json"), request)


@admin_router.get(
    "/{booking_request_id}/suggest-laundries",
    summary="Suggest laundries for assignment (city/pincode, rating, recent)",
)
async def admin_suggest_laundries(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    booking_request_id: UUID,
    limit: int = Query(default=5, ge=1, le=10),
) -> dict:
    data = await BookingRequestService(session).admin_suggest_laundries(
        booking_request_id,
        limit=limit,
    )
    return success_envelope(data.model_dump(mode="json"), request)


@admin_router.post(
    "/{booking_request_id}/release",
    summary="Unassign booking request back to admin inbox",
)
async def admin_release_booking_request(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).admin_release(
        booking_request_id,
        admin_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data.model_dump(mode="json"), request)


@admin_router.post(
    "/{booking_request_id}/messages",
    summary="Add customer-facing response or internal note (admin)",
)
async def admin_add_booking_request_message(
    body: BookingRequestMessageCreate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).admin_add_message(
        booking_request_id,
        body,
        admin_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data.model_dump(mode="json"), request)


@admin_router.post(
    "/{booking_request_id}/convert",
    summary="Convert confirmed booking request to an assisted doorstep order",
)
async def admin_convert_booking_request(
    body: BookingRequestConvert,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).admin_convert(
        booking_request_id,
        body,
        admin_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data.model_dump(mode="json"), request)


# ---------- Partner ----------
@partner_router.get(
    "",
    summary="List booking requests assigned to my laundry",
)
async def partner_list_booking_requests(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
    priority: BookingRequestPriority | None = None,
    phone: str | None = None,
    q: str | None = None,
    source: BookingRequestSource | None = None,
    sort: str = Query(default="sla"),
) -> dict:
    statuses = _parse_statuses(status_filter)
    single_status = statuses[0] if statuses and len(statuses) == 1 else None
    multi = statuses if statuses and len(statuses) > 1 else None
    items, total, inbox = await BookingRequestService(session).partner_list(
        UUID(payload["sub"]),
        page=page,
        page_size=page_size,
        status=single_status if multi is None else None,
        statuses=multi,
        priority=priority,
        phone=phone,
        q=q,
        source=source,
        sort=sort,
    )
    return _list_envelope(
        request,
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        inbox=inbox,
    )


@partner_router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create booking request for my laundry",
)
async def partner_create_booking_request(
    body: BookingRequestPartnerCreate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await BookingRequestService(session).partner_create(
        body,
        partner_user_id=UUID(payload["sub"]),
    )
    return success_envelope(data.model_dump(mode="json"), request)


@partner_router.get(
    "/by-phone/{phone}",
    summary="Phone CRM timeline scoped to my laundry",
)
async def partner_booking_requests_by_phone(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    phone: str = Path(min_length=8, max_length=20),
) -> dict:
    data = await BookingRequestService(session).partner_by_phone(UUID(payload["sub"]), phone)
    return success_envelope(data.model_dump(mode="json"), request)


@partner_router.get(
    "/{booking_request_id}",
    summary="Booking request detail (partner)",
)
async def partner_get_booking_request(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).partner_get(UUID(payload["sub"]), booking_request_id)
    return success_envelope(data.model_dump(mode="json"), request)


@partner_router.patch(
    "/{booking_request_id}",
    summary="Update assigned booking request (partner)",
)
async def partner_update_booking_request(
    body: BookingRequestUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).partner_update(
        UUID(payload["sub"]),
        booking_request_id,
        body,
    )
    return success_envelope(data.model_dump(mode="json"), request)


@partner_router.post(
    "/{booking_request_id}/release",
    summary="Release assigned booking request back to admin",
)
async def partner_release_booking_request(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).partner_release(
        UUID(payload["sub"]),
        booking_request_id,
    )
    return success_envelope(data.model_dump(mode="json"), request)


@partner_router.post(
    "/{booking_request_id}/messages",
    summary="Add customer-facing response or internal note (partner)",
)
async def partner_add_booking_request_message(
    body: BookingRequestMessageCreate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).partner_add_message(
        UUID(payload["sub"]),
        booking_request_id,
        body,
    )
    return success_envelope(data.model_dump(mode="json"), request)


@partner_router.post(
    "/{booking_request_id}/convert",
    summary="Convert confirmed booking request to an assisted doorstep order",
)
async def partner_convert_booking_request(
    body: BookingRequestConvert,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    booking_request_id: UUID,
) -> dict:
    data = await BookingRequestService(session).partner_convert(
        UUID(payload["sub"]),
        booking_request_id,
        body,
    )
    return success_envelope(data.model_dump(mode="json"), request)
