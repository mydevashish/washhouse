"""Partner settlement view API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import PlainTextResponse, Response

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_partner
from app.schemas.settlement import PartnerSettlementSummaryResponse, SettlementDetailResponse
from app.services.settlement_service import SettlementService

router = APIRouter(prefix="/partner/settlements", tags=["partner-settlements"])


@router.get("")
async def partner_settlements(
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
) -> dict:
    data = await SettlementService(session).partner_history(
        UUID(payload["sub"]),
        page=page,
        page_size=page_size,
    )
    return success_envelope(PartnerSettlementSummaryResponse.model_validate(data), request)


@router.get("/export")
async def partner_settlement_export(
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
    format: str = Query(default="csv", pattern="^(csv|xlsx|pdf)$"),
) -> Response:
    partner_id = UUID(payload["sub"])
    csv_text = await SettlementService(session).export_csv(partner_id=partner_id)
    if format == "csv":
        return PlainTextResponse(
            content=csv_text,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="settlement-statement.csv"'},
        )
    if format == "xlsx":
        return PlainTextResponse(
            content="\ufeff" + csv_text,
            media_type="application/vnd.ms-excel",
            headers={"Content-Disposition": 'attachment; filename="settlement-statement.xls"'},
        )
    lines = ["DLM Partner Settlement Statement", "=" * 40, "", csv_text]
    return PlainTextResponse(
        content="\n".join(lines),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="settlement-statement.txt"'},
    )


@router.get("/{settlement_id}")
async def partner_settlement_detail(
    settlement_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_partner)],
) -> dict:
    data = await SettlementService(session).get_detail(settlement_id)
    if str(data["partner_user_id"]) != payload["sub"]:
        from app.core.exceptions import AuthorizationError
        raise AuthorizationError()
    return success_envelope(SettlementDetailResponse.model_validate(data), request)
