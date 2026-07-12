"""Admin settlement & payout API."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import PlainTextResponse, Response

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.schemas.settlement import (
    PaginatedSettlementTableResponse,
    SettlementActionRequest,
    SettlementAdjustmentRequest,
    SettlementAnalyticsResponse,
    SettlementAuditRow,
    SettlementDashboardResponse,
    SettlementDetailResponse,
    SettlementRunResponse,
)
from app.services.settlement_service import SettlementService

router = APIRouter(prefix="/admin/settlements", tags=["admin-settlements"])


@router.get("/dashboard")
async def settlement_dashboard(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await SettlementService(session).dashboard()
    return success_envelope(SettlementDashboardResponse.model_validate(data), request)


@router.get("/analytics")
async def settlement_analytics(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await SettlementService(session).analytics()
    return success_envelope(SettlementAnalyticsResponse.model_validate(data), request)


@router.get("/audit")
async def settlement_audit_log(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    settlement_id: UUID | None = None,
    limit: int = Query(default=50, ge=1, le=200),
) -> dict:
    rows = await SettlementService(session).audit_log(settlement_id=settlement_id, limit=limit)
    return success_envelope([SettlementAuditRow.model_validate(r) for r in rows], request)


@router.get("")
async def settlement_table(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    status: str | None = None,
    laundry_id: UUID | None = None,
    partner_id: UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    sort_by: str = Query(default="created_at"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
) -> dict:
    data = await SettlementService(session).admin_table(
        status=status,
        laundry_id=laundry_id,
        partner_id=partner_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return success_envelope(PaginatedSettlementTableResponse.model_validate(data), request)


@router.post("/run")
async def run_settlement_batch(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    svc = SettlementService(session)
    eligibility = await svc.scan_eligibility()
    created = await svc.create_settlements_from_eligible(actor_user_id=UUID(payload["sub"]))
    return success_envelope(
        SettlementRunResponse(settlements_created=created, eligibility_updated=eligibility),
        request,
    )


@router.get("/export")
async def settlement_export(
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    status: str | None = None,
    laundry_id: UUID | None = None,
    partner_id: UUID | None = None,
    format: str = Query(default="csv", pattern="^(csv|xlsx|pdf)$"),
) -> Response:
    svc = SettlementService(session)
    if format == "pdf":
        pdf_text = await svc.export_pdf_report(
            status=status,
            laundry_id=laundry_id,
            partner_id=partner_id,
        )
        return PlainTextResponse(
            content=pdf_text,
            media_type="text/plain",
            headers={"Content-Disposition": 'attachment; filename="settlements-report.txt"'},
        )
    csv_text = await svc.export_csv(
        status=status,
        laundry_id=laundry_id,
        partner_id=partner_id,
    )
    if format == "csv":
        return PlainTextResponse(
            content=csv_text,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="settlements.csv"'},
        )
    return PlainTextResponse(
        content="\ufeff" + csv_text,
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": 'attachment; filename="settlements.xls"'},
    )


@router.get("/{settlement_id}")
async def settlement_detail(
    settlement_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await SettlementService(session).get_detail(settlement_id)
    return success_envelope(SettlementDetailResponse.model_validate(data), request)


@router.post("/{settlement_id}/approve")
async def approve_settlement(
    settlement_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await SettlementService(session).approve(settlement_id, actor_user_id=UUID(payload["sub"]))
    return success_envelope(SettlementDetailResponse.model_validate(data), request)


@router.post("/{settlement_id}/reject")
async def reject_settlement(
    settlement_id: UUID,
    body: SettlementActionRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await SettlementService(session).reject(
        settlement_id,
        actor_user_id=UUID(payload["sub"]),
        reason=body.reason or "Rejected by admin",
    )
    return success_envelope(SettlementDetailResponse.model_validate(data), request)


@router.post("/{settlement_id}/process")
async def process_settlement(
    settlement_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await SettlementService(session).process(settlement_id, actor_user_id=UUID(payload["sub"]))
    return success_envelope(SettlementDetailResponse.model_validate(data), request)


@router.post("/{settlement_id}/release")
async def release_settlement_payout(
    settlement_id: UUID,
    body: SettlementActionRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await SettlementService(session).release_payout(
        settlement_id,
        actor_user_id=UUID(payload["sub"]),
        payout_reference=body.payout_reference or f"PAY-{settlement_id.hex[:12].upper()}",
    )
    return success_envelope(SettlementDetailResponse.model_validate(data), request)


@router.post("/{settlement_id}/fail")
async def fail_settlement(
    settlement_id: UUID,
    body: SettlementActionRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await SettlementService(session).mark_failed(
        settlement_id,
        actor_user_id=UUID(payload["sub"]),
        reason=body.reason or "Payout failed",
    )
    return success_envelope(SettlementDetailResponse.model_validate(data), request)


@router.post("/{settlement_id}/hold")
async def hold_settlement(
    settlement_id: UUID,
    body: SettlementActionRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await SettlementService(session).hold(
        settlement_id,
        actor_user_id=UUID(payload["sub"]),
        reason=body.reason or "Held by admin",
    )
    return success_envelope(SettlementDetailResponse.model_validate(data), request)


@router.post("/{settlement_id}/release-hold")
async def release_settlement_hold(
    settlement_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await SettlementService(session).release_from_hold(
        settlement_id,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(SettlementDetailResponse.model_validate(data), request)


@router.post("/{settlement_id}/adjustments")
async def add_settlement_adjustment(
    settlement_id: UUID,
    body: SettlementAdjustmentRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await SettlementService(session).add_adjustment(
        settlement_id,
        amount_inr=body.amount_inr,
        reason=body.reason,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(SettlementDetailResponse.model_validate(data), request)
