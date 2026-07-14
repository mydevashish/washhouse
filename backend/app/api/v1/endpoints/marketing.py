"""Public marketing site endpoints — no authentication required."""

from __future__ import annotations

from fastapi import APIRouter, Query, Request, status

from app.api.utils import success_envelope
from app.api.v1.deps import SessionDep
from app.schemas.marketing import MarketingContactCreate, MarketingFranchiseInquiryCreate
from app.services.marketing_service import MarketingService
from app.utils.request_meta import client_ip

router = APIRouter(prefix="/marketing", tags=["marketing"])


@router.post(
    "/contact",
    status_code=status.HTTP_201_CREATED,
    summary="Submit a marketing contact form",
    description="Public contact form for general enquiries, order help, franchise, and partnerships.",
    responses={
        422: {"description": "Validation error"},
        429: {"description": "Rate limited"},
    },
)
async def submit_contact(
    body: MarketingContactCreate,
    request: Request,
    session: SessionDep,
) -> dict:
    result = await MarketingService(session).submit_contact(body, client_ip=client_ip(request))
    return success_envelope(result.model_dump(), request)


@router.post(
    "/franchise-inquiries",
    status_code=status.HTTP_201_CREATED,
    summary="Submit a franchise partnership inquiry",
    description="Public franchise application form for prospective WashHouse partners.",
    responses={
        422: {"description": "Validation error"},
        429: {"description": "Rate limited"},
    },
)
async def submit_franchise_inquiry(
    body: MarketingFranchiseInquiryCreate,
    request: Request,
    session: SessionDep,
) -> dict:
    result = await MarketingService(session).submit_franchise_inquiry(
        body,
        client_ip=client_ip(request),
    )
    return success_envelope(result.model_dump(), request)


@router.get(
    "/stats",
    summary="Public marketing site statistics",
    description="Aggregated platform stats for marketing pages, with optional curated overrides.",
)
async def get_marketing_stats(request: Request, session: SessionDep) -> dict:
    stats = await MarketingService(session).get_public_stats()
    return success_envelope(stats.model_dump(), request)


@router.get(
    "/testimonials",
    summary="Featured marketing testimonials",
    description="Curated customer testimonials for homepage and landing sections.",
)
async def list_marketing_testimonials(
    request: Request,
    session: SessionDep,
    limit: int = Query(default=6, ge=1, le=20),
) -> dict:
    rows = await MarketingService(session).list_featured_testimonials(limit=limit)
    data = [row.model_dump(by_alias=True) for row in rows]
    return success_envelope(data, request)
