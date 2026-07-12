"""Enterprise partner staff management API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.core.exceptions import AuthorizationError
from app.models.enums import UserRole
from app.schemas.staff_management import (
    StaffActivityRow,
    StaffCreateRequest,
    StaffDashboardResponse,
    StaffMemberResponse,
    StaffResetPasswordResponse,
    StaffSuspendRequest,
    StaffUpdateRequest,
)
from app.services.staff_management_service import StaffManagementService

router = APIRouter(prefix="/partner/staff-management", tags=["partner-staff-management"])


async def get_partner_staff_actor(
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    if payload.get("role") not in (UserRole.partner.value, UserRole.partner_staff.value, UserRole.admin.value, UserRole.super_admin.value):
        raise AuthorizationError()
    return payload


@router.get("/dashboard")
async def staff_dashboard(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_partner_staff_actor)],
) -> dict:
    data = await StaffManagementService(session).dashboard(UUID(payload["sub"]), payload["role"])
    return success_envelope(StaffDashboardResponse.model_validate(data), request)


@router.get("")
async def list_staff_members(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_partner_staff_actor)],
) -> dict:
    rows = await StaffManagementService(session).list_staff(UUID(payload["sub"]), payload["role"])
    return success_envelope([StaffMemberResponse.model_validate(r) for r in rows], request)


@router.post("", status_code=201)
async def create_staff_member(
    body: StaffCreateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_partner_staff_actor)],
) -> dict:
    data = await StaffManagementService(session).create_staff(
        UUID(payload["sub"]),
        payload["role"],
        name=body.name,
        email=str(body.email),
        phone=body.phone,
        role=body.role,
        laundry_id=body.laundry_id,
        password=body.password,
        work_schedule=body.work_schedule.model_dump() if body.work_schedule else None,
    )
    return success_envelope(StaffMemberResponse.model_validate(data), request)


@router.patch("/{staff_id}")
async def update_staff_member(
    staff_id: UUID,
    body: StaffUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_partner_staff_actor)],
) -> dict:
    data = await StaffManagementService(session).update_staff(
        UUID(payload["sub"]),
        payload["role"],
        staff_id,
        name=body.name,
        phone=body.phone,
        role=body.role,
        laundry_id=body.laundry_id,
        work_schedule=body.work_schedule.model_dump() if body.work_schedule else None,
    )
    return success_envelope(StaffMemberResponse.model_validate(data), request)


@router.post("/{staff_id}/deactivate")
async def deactivate_staff_member(
    staff_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_partner_staff_actor)],
) -> dict:
    data = await StaffManagementService(session).deactivate_staff(
        UUID(payload["sub"]),
        payload["role"],
        staff_id,
    )
    return success_envelope(StaffMemberResponse.model_validate(data), request)


@router.post("/{staff_id}/activate")
async def activate_staff_member(
    staff_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_partner_staff_actor)],
) -> dict:
    data = await StaffManagementService(session).set_active(
        UUID(payload["sub"]),
        payload["role"],
        staff_id,
        active=True,
    )
    return success_envelope(StaffMemberResponse.model_validate(data), request)


@router.post("/{staff_id}/suspend")
async def suspend_staff_member(
    staff_id: UUID,
    body: StaffSuspendRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_partner_staff_actor)],
) -> dict:
    data = await StaffManagementService(session).suspend_staff(
        UUID(payload["sub"]),
        payload["role"],
        staff_id,
        reason=body.reason,
    )
    return success_envelope(StaffMemberResponse.model_validate(data), request)


@router.post("/{staff_id}/unsuspend")
async def unsuspend_staff_member(
    staff_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_partner_staff_actor)],
) -> dict:
    data = await StaffManagementService(session).unsuspend_staff(
        UUID(payload["sub"]),
        payload["role"],
        staff_id,
    )
    return success_envelope(StaffMemberResponse.model_validate(data), request)


@router.post("/{staff_id}/reset-password")
async def reset_staff_password(
    staff_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_partner_staff_actor)],
) -> dict:
    data = await StaffManagementService(session).reset_password(
        UUID(payload["sub"]),
        payload["role"],
        staff_id,
    )
    return success_envelope(StaffResetPasswordResponse.model_validate(data), request)


@router.get("/activity")
async def staff_activity_logs(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_partner_staff_actor)],
    staff_id: UUID | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> dict:
    rows = await StaffManagementService(session).list_activity(
        UUID(payload["sub"]),
        payload["role"],
        staff_id=staff_id,
        limit=limit,
        offset=offset,
    )
    return success_envelope([StaffActivityRow.model_validate(r) for r in rows], request)
