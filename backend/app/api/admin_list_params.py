"""Admin list query parameters."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Annotated

from fastapi import Depends, Query

from app.core.pagination import DEFAULT_PAGE_SIZE, ListQueryParams


@dataclass(frozen=True)
class AdminUserListParams(ListQueryParams):
    role: str | None = None


@dataclass(frozen=True)
class AdminOrderListParams(ListQueryParams):
    status: str | None = None


@dataclass(frozen=True)
class AdminAuditListParams(ListQueryParams):
    resource_type: str | None = None
    resource_id: str | None = None
    action: str | None = None
    created_from: datetime | None = None
    created_to: datetime | None = None


def get_admin_user_list_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    sort_by: str | None = Query(default="created_at", max_length=64),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    role: str | None = Query(default=None),
) -> AdminUserListParams:
    base = ListQueryParams.from_query(
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return AdminUserListParams(
        page=base.page,
        page_size=base.page_size,
        search=base.search,
        sort_by=base.sort_by,
        sort_order=base.sort_order,
        role=role,
    )


def get_admin_order_list_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    sort_by: str | None = Query(default="created_at", max_length=64),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    status: str | None = Query(default=None),
) -> AdminOrderListParams:
    base = ListQueryParams.from_query(
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return AdminOrderListParams(
        page=base.page,
        page_size=base.page_size,
        search=base.search,
        sort_by=base.sort_by,
        sort_order=base.sort_order,
        status=status,
    )


def get_admin_audit_list_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    sort_by: str | None = Query(default="created_at", max_length=64),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    resource_type: str | None = Query(default=None),
    resource_id: str | None = Query(default=None),
    action: str | None = Query(default=None),
    created_from: datetime | None = Query(default=None),
    created_to: datetime | None = Query(default=None),
) -> AdminAuditListParams:
    base = ListQueryParams.from_query(
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return AdminAuditListParams(
        page=base.page,
        page_size=base.page_size,
        search=base.search,
        sort_by=base.sort_by,
        sort_order=base.sort_order,
        resource_type=resource_type,
        resource_id=resource_id,
        action=action,
        created_from=created_from,
        created_to=created_to,
    )


AdminUserListQuery = Annotated[AdminUserListParams, Depends(get_admin_user_list_params)]
AdminOrderListQuery = Annotated[AdminOrderListParams, Depends(get_admin_order_list_params)]
AdminAuditListQuery = Annotated[AdminAuditListParams, Depends(get_admin_audit_list_params)]
