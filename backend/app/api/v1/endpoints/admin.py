"""Admin APIs."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.admin_list_params import AdminAuditListQuery, AdminOrderListQuery, AdminUserListQuery
from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.core.cache import cache_delete_pattern
from app.core.exceptions import NotFoundError
from app.repositories.laundry import LaundryRepository
from app.models.enums import LaundryStatus
from app.schemas.admin import (
    AdminAnalyticsResponse,
    AdminAuditLogRow,
    AdminCreateLaundryRequest,
    AdminCreateLaundryResponse,
    AdminDashboardResponse,
    AdminLaundryManagementRow,
    AdminOrderRowResponse,
    AdminPendingLaundryResponse,
    AdminUserRowResponse,
    CommissionDefaultRequest,
    CommissionLaundryRequest,
)
from app.schemas.common import PaginatedListResponse
from app.services.admin_service import AdminService
from app.services.platform_service import PlatformService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/laundries", status_code=201)
async def create_laundry(
    body: AdminCreateLaundryRequest,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    result = await AdminService(session).create_laundry_with_partner(body)
    if result.get("status") == "approved":
        await cache_delete_pattern("laundries:list:")
    return success_envelope(AdminCreateLaundryResponse.model_validate(result), request)


@router.get("/laundries")
async def list_laundries(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    rows = await AdminService(session).list_all_laundries()
    return success_envelope(rows, request)


@router.get("/laundries/management")
async def list_laundries_management(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    rows = await AdminService(session).list_laundries_management()
    data = [AdminLaundryManagementRow.model_validate(r) for r in rows]
    return success_envelope(data, request)


@router.get("/laundries/pending")
async def pending_laundries(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    rows = await AdminService(session).list_pending_laundries()
    data = [AdminPendingLaundryResponse.model_validate(r) for r in rows]
    return success_envelope(data, request)


@router.post("/laundries/{laundry_id}/approve")
async def approve_laundry(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    laundry = await LaundryRepository(session).get_by_id(laundry_id)
    if not laundry:
        raise NotFoundError("Laundry not found")
    laundry.status = LaundryStatus.approved
    laundry.is_verified = True
    await session.flush()
    await cache_delete_pattern("laundries:list:")
    await cache_delete_pattern("laundries:search:")
    return success_envelope({"id": str(laundry.id), "status": laundry.status.value}, request)


@router.post("/laundries/{laundry_id}/reject")
async def reject_laundry(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    result = await AdminService(session).reject_laundry(laundry_id)
    await cache_delete_pattern("laundries:list:")
    await cache_delete_pattern("laundries:search:")
    return success_envelope(result, request)


@router.get("/analytics")
async def admin_analytics(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    days: int = Query(default=14, ge=7, le=30),
) -> dict:
    data = await AdminService(session).analytics(days=days)
    return success_envelope(AdminAnalyticsResponse.model_validate(data), request)


@router.get("/audit-logs")
async def admin_audit_logs(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    params: AdminAuditListQuery,
) -> dict:
    data = await AdminService(session).list_audit_logs_paginated(params)
    payload = PaginatedListResponse[AdminAuditLogRow].model_validate(
        {
            **data,
            "items": [AdminAuditLogRow.model_validate(r) for r in data["items"]],
        },
    )
    return success_envelope(payload, request)


@router.get("/dashboard")
async def admin_dashboard(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await AdminService(session).dashboard_stats()
    return success_envelope(AdminDashboardResponse.model_validate(data), request)


@router.get("/orders")
async def admin_orders(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    params: AdminOrderListQuery,
) -> dict:
    data = await AdminService(session).list_orders_paginated(params)
    payload = PaginatedListResponse[AdminOrderRowResponse].model_validate(
        {
            **data,
            "items": [AdminOrderRowResponse.model_validate(r) for r in data["items"]],
        },
    )
    return success_envelope(payload, request)


@router.get("/users")
async def admin_users(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    params: AdminUserListQuery,
) -> dict:
    data = await AdminService(session).list_users_paginated(params)
    payload = PaginatedListResponse[AdminUserRowResponse].model_validate(
        {
            **data,
            "items": [AdminUserRowResponse.model_validate(r) for r in data["items"]],
        },
    )
    return success_envelope(payload, request)


@router.get("/commission/default")
async def get_default_commission(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    rate = await PlatformService(session).get_default_commission()
    return success_envelope({"rate": str(rate)}, request)


@router.put("/commission/default")
async def set_default_commission(
    body: CommissionDefaultRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    rate = await PlatformService(session).set_default_commission(
        body.rate,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope({"rate": str(rate)}, request)


@router.patch("/laundries/{laundry_id}/commission")
async def set_laundry_commission(
    laundry_id: UUID,
    body: CommissionLaundryRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    result = await PlatformService(session).set_laundry_commission(
        laundry_id,
        body.rate,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(result, request)
