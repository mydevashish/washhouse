"""Platform-wide pagination, search, sort, and filter utilities."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Literal

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

DEFAULT_PAGE_SIZE = 10
ALLOWED_PAGE_SIZES = frozenset({10, 25, 50, 100})
MAX_PAGE_SIZE = 100


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


@dataclass(frozen=True)
class ListQueryParams:
    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE
    search: str | None = None
    sort_by: str | None = None
    sort_order: SortOrder = SortOrder.desc

    @classmethod
    def from_query(
        cls,
        *,
        page: int = 1,
        page_size: int = DEFAULT_PAGE_SIZE,
        search: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> ListQueryParams:
        safe_page = max(1, page)
        safe_size = page_size if page_size in ALLOWED_PAGE_SIZES else DEFAULT_PAGE_SIZE
        order = SortOrder.asc if sort_order.lower() == "asc" else SortOrder.desc
        term = search.strip() if search and search.strip() else None
        return cls(
            page=safe_page,
            page_size=safe_size,
            search=term,
            sort_by=sort_by.strip() if sort_by and sort_by.strip() else None,
            sort_order=order,
        )

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def build_paginated_response(
    *,
    items: list[Any],
    total_records: int,
    page: int,
    page_size: int,
) -> dict[str, Any]:
    total_pages = max(1, (total_records + page_size - 1) // page_size) if page_size > 0 else 1
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total_records": total_records,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
    }


async def paginate_select(
    session: AsyncSession,
    stmt: Select,
    *,
    page: int,
    page_size: int,
) -> tuple[list[Any], int]:
    """Execute a SELECT with count subquery and page slice."""
    safe_page = max(1, page)
    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = int(await session.scalar(count_stmt) or 0)
    rows = await session.scalars(
        stmt.offset((safe_page - 1) * page_size).limit(page_size),
    )
    return list(rows.all()), total


def apply_ilike_search(
    stmt: Select,
    term: str | None,
    *columns,
) -> Select:
    if not term:
        return stmt
    from sqlalchemy import or_

    pattern = f"%{term}%"
    return stmt.where(or_(*[col.ilike(pattern) for col in columns]))


def apply_sort(
    stmt: Select,
    sort_by: str | None,
    sort_order: SortOrder | str,
    *,
    column_map: dict[str, Any],
    default: Any,
) -> Select:
    col = column_map.get(sort_by or "", default)
    if isinstance(sort_order, str):
        sort_order = SortOrder.asc if sort_order.lower() == "asc" else SortOrder.desc
    order_expr = col.asc() if sort_order == SortOrder.asc else col.desc()
    return stmt.order_by(order_expr)
