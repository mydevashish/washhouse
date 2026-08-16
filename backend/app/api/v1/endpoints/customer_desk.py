"""Customer Desk lookup + order history + assisted create APIs (admin + partner)."""

from __future__ import annotations

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin, get_current_partner
from app.api.v1.endpoints.partner_customer_insights import get_insights_actor
from app.core.exceptions import ValidationError
from app.core.pagination import DEFAULT_PAGE_SIZE, normalize_page_size
from app.models.enums import OrderSource, OrderStatus
from app.schemas.common import PaginatedListResponse
from app.schemas.customer_desk import (
    AssistedOrderCreateRequest,
    AssistedOrderCreateResult,
    AssistedOrderQuoteResponse,
    CustomerDeskOrderRow,
    CustomerDeskProfile,
)
from app.schemas.partner import (
    PartnerCustomerCreateRequest,
    PartnerCustomerUpdateRequest,
    PartnerCustomerUpdateResponse,
)
from app.services.customer_desk_service import CustomerDeskService
from app.services.partner_customer_service import PartnerCustomerService

admin_router = APIRouter(prefix="/admin/customers", tags=["Admin"])
partner_router = APIRouter(prefix="/partner/customers", tags=["Partner"])
admin_create_router = APIRouter(prefix="/admin/customer-desk", tags=["Admin"])
partner_create_router = APIRouter(prefix="/partner/customer-desk", tags=["Partner"])

# Table lists use platform default 10; lookup ``limit`` below stays capped for typeahead.
_DESK_DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE
_DESK_MAX_PAGE_SIZE = 100


def _require_idempotency_key(idempotency_key: str | None) -> str:
    key = (idempotency_key or "").strip()
    if not key:
        raise ValidationError("Idempotency-Key header is required")
    if len(key) > 128:
        raise ValidationError("Idempotency-Key must be at most 128 characters")
    return key


@admin_router.get(
    "/lookup",
    summary="Lookup customer by phone or user_id",
    description="Platform-wide desk profile stub for admin/ops.",
    responses={422: {"description": "Validation error"}},
)
async def admin_customer_lookup(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    phone: str | None = Query(default=None, max_length=20),
    user_id: UUID | None = Query(default=None),
) -> dict:
    data = await CustomerDeskService(session).lookup(phone=phone, user_id=user_id)
    return success_envelope(CustomerDeskProfile.model_validate(data), request)


@admin_router.get(
    "/search",
    summary="Search customers by name, phone, or user_id",
    description=(
        "Returns up to 20 desk profile stubs matching name (ilike), phone fragment, "
        "exact Indian mobile, or UUID. No mass export."
    ),
    responses={422: {"description": "Validation error"}},
)
async def admin_customer_search(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    q: str = Query(..., min_length=2, max_length=100, description="Name, phone, or user_id"),
    limit: int = Query(default=20, ge=1, le=20),
) -> dict:
    rows = await CustomerDeskService(session).search(q=q, limit=limit)
    return success_envelope(
        [CustomerDeskProfile.model_validate(r) for r in rows],
        request,
    )


@admin_router.get(
    "/orders",
    summary="List past orders by phone (guest-friendly)",
    description=(
        "Paginated order history keyed by phone when the customer has no user_id "
        "(walk-in / guest). Prefer /{user_id}/orders for registered customers."
    ),
)
async def admin_customer_orders_by_phone(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    phone: str = Query(..., max_length=20),
    status: OrderStatus | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    q: str | None = Query(default=None, max_length=64, description="Tracking code search"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=_DESK_DEFAULT_PAGE_SIZE, ge=1, le=_DESK_MAX_PAGE_SIZE),
) -> dict:
    data = await CustomerDeskService(session).list_orders(
        phone=phone,
        status=status,
        date_from=date_from,
        date_to=date_to,
        q=q,
        page=page,
        page_size=page_size,
    )
    payload = PaginatedListResponse[CustomerDeskOrderRow].model_validate(
        {
            **data,
            "items": [CustomerDeskOrderRow.model_validate(r) for r in data["items"]],
        },
    )
    return success_envelope(payload, request)


@admin_router.get(
    "/{user_id}/orders",
    summary="List past orders for a registered customer",
    description="Includes orders linked by user_id or the user's phone (guest walk-ins).",
)
async def admin_customer_orders(
    user_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    status: OrderStatus | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    q: str | None = Query(default=None, max_length=64, description="Tracking code search"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=_DESK_DEFAULT_PAGE_SIZE, ge=1, le=_DESK_MAX_PAGE_SIZE),
) -> dict:
    data = await CustomerDeskService(session).list_orders(
        user_id=user_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        q=q,
        page=page,
        page_size=page_size,
    )
    payload = PaginatedListResponse[CustomerDeskOrderRow].model_validate(
        {
            **data,
            "items": [CustomerDeskOrderRow.model_validate(r) for r in data["items"]],
        },
    )
    return success_envelope(payload, request)


@partner_router.post(
    "",
    summary="Create or link a customer for this laundry",
    description=(
        "Registers an Indian mobile for the partner laundry directory. "
        "Idempotent on phone — updates display name when provided. "
        "Zero-order customers appear in customer insights after registration."
    ),
    responses={422: {"description": "Validation error"}},
)
async def partner_customer_create(
    request: Request,
    session: SessionDep,
    body: PartnerCustomerCreateRequest,
    payload: Annotated[dict, Depends(get_insights_actor)],
) -> dict:
    data = await PartnerCustomerService(session).create_or_link(
        actor_user_id=UUID(payload["sub"]),
        actor_role=payload["role"],
        name=body.name,
        phone=body.phone,
    )
    return success_envelope(CustomerDeskProfile.model_validate(data), request)


@partner_router.patch(
    "/by-phone",
    summary="Update customer profile by phone (partner laundry scope)",
    description=(
        "Updates name, email, gender, and CRM notes for a registered customer at this laundry. "
        "Phone is immutable — pass it as a query parameter."
    ),
    responses={403: {"description": "Customer not at this laundry"}, 404: {"description": "Not found"}},
)
async def partner_customer_update_by_phone(
    request: Request,
    session: SessionDep,
    body: PartnerCustomerUpdateRequest,
    payload: Annotated[dict, Depends(get_insights_actor)],
    phone: str = Query(..., max_length=20),
) -> dict:
    data = await PartnerCustomerService(session).update_profile(
        actor_user_id=UUID(payload["sub"]),
        actor_role=payload["role"],
        phone=phone,
        name=body.name,
        email=body.email,
        gender=body.gender,
        notes=body.notes,
    )
    return success_envelope(PartnerCustomerUpdateResponse.model_validate(data), request)


@partner_router.patch(
    "/{user_id}",
    summary="Update customer profile (partner laundry scope)",
    description=(
        "Updates name, email, gender, and CRM notes for a customer linked to this laundry. "
        "Phone is immutable."
    ),
    responses={403: {"description": "Customer not at this laundry"}, 404: {"description": "Not found"}},
)
async def partner_customer_update(
    user_id: UUID,
    request: Request,
    session: SessionDep,
    body: PartnerCustomerUpdateRequest,
    payload: Annotated[dict, Depends(get_insights_actor)],
) -> dict:
    data = await PartnerCustomerService(session).update_profile(
        actor_user_id=UUID(payload["sub"]),
        actor_role=payload["role"],
        user_id=user_id,
        name=body.name,
        email=body.email,
        gender=body.gender,
        notes=body.notes,
    )
    return success_envelope(PartnerCustomerUpdateResponse.model_validate(data), request)


@partner_router.get(
    "/lookup",
    summary="Lookup customer by phone or user_id (partner laundry scope)",
    description=(
        "Returns a desk profile with order_count scoped to the partner's laundry. "
        "Provide phone or user_id (not both). "
        "Unregistered phones with no touch at this laundry → 404; "
        "registered users with no own-laundry orders still return profile with order_count=0."
    ),
    responses={404: {"description": "No touchpoint at this laundry"}, 422: {"description": "Validation"}},
)
async def partner_customer_lookup(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    phone: str | None = Query(default=None, max_length=20),
    user_id: UUID | None = Query(default=None),
) -> dict:
    service = CustomerDeskService(session)
    laundry_id = await service.laundry_id_for_partner(UUID(payload["sub"]))
    data = await service.lookup(
        phone=phone,
        user_id=user_id,
        laundry_id=laundry_id,
        require_laundry_touch=True,
    )
    return success_envelope(CustomerDeskProfile.model_validate(data), request)


@partner_router.get(
    "/search",
    summary="Search customers by name or phone (partner laundry scope)",
    description=(
        "Returns up to 20 desk profiles matching name/phone among customers who have "
        "ordered at this laundry. Never leaks other shops."
    ),
    responses={422: {"description": "Validation"}},
)
async def partner_customer_search(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    q: str = Query(..., min_length=2, max_length=100, description="Name, phone, or user_id"),
    limit: int = Query(default=20, ge=1, le=20),
) -> dict:
    service = CustomerDeskService(session)
    laundry_id = await service.laundry_id_for_partner(UUID(payload["sub"]))
    rows = await service.search(q=q, laundry_id=laundry_id, limit=limit)
    return success_envelope(
        [CustomerDeskProfile.model_validate(r) for r in rows],
        request,
    )


@partner_router.get(
    "/orders",
    summary="List past orders by phone (partner laundry scope, guests)",
    description="Only orders where laundry_id matches the authenticated partner's laundry.",
)
async def partner_customer_orders_by_phone(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    phone: str = Query(..., max_length=20),
    status: OrderStatus | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    q: str | None = Query(default=None, max_length=64),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=_DESK_DEFAULT_PAGE_SIZE, ge=1, le=_DESK_MAX_PAGE_SIZE),
) -> dict:
    service = CustomerDeskService(session)
    laundry_id = await service.laundry_id_for_partner(UUID(payload["sub"]))
    data = await service.list_orders(
        phone=phone,
        laundry_id=laundry_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        q=q,
        page=page,
        page_size=page_size,
    )
    payload_body = PaginatedListResponse[CustomerDeskOrderRow].model_validate(
        {
            **data,
            "items": [CustomerDeskOrderRow.model_validate(r) for r in data["items"]],
        },
    )
    return success_envelope(payload_body, request)


@partner_router.get(
    "/{user_id}/orders",
    summary="List past orders for a customer (partner laundry scope)",
    description="Strictly scoped to the partner's laundry_id — never leaks other shops.",
)
async def partner_customer_orders(
    user_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    status: OrderStatus | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    q: str | None = Query(default=None, max_length=64),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=_DESK_DEFAULT_PAGE_SIZE, ge=1, le=_DESK_MAX_PAGE_SIZE),
) -> dict:
    service = CustomerDeskService(session)
    laundry_id = await service.laundry_id_for_partner(UUID(payload["sub"]))
    data = await service.list_orders(
        user_id=user_id,
        laundry_id=laundry_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        q=q,
        page=page,
        page_size=page_size,
    )
    payload_body = PaginatedListResponse[CustomerDeskOrderRow].model_validate(
        {
            **data,
            "items": [CustomerDeskOrderRow.model_validate(r) for r in data["items"]],
        },
    )
    return success_envelope(payload_body, request)


# ---------- Assisted create / quote (Slice 2) ----------


@admin_create_router.post(
    "/orders/quote",
    summary="Quote assisted doorstep order (admin)",
)
async def admin_assisted_quote(
    body: AssistedOrderCreateRequest,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await CustomerDeskService(session).quote_assisted(
        laundry_id=body.laundry_id,
        items=[item.model_dump() for item in body.items],
    )
    return success_envelope(AssistedOrderQuoteResponse.model_validate(data), request)


@admin_create_router.post(
    "/orders",
    status_code=201,
    summary="Create assisted doorstep order (admin)",
)
async def admin_assisted_create(
    body: AssistedOrderCreateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> dict:
    key = _require_idempotency_key(idempotency_key)
    order = await CustomerDeskService(session).create_assisted(
        actor_user_id=UUID(payload["sub"]),
        order_source=OrderSource.assisted_admin,
        phone=body.phone,
        customer_name=body.customer_name,
        laundry_id=body.laundry_id,
        address_id=body.address_id,
        address=body.address.model_dump() if body.address else None,
        pickup_at=body.pickup_at,
        delivery_at=body.delivery_at,
        items=[item.model_dump() for item in body.items],
        notes=body.notes,
        payment_method=body.payment_method,
        idempotency_key=key,
        save_address_to_user=body.save_address_to_user,
    )
    return success_envelope(AssistedOrderCreateResult.model_validate(order), request)


@partner_create_router.post(
    "/orders/quote",
    summary="Quote assisted doorstep order (partner)",
)
async def partner_assisted_quote(
    body: AssistedOrderCreateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    service = CustomerDeskService(session)
    laundry_id = await service.laundry_id_for_partner(UUID(payload["sub"]))
    data = await service.quote_assisted(
        laundry_id=body.laundry_id,
        items=[item.model_dump() for item in body.items],
        partner_laundry_id=laundry_id,
    )
    return success_envelope(AssistedOrderQuoteResponse.model_validate(data), request)


@partner_create_router.post(
    "/orders",
    status_code=201,
    summary="Create assisted doorstep order (partner)",
)
async def partner_assisted_create(
    body: AssistedOrderCreateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> dict:
    key = _require_idempotency_key(idempotency_key)
    service = CustomerDeskService(session)
    laundry_id = await service.laundry_id_for_partner(UUID(payload["sub"]))
    order = await service.create_assisted(
        actor_user_id=UUID(payload["sub"]),
        order_source=OrderSource.assisted_partner,
        phone=body.phone,
        customer_name=body.customer_name,
        laundry_id=body.laundry_id,
        address_id=body.address_id,
        address=body.address.model_dump() if body.address else None,
        pickup_at=body.pickup_at,
        delivery_at=body.delivery_at,
        items=[item.model_dump() for item in body.items],
        notes=body.notes,
        payment_method=body.payment_method,
        idempotency_key=key,
        partner_laundry_id=laundry_id,
        save_address_to_user=body.save_address_to_user,
        coupon_code=body.coupon_code,
    )
    return success_envelope(AssistedOrderCreateResult.model_validate(order), request)
