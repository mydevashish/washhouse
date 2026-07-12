"""Customer disputes and admin dispute management."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from fastapi.responses import PlainTextResponse

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin, get_current_user_payload
from app.core.exceptions import ValidationError
from app.models.enums import ComplaintStatus, ComplaintType, DisputePriority
from app.schemas.complaint import ComplaintStatusUpdateRequest
from app.schemas.dispute_admin import (
    DisputeAdminDetailResponse,
    DisputeAdminMetricsResponse,
    DisputeAdminTableResponse,
    DisputeAssigneeResponse,
    DisputeAssignRequest,
    DisputeBulkActionRequest,
    DisputeInternalNoteRequest,
    DisputeInternalNoteUpdateRequest,
    DisputePriorityUpdateRequest,
)
from app.services.complaint_service import ComplaintService
from app.services.dispute_admin_service import DisputeAdminService

router = APIRouter(prefix="/complaints", tags=["complaints"])

MAX_PHOTOS = 5


@router.post("", status_code=201)
async def create_complaint(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
    order_id: UUID = Form(...),
    complaint_type: ComplaintType = Form(...),
    description: str = Form(..., min_length=10, max_length=5000),
    files: list[UploadFile] = File(default=[]),
) -> dict:
    prepared: list[tuple[bytes, str | None]] = []
    for upload in files[:MAX_PHOTOS]:
        raw = await upload.read()
        if raw:
            prepared.append((raw, upload.content_type))

    row = await ComplaintService(session).create_dispute(
        UUID(payload["sub"]),
        order_id=order_id,
        complaint_type=complaint_type,
        description=description,
        files=prepared,
    )
    return success_envelope({"id": str(row.id), "status": row.status.value}, request)


@router.get("")
async def list_my_complaints(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    data = await ComplaintService(session).list_for_customer(UUID(payload["sub"]))
    return success_envelope(data, request)


@router.get("/admin/datatable")
async def admin_dispute_datatable(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    q: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    complaint_type: str | None = None,
    laundry_id: UUID | None = None,
    partner_id: UUID | None = None,
    customer_id: UUID | None = None,
    assigned_to: UUID | None = None,
    unassigned_only: bool = False,
    sla_status: str | None = None,
    resolution_status: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    sort_by: str = Query(default="created_at"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
) -> dict:
    data = await DisputeAdminService(session).datatable(
        q=q,
        status=status,
        priority=priority,
        complaint_type=complaint_type,
        laundry_id=laundry_id,
        partner_id=partner_id,
        customer_id=customer_id,
        assigned_to=assigned_to,
        unassigned_only=unassigned_only,
        sla_status=sla_status,
        resolution_status=resolution_status,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return success_envelope(DisputeAdminTableResponse.model_validate(data), request)


@router.get("/admin/metrics")
async def admin_dispute_metrics(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await DisputeAdminService(session).metrics(current_user_id=UUID(payload["sub"]))
    return success_envelope(DisputeAdminMetricsResponse.model_validate(data), request)


@router.get("/admin/assignees")
async def admin_dispute_assignees(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    rows = await DisputeAdminService(session).list_assignees()
    return success_envelope(
        [DisputeAssigneeResponse.model_validate(r) for r in rows],
        request,
    )


@router.get("/admin/datatable/{complaint_id}")
async def admin_dispute_datatable_detail(
    complaint_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await DisputeAdminService(session).detail(complaint_id)
    return success_envelope(DisputeAdminDetailResponse.model_validate(data), request)


@router.patch("/admin/{complaint_id}/assign")
async def admin_dispute_assign(
    complaint_id: UUID,
    body: DisputeAssignRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await DisputeAdminService(session).assign(
        UUID(payload["sub"]),
        complaint_id,
        assigned_to_user_id=body.assigned_to_user_id,
    )
    return success_envelope(DisputeAdminDetailResponse.model_validate(data), request)


@router.patch("/admin/{complaint_id}/priority")
async def admin_dispute_priority(
    complaint_id: UUID,
    body: DisputePriorityUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await DisputeAdminService(session).update_priority(
        UUID(payload["sub"]),
        complaint_id,
        priority=body.priority,
    )
    return success_envelope(DisputeAdminDetailResponse.model_validate(data), request)


@router.post("/admin/{complaint_id}/notes")
async def admin_dispute_add_note(
    complaint_id: UUID,
    body: DisputeInternalNoteRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await DisputeAdminService(session).add_note(
        UUID(payload["sub"]),
        complaint_id,
        body=body.body,
    )
    return success_envelope(DisputeAdminDetailResponse.model_validate(data), request)


@router.patch("/admin/notes/{note_id}")
async def admin_dispute_edit_note(
    note_id: UUID,
    body: DisputeInternalNoteUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await DisputeAdminService(session).edit_note(
        UUID(payload["sub"]),
        note_id,
        body=body.body,
    )
    return success_envelope(DisputeAdminDetailResponse.model_validate(data), request)


@router.post("/admin/bulk")
async def admin_dispute_bulk(
    body: DisputeBulkActionRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    result = await DisputeAdminService(session).bulk_action(
        UUID(payload["sub"]),
        complaint_ids=body.complaint_ids,
        action=body.action,
        assigned_to_user_id=body.assigned_to_user_id,
        status=body.status,
        priority=body.priority,
        note=body.note,
    )
    return success_envelope(result, request)


@router.get("/admin/export")
async def admin_dispute_export(
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    q: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    complaint_type: str | None = None,
    format: str = Query(default="csv", pattern="^(csv|xlsx|pdf)$"),
) -> PlainTextResponse:
    csv_text = await DisputeAdminService(session).export_csv(
        q=q,
        status=status,
        priority=priority,
        complaint_type=complaint_type,
    )
    if format == "xlsx":
        return PlainTextResponse(
            content="\ufeff" + csv_text,
            media_type="application/vnd.ms-excel",
            headers={"Content-Disposition": 'attachment; filename="disputes.xls"'},
        )
    return PlainTextResponse(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="disputes.csv"'},
    )


@router.get("/admin/list")
async def list_complaints_admin(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ComplaintService(session).list_for_admin()
    return success_envelope(data, request)


@router.get("/admin/{complaint_id}")
async def get_complaint_admin(
    complaint_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ComplaintService(session).get_for_admin(complaint_id)
    return success_envelope(data, request)


@router.patch("/admin/{complaint_id}/status")
async def update_complaint_status_admin(
    complaint_id: UUID,
    body: ComplaintStatusUpdateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ComplaintService(session).update_status_admin(
        UUID(payload["sub"]),
        complaint_id,
        status=body.status,
        admin_notes=body.admin_notes,
        note=body.note,
    )
    return success_envelope(data, request)


@router.get("/{complaint_id}")
async def get_complaint_detail(
    complaint_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    data = await ComplaintService(session).get_for_customer(UUID(payload["sub"]), complaint_id)
    return success_envelope(data, request)
