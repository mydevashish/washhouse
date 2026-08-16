"""Partner orders list query parameters."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Annotated, Literal

from fastapi import Depends, Query

from app.core.pagination import DEFAULT_PAGE_SIZE, ListQueryParams, SortOrder, normalize_page_size

PartnerOrderBucket = Literal["action", "active", "done", "all"]
PARTNER_ORDERS_EXPORT_MAX_PAGE_SIZE = 5000


@dataclass(frozen=True)
class PartnerOrdersListParams(ListQueryParams):
    """Standard list params + partner queue bucket / status filters."""

    bucket: PartnerOrderBucket = "all"
    status: str | None = None
    order_source: str | None = None
    payment_status: str | None = None
    created_today: bool = False
    date_from: date | None = None
    date_to: date | None = None


def get_partner_orders_list_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=PARTNER_ORDERS_EXPORT_MAX_PAGE_SIZE),
    search: str | None = Query(default=None, max_length=200),
    sort_by: str | None = Query(default="created_at", max_length=64),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    bucket: PartnerOrderBucket = Query(default="all"),
    status: str | None = Query(default=None, max_length=64),
    order_source: str | None = Query(default=None, max_length=32),
    payment_status: str | None = Query(default=None, max_length=32),
    created_today: bool = Query(default=False),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
) -> PartnerOrdersListParams:
    has_date_filter = date_from is not None or date_to is not None
    if has_date_filter:
        safe_size = min(max(1, page_size), PARTNER_ORDERS_EXPORT_MAX_PAGE_SIZE)
    else:
        safe_size = normalize_page_size(page_size)

    base = ListQueryParams.from_query(
        page=page,
        page_size=safe_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    src = order_source.strip() if order_source and order_source.strip() else None
    st = status.strip() if status and status.strip() else None
    pay = payment_status.strip() if payment_status and payment_status.strip() else None
    return PartnerOrdersListParams(
        page=base.page,
        page_size=safe_size,
        search=base.search,
        sort_by=base.sort_by or "created_at",
        sort_order=base.sort_order if isinstance(base.sort_order, SortOrder) else SortOrder.desc,
        bucket=bucket,
        status=st,
        order_source=src,
        payment_status=pay,
        created_today=created_today,
        date_from=date_from,
        date_to=date_to,
    )


PartnerOrdersListParamsDep = Annotated[PartnerOrdersListParams, Depends(get_partner_orders_list_params)]
