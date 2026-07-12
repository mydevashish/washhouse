"""Pickup & delivery operations center API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.core.exceptions import AuthorizationError
from app.models.enums import TaskAssignmentStatus, UserRole
from app.schemas.operations import (
    AssignDriverRequest,
    DeliveryQueueResponse,
    DriverSummaryResponse,
    OperationsDashboardResponse,
    OperationsOrderRow,
    PickupQueueResponse,
    ReassignDriverRequest,
    UpdateAssignmentStatusRequest,
)
from app.services.operations_service import OperationsService

router = APIRouter(prefix="/partner/operations", tags=["partner-operations"])


async def get_operations_actor(
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    if payload.get("role") not in (
        UserRole.partner.value,
        UserRole.partner_staff.value,
        UserRole.admin.value,
        UserRole.super_admin.value,
    ):
        raise AuthorizationError()
    return payload


@router.get("/dashboard")
async def operations_dashboard(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_operations_actor)],
) -> dict:
    data = await OperationsService(session).dashboard(UUID(payload["sub"]), payload["role"])
    return success_envelope(OperationsDashboardResponse.model_validate(data), request)


@router.get("/pickups")
async def pickup_queue(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_operations_actor)],
) -> dict:
    data = await OperationsService(session).pickup_queue(UUID(payload["sub"]), payload["role"])
    return success_envelope(PickupQueueResponse.model_validate(data), request)


@router.get("/deliveries")
async def delivery_queue(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_operations_actor)],
) -> dict:
    data = await OperationsService(session).delivery_queue(UUID(payload["sub"]), payload["role"])
    return success_envelope(DeliveryQueueResponse.model_validate(data), request)


@router.get("/drivers")
async def list_drivers(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_operations_actor)],
) -> dict:
    rows = await OperationsService(session).list_drivers(UUID(payload["sub"]), payload["role"])
    return success_envelope([DriverSummaryResponse.model_validate(r) for r in rows], request)


@router.post("/assignments", status_code=201)
async def assign_driver(
    body: AssignDriverRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_operations_actor)],
) -> dict:
    data = await OperationsService(session).assign_driver(
        UUID(payload["sub"]),
        payload["role"],
        order_id=body.order_id,
        staff_id=body.staff_id,
        task_type=body.task_type,
        notes=body.notes,
    )
    return success_envelope(OperationsOrderRow.model_validate(data), request)


@router.patch("/assignments/{assignment_id}/reassign")
async def reassign_driver(
    assignment_id: UUID,
    body: ReassignDriverRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_operations_actor)],
) -> dict:
    data = await OperationsService(session).reassign_driver(
        UUID(payload["sub"]),
        payload["role"],
        assignment_id,
        staff_id=body.staff_id,
        notes=body.notes,
    )
    return success_envelope(OperationsOrderRow.model_validate(data), request)


@router.patch("/assignments/{assignment_id}/status")
async def update_assignment_status(
    assignment_id: UUID,
    body: UpdateAssignmentStatusRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_operations_actor)],
) -> dict:
    try:
        status = TaskAssignmentStatus(body.status)
    except ValueError as exc:
        from app.core.exceptions import ValidationError
        raise ValidationError(f"Invalid assignment status: {body.status}") from exc
    data = await OperationsService(session).update_assignment_status(
        UUID(payload["sub"]),
        payload["role"],
        assignment_id,
        status=status,
        notes=body.notes,
    )
    return success_envelope(OperationsOrderRow.model_validate(data), request)
