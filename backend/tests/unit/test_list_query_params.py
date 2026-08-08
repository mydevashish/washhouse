"""List query param subclasses must accept filter fields (regression for BUG-2026-07-14-002)."""

from app.api.admin_list_params import (
    AdminAuditListParams,
    AdminOrderListParams,
    AdminUserListParams,
    get_admin_audit_list_params,
    get_admin_order_list_params,
    get_admin_user_list_params,
)
from app.api.trust_score_list_params import TrustScoreListParams, get_trust_score_list_params
from app.core.pagination import (
    DEFAULT_PAGE_SIZE,
    ListQueryParams,
    normalize_page_size,
)


def test_normalize_page_size_defaults_and_allowed() -> None:
    assert normalize_page_size(None) == DEFAULT_PAGE_SIZE
    assert normalize_page_size(10) == 10
    assert normalize_page_size(25) == 25
    assert normalize_page_size(50) == 50
    assert normalize_page_size(100) == 100


def test_normalize_page_size_rejects_invalid() -> None:
    assert normalize_page_size(15) == DEFAULT_PAGE_SIZE
    assert normalize_page_size(20) == DEFAULT_PAGE_SIZE
    assert normalize_page_size(0) == DEFAULT_PAGE_SIZE
    assert normalize_page_size(200) == DEFAULT_PAGE_SIZE


def test_list_query_params_from_query_defaults_to_ten() -> None:
    params = ListQueryParams.from_query()
    assert params.page == 1
    assert params.page_size == 10


def test_list_query_params_from_query_invalid_size_falls_back() -> None:
    params = ListQueryParams.from_query(page=2, page_size=15)
    assert params.page == 2
    assert params.page_size == 10


def test_admin_order_list_params_accepts_status() -> None:
    params = get_admin_order_list_params(
        page=1,
        page_size=10,
        search=None,
        sort_by="created_at",
        sort_order="desc",
        status="confirmed",
    )
    assert isinstance(params, AdminOrderListParams)
    assert params.status == "confirmed"
    assert params.page == 1


def test_admin_user_list_params_accepts_role() -> None:
    params = get_admin_user_list_params(
        page=1,
        page_size=25,
        search="demo",
        sort_by="created_at",
        sort_order="asc",
        role="partner",
    )
    assert isinstance(params, AdminUserListParams)
    assert params.role == "partner"
    assert params.page_size == 25


def test_admin_audit_list_params_accepts_resource_filters() -> None:
    params = get_admin_audit_list_params(
        page=1,
        page_size=10,
        search=None,
        sort_by="created_at",
        sort_order="desc",
        resource_type="order",
        resource_id="abc",
        action="update",
        created_from=None,
        created_to=None,
    )
    assert isinstance(params, AdminAuditListParams)
    assert params.resource_type == "order"
    assert params.action == "update"


def test_trust_score_list_params_accepts_role_and_risk() -> None:
    params = get_trust_score_list_params(
        page=1,
        page_size=10,
        search=None,
        sort_by="trust_score",
        sort_order="asc",
        role="customer",
        risk_level="high",
        trust_score_min=10,
        trust_score_max=90,
        status="active",
        created_from=None,
        created_to=None,
    )
    assert isinstance(params, TrustScoreListParams)
    assert params.role == "customer"
    assert params.risk_level == "high"
