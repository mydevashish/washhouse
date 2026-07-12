"""Admin dispute analytics API."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import PlainTextResponse, Response

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep, get_current_admin
from app.schemas.dispute_analytics import (
    DisputeAnalyticsChartsResponse,
    DisputeAnalyticsDashboardResponse,
)
from app.schemas.revenue_analytics import RevenuePeriod
from app.services.dispute_analytics_service import DisputeAnalyticsService

router = APIRouter(prefix="/admin/dispute-analytics", tags=["admin-dispute-analytics"])


@router.get("/dashboard")
async def dispute_analytics_dashboard(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    period: RevenuePeriod = Query(default=RevenuePeriod.last_30_days),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> dict:
    data = await DisputeAnalyticsService(session).dashboard(
        period=period,
        date_from=date_from,
        date_to=date_to,
    )
    return success_envelope(DisputeAnalyticsDashboardResponse.model_validate(data), request)


@router.get("/charts")
async def dispute_analytics_charts(
    request: Request,
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    period: RevenuePeriod = Query(default=RevenuePeriod.last_30_days),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> dict:
    data = await DisputeAnalyticsService(session).charts(
        period=period,
        date_from=date_from,
        date_to=date_to,
    )
    return success_envelope(DisputeAnalyticsChartsResponse.model_validate(data), request)


@router.get("/export")
async def dispute_analytics_export(
    session: SessionDep,
    _: Annotated[dict, Depends(get_current_admin)],
    period: RevenuePeriod = Query(default=RevenuePeriod.last_30_days),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    format: str = Query(default="csv", pattern="^(csv|xlsx|pdf)$"),
) -> Response:
    csv_text = await DisputeAnalyticsService(session).export_csv(
        period=period,
        date_from=date_from,
        date_to=date_to,
    )
    if format == "csv":
        return PlainTextResponse(
            content=csv_text,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="dispute-analytics.csv"'},
        )
    if format == "xlsx":
        return PlainTextResponse(
            content="\ufeff" + csv_text,
            media_type="application/vnd.ms-excel",
            headers={"Content-Disposition": 'attachment; filename="dispute-analytics.xls"'},
        )
    lines = ["DLM Dispute Analytics Report", "=" * 40, "", csv_text]
    return PlainTextResponse(
        content="\n".join(lines),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="dispute-analytics-report.txt"'},
    )
