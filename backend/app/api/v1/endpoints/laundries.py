"""Public laundry discovery and reviews."""

from __future__ import annotations

from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response

from app.api.utils import pagination_meta, success_envelope
from app.api.v1.deps import SessionDep, get_current_user_payload
from app.core.config import settings
from app.schemas.laundry import LaundryDetailResponse, LaundryListItem, LaundryServiceResponse
from app.schemas.laundry_price_list import PublicLaundryPriceListResponse
from app.schemas.review import ReviewCreateRequest, ReviewResponse
from app.schemas.storefront import PublicStorefrontResponse, StorefrontResponse
from app.services.laundry_price_list_service import LaundryPriceListService
from app.services.laundry_service import LaundryService
from app.services.review_service import ReviewService
from app.services.storefront_service import StorefrontService

router = APIRouter(prefix="/laundries", tags=["laundries"])


@router.get("/search")
async def search_laundries(
    request: Request,
    session: SessionDep,
    q: str = Query(min_length=1, max_length=200),
    city: str | None = None,
    min_rating: float | None = Query(default=None, ge=0, le=5),
    sort: Literal["relevance", "rating", "name"] = Query(default="relevance"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    result = await LaundryService(session).search_public(
        query=q,
        city=city,
        min_rating=min_rating,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    return success_envelope(
        result,
        request,
        pagination=pagination_meta(total=result.total, limit=limit, offset=offset),
    )


@router.get("")
async def list_laundries(
    request: Request,
    session: SessionDep,
    city: str | None = None,
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    data = await LaundryService(session).list_public(city=city, limit=limit, offset=offset)
    return success_envelope(data, request)


@router.get("/{laundry_id}")
async def get_laundry(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
) -> dict:
    row = await LaundryService(session).get_public(laundry_id)
    return success_envelope(LaundryDetailResponse.model_validate(row), request)


@router.get("/{laundry_id}/price-list")
async def get_laundry_price_list(
    laundry_id: UUID,
    request: Request,
    response: Response,
    session: SessionDep,
) -> dict:
    """Public garment price list for an approved laundry (active offered items only)."""
    data = await LaundryPriceListService(session).get_public_price_list(laundry_id)
    response.headers["Cache-Control"] = (
        f"public, max-age={settings.CACHE_LAUNDRY_PRICE_LIST_TTL_SEC}"
    )
    return success_envelope(PublicLaundryPriceListResponse.model_validate(data), request)


@router.get("/{laundry_id}/storefront")
async def get_laundry_storefront(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
) -> dict:
    payload = await StorefrontService(session).get_public(laundry_id)
    data = PublicStorefrontResponse(
        storefront=StorefrontResponse.model_validate(payload["storefront"]),
        laundry=LaundryDetailResponse.model_validate(payload["laundry"]),
        orders_completed=payload["orders_completed"],
        services=[LaundryServiceResponse.model_validate(s) for s in payload["services"]],
    )
    return success_envelope(data, request)


@router.get("/{laundry_id}/reviews")
async def list_reviews(
    laundry_id: UUID,
    request: Request,
    session: SessionDep,
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    rows = await ReviewService(session).list_for_laundry(laundry_id, limit=limit, offset=offset)
    data = [ReviewResponse.model_validate(r) for r in rows]
    return success_envelope(data, request)


@router.post("/{laundry_id}/reviews", status_code=201)
async def create_review(
    laundry_id: UUID,
    body: ReviewCreateRequest,
    request: Request,
    session: SessionDep,
    payload: Annotated[dict, Depends(get_current_user_payload)],
) -> dict:
    review = await ReviewService(session).create(
        UUID(payload["sub"]),
        laundry_id,
        order_id=body.order_id,
        rating=body.rating,
        comment=body.comment,
    )
    return success_envelope(ReviewResponse.model_validate(review), request)
