"""Admin profit sharing API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.schemas.profit_sharing import (
    FinalizePeriodRequest,
    MarkPayoutPaidRequest,
    OwnershipPartnerCreate,
    OwnershipPartnerUpdate,
    PlatformExpenseCreate,
    ProfitShareAllocationRow,
    ProfitSharePeriodRow,
    ProfitSharingOverview,
    OwnershipPartnerRow,
    PlatformExpenseRow,
    PeriodPreview,
)
from app.services.profit_sharing_service import ProfitSharingService

router = APIRouter(prefix="/admin/profit-sharing", tags=["admin-profit-sharing"])


@router.get("/overview")
async def profit_sharing_overview(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ProfitSharingService(session).admin_overview()
    return success_envelope(ProfitSharingOverview.model_validate(data), request)


@router.get("/partners")
async def list_ownership_partners(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ProfitSharingService(session).list_partners()
    return success_envelope([OwnershipPartnerRow.model_validate(r) for r in data], request)


@router.post("/partners")
async def create_ownership_partner(
    body: OwnershipPartnerCreate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ProfitSharingService(session).create_partner(
        body=body.model_dump(),
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(OwnershipPartnerRow.model_validate(data), request)


@router.patch("/partners/{partner_id}")
async def update_ownership_partner(
    partner_id: UUID,
    body: OwnershipPartnerUpdate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ProfitSharingService(session).update_partner(
        partner_id,
        body=body.model_dump(exclude_unset=True),
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(OwnershipPartnerRow.model_validate(data), request)


@router.delete("/partners/{partner_id}")
async def deactivate_ownership_partner(
    partner_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ProfitSharingService(session).deactivate_partner(
        partner_id,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(OwnershipPartnerRow.model_validate(data), request)


@router.get("/expenses")
async def list_platform_expenses(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    year: int = Query(..., ge=2020, le=2100),
    month: int = Query(..., ge=1, le=12),
) -> dict:
    data = await ProfitSharingService(session).list_expenses(year, month)
    return success_envelope([PlatformExpenseRow.model_validate(r) for r in data], request)


@router.post("/expenses")
async def create_platform_expense(
    body: PlatformExpenseCreate,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ProfitSharingService(session).create_expense(
        body=body.model_dump(),
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(PlatformExpenseRow.model_validate(data), request)


@router.delete("/expenses/{expense_id}")
async def delete_platform_expense(
    expense_id: UUID,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    await ProfitSharingService(session).delete_expense(expense_id, actor_user_id=UUID(payload["sub"]))
    return success_envelope({"deleted": True}, request)


@router.get("/periods/preview")
async def preview_profit_period(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    year: int = Query(..., ge=2020, le=2100),
    month: int = Query(..., ge=1, le=12),
) -> dict:
    data = await ProfitSharingService(session).preview_period(year, month)
    return success_envelope(PeriodPreview.model_validate(data), request)


@router.get("/periods")
async def list_profit_periods(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ProfitSharingService(session).list_periods()
    return success_envelope([ProfitSharePeriodRow.model_validate(r) for r in data], request)


@router.post("/periods/finalize")
async def finalize_profit_period(
    body: FinalizePeriodRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ProfitSharingService(session).finalize_period(
        year=body.period_year,
        month=body.period_month,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(ProfitSharePeriodRow.model_validate(data), request)


@router.get("/payouts/pending")
async def list_pending_payouts(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ProfitSharingService(session).pending_payouts()
    return success_envelope([ProfitShareAllocationRow.model_validate(r) for r in data], request)


@router.get("/payouts/history")
async def list_payout_history(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    limit: int = Query(default=50, ge=1, le=200),
) -> dict:
    data = await ProfitSharingService(session).payout_history(limit=limit)
    return success_envelope([ProfitShareAllocationRow.model_validate(r) for r in data], request)


@router.post("/payouts/{allocation_id}/mark-paid")
async def mark_payout_paid(
    allocation_id: UUID,
    body: MarkPayoutPaidRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_admin)],
) -> dict:
    data = await ProfitSharingService(session).mark_payout_paid(
        allocation_id,
        payment_reference=body.payment_reference,
        actor_user_id=UUID(payload["sub"]),
    )
    return success_envelope(ProfitShareAllocationRow.model_validate(data), request)
