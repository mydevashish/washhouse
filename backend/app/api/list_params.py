"""FastAPI dependency for standardized list query parameters."""

from __future__ import annotations

from typing import Annotated

from fastapi import Query

from app.core.pagination import DEFAULT_PAGE_SIZE, ListQueryParams


def get_list_query_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    sort_by: str | None = Query(default=None, max_length=64),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
) -> ListQueryParams:
    return ListQueryParams.from_query(
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )


ListQueryDep = Annotated[ListQueryParams, Query()]

# Re-export with Depends wrapper for endpoints
from fastapi import Depends  # noqa: E402

ListParams = Annotated[ListQueryParams, Depends(get_list_query_params)]
