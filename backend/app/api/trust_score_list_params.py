"""Trust score list query parameters."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import Query

from app.core.pagination import DEFAULT_PAGE_SIZE, ListQueryParams


class TrustScoreListParams(ListQueryParams):
    role: str | None = None
    risk_level: str | None = None
    trust_score_min: int | None = None
    trust_score_max: int | None = None
    status: str | None = None
    created_from: datetime | None = None
    created_to: datetime | None = None


def get_trust_score_list_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    sort_by: str | None = Query(default="trust_score", max_length=64),
    sort_order: str = Query(default="asc", pattern="^(asc|desc)$"),
    role: str | None = Query(default=None),
    risk_level: str | None = Query(default=None),
    trust_score_min: int | None = Query(default=None, ge=0, le=100),
    trust_score_max: int | None = Query(default=None, ge=0, le=100),
    status: str | None = Query(default=None),
    created_from: datetime | None = Query(default=None),
    created_to: datetime | None = Query(default=None),
) -> TrustScoreListParams:
    base = ListQueryParams.from_query(
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return TrustScoreListParams(
        page=base.page,
        page_size=base.page_size,
        search=base.search,
        sort_by=base.sort_by,
        sort_order=base.sort_order,
        role=role,
        risk_level=risk_level,
        trust_score_min=trust_score_min,
        trust_score_max=trust_score_max,
        status=status,
        created_from=created_from,
        created_to=created_to,
    )


TrustScoreListParamsDep = Annotated[TrustScoreListParams, Query()]

from fastapi import Depends  # noqa: E402

TrustScoreListQuery = Annotated[TrustScoreListParams, Depends(get_trust_score_list_params)]
