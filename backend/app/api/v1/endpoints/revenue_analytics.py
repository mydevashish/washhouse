"""Admin laundry-wise revenue analytics API."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import PlainTextResponse, Response

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.schemas.revenue_analytics import (
    LaundryRevenueDetailResponse,
    PaginatedLaundryRevenueResponse,
    RevenueAnalyticsDashboardResponse,
    RevenueChartsResponse,
    RevenuePeriod,
)
from app.services.revenue_analytics_service import RevenueAnalyticsService

router = APIRouter(prefix="/admin/revenue-analytics", tags=["admin-revenue-analytics"])


@router.get("/dashboard")
async def revenue_analytics_dashboard(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    period: RevenuePeriod = Query(default=RevenuePeriod.last_30_days),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> dict:
    data = await RevenueAnalyticsService(session).dashboard(
        period=period,
        date_from=date_from,
        date_to=date_to,
    )
    return success_envelope(RevenueAnalyticsDashboardResponse.model_validate(data), request)


@router.get("/laundries")
async def revenue_analytics_laundries(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    period: RevenuePeriod = Query(default=RevenuePeriod.last_30_days),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    laundry_id: UUID | None = None,
    partner_id: UUID | None = None,
    city: str | None = None,
    state: str | None = None,
    status: str | None = None,
    revenue_min: Decimal | None = None,
    revenue_max: Decimal | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    sort_by: str = Query(default="revenue"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
) -> dict:
    data = await RevenueAnalyticsService(session).list_laundries(
        period=period,
        date_from=date_from,
        date_to=date_to,
        laundry_id=laundry_id,
        partner_id=partner_id,
        city=city,
        state=state,
        status=status,
        revenue_min=revenue_min,
        revenue_max=revenue_max,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return success_envelope(PaginatedLaundryRevenueResponse.model_validate(data), request)


@router.get("/charts")
async def revenue_analytics_charts(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    period: RevenuePeriod = Query(default=RevenuePeriod.last_30_days),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> dict:
    data = await RevenueAnalyticsService(session).charts(
        period=period,
        date_from=date_from,
        date_to=date_to,
    )
    return success_envelope(RevenueChartsResponse.model_validate(data), request)


@router.get("/laundries/{laundry_id}")
async def revenue_analytics_laundry_detail(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    period: RevenuePeriod = Query(default=RevenuePeriod.last_30_days),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> dict:
    data = await RevenueAnalyticsService(session).laundry_detail(
        laundry_id,
        period=period,
        date_from=date_from,
        date_to=date_to,
    )
    return success_envelope(LaundryRevenueDetailResponse.model_validate(data), request)


@router.get("/export")
async def revenue_analytics_export(
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    period: RevenuePeriod = Query(default=RevenuePeriod.last_30_days),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    laundry_id: UUID | None = None,
    partner_id: UUID | None = None,
    city: str | None = None,
    state: str | None = None,
    status: str | None = None,
    format: str = Query(default="csv", pattern="^(csv|xlsx|pdf)$"),
) -> Response:
    csv_text = await RevenueAnalyticsService(session).export_csv(
        period=period,
        date_from=date_from,
        date_to=date_to,
        laundry_id=laundry_id,
        partner_id=partner_id,
        city=city,
        state=state,
        status=status,
    )
    if format == "csv":
        return PlainTextResponse(
            content=csv_text,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="laundry-revenue.csv"'},
        )
    if format == "xlsx":
        # Excel-compatible CSV with UTF-8 BOM
        return PlainTextResponse(
            content="\ufeff" + csv_text,
            media_type="application/vnd.ms-excel",
            headers={"Content-Disposition": 'attachment; filename="laundry-revenue.xls"'},
        )
    # Simple PDF-like text report
    lines = ["DLM Laundry Revenue Report", "=" * 40, "", csv_text]
    return PlainTextResponse(
        content="\n".join(lines),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="laundry-revenue-report.txt"'},
    )
