"""Partner customer insights business logic."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError
from app.models.enums import FraudRiskLevel, UserRole
from app.repositories.customer_insights import CustomerInsightsRepository

ACTIVE_DAYS = 30
NEW_CUSTOMER_DAYS = 30
AT_RISK_DAYS_MIN = 31
AT_RISK_DAYS_MAX = 90
INACTIVE_DAYS = 91
VIP_MIN_ORDERS = 5
VIP_MIN_SPEND_INR = Decimal("5000")
TOP_CUSTOMER_LIMIT = 10
REPEAT_MIN_ORDERS = 2

SEGMENT_LABELS = {
    "new": "New",
    "active": "Active",
    "vip": "VIP",
    "at_risk": "At risk",
    "inactive": "Inactive",
}

RISK_LABELS = {
    FraudRiskLevel.low.value: "Low",
    FraudRiskLevel.medium.value: "Medium",
    FraudRiskLevel.high.value: "High",
    FraudRiskLevel.critical.value: "Critical",
}


def _days_since(dt: datetime | None, now: datetime) -> int | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return max(0, (now - dt).days)


def _retention_score(*, days_since_last: int | None, order_count: int, spend: Decimal, spend_p90: Decimal) -> int:
    if days_since_last is None:
        return 0
    recency = max(0, min(100, 100 - int(days_since_last * 100 / 180)))
    frequency = min(100, order_count * 15)
    monetary = 0
    if spend_p90 > 0:
        monetary = min(100, int((spend / spend_p90) * 100))
    score = recency * 0.4 + frequency * 0.35 + monetary * 0.25
    return max(0, min(100, int(round(score))))


def _risk_label(trust_score: int, fraud_risk_level: str, dispute_count: int) -> str:
    if fraud_risk_level in (FraudRiskLevel.critical.value, FraudRiskLevel.high.value):
        return RISK_LABELS.get(fraud_risk_level, "High")
    if trust_score < 50 or dispute_count >= 2:
        return "High"
    if trust_score < 70 or dispute_count >= 1:
        return "Medium"
    return "Low"


def _is_high_risk(trust_score: int, fraud_risk_level: str, dispute_count: int) -> bool:
    if fraud_risk_level in (FraudRiskLevel.critical.value, FraudRiskLevel.high.value):
        return True
    if trust_score < 50:
        return True
    if dispute_count >= 2:
        return True
    return False


def _assign_segment(
    *,
    order_count: int,
    days_since_first: int | None,
    days_since_last: int | None,
    is_vip: bool,
) -> str:
    if days_since_last is None:
        return "inactive"
    if order_count == 1 and days_since_first is not None and days_since_first <= NEW_CUSTOMER_DAYS:
        return "new"
    if is_vip and days_since_last <= ACTIVE_DAYS:
        return "vip"
    if days_since_last <= ACTIVE_DAYS:
        return "active"
    if days_since_last >= INACTIVE_DAYS:
        return "inactive"
    if AT_RISK_DAYS_MIN <= days_since_last <= AT_RISK_DAYS_MAX and order_count >= REPEAT_MIN_ORDERS:
        return "at_risk"
    if days_since_last > ACTIVE_DAYS:
        return "inactive"
    return "active"


class CustomerInsightsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CustomerInsightsRepository(session)
        from app.repositories.laundry_customer_registration import LaundryCustomerRegistrationRepository

        self._registrations = LaundryCustomerRegistrationRepository(session)

    async def resolve_laundry_for_actor(self, actor_user_id: UUID, actor_role: str):
        return await self._resolve_laundry(actor_user_id, actor_role)

    async def _resolve_laundry(self, actor_user_id: UUID, actor_role: str):
        if actor_role == UserRole.partner.value:
            laundry = await self._repo.get_laundry_for_owner(actor_user_id)
            if not laundry:
                raise NotFoundError("Partner laundry not found")
            return laundry
        if actor_role == UserRole.partner_staff.value:
            from app.repositories.staff_management import StaffManagementRepository
            from app.services.staff_permissions import PERM_CUSTOMERS, has_permission

            staff = await StaffManagementRepository(session=self._session).get_staff_by_user(actor_user_id)
            if not staff or not staff.is_active:
                raise AuthorizationError()
            if not has_permission(staff.role, PERM_CUSTOMERS):
                raise AuthorizationError()
            laundry = await self._repo.get_laundry(staff.laundry_id)
            if not laundry:
                raise NotFoundError("Laundry not found")
            return laundry
        raise AuthorizationError()

    def _enrich_rows(self, raw_rows: list[dict], now: datetime, *, use_percentile_vip: bool = True) -> list[dict]:
        if not raw_rows:
            return []
        spends = sorted((r["total_spent_inr"] for r in raw_rows), reverse=True)
        vip_spend_threshold = Decimal("0")
        spend_p90 = Decimal("1")
        if use_percentile_vip and spends:
            vip_threshold_idx = max(0, int(len(spends) * 0.1) - 1)
            vip_spend_threshold = spends[vip_threshold_idx]
            p90_idx = max(0, int(len(spends) * 0.9) - 1)
            spend_p90 = spends[p90_idx] if spends else Decimal("1")

        enriched: list[dict] = []
        for row in raw_rows:
            days_last = _days_since(row["last_order_at"], now)
            days_first = _days_since(row["first_order_at"], now)
            order_count = row["order_count"]
            spend = row["total_spent_inr"]
            is_vip = (
                order_count >= VIP_MIN_ORDERS
                and spend >= VIP_MIN_SPEND_INR
            ) or (use_percentile_vip and spend >= vip_spend_threshold and vip_spend_threshold > 0)
            segment = _assign_segment(
                order_count=order_count,
                days_since_first=days_first,
                days_since_last=days_last,
                is_vip=is_vip,
            )
            avg_order = (spend / order_count).quantize(Decimal("0.01")) if order_count else Decimal("0")
            retention = _retention_score(
                days_since_last=days_last,
                order_count=order_count,
                spend=spend,
                spend_p90=spend_p90 if use_percentile_vip else max(spend, Decimal("1")),
            )
            risk_label = _risk_label(row["trust_score"], row["fraud_risk_level"], row["dispute_count"])
            high_risk = _is_high_risk(row["trust_score"], row["fraud_risk_level"], row["dispute_count"])
            enriched.append(
                {
                    **row,
                    "avg_order_value_inr": avg_order,
                    "retention_score": retention,
                    "segment": segment,
                    "segment_label": SEGMENT_LABELS[segment],
                    "is_high_risk": high_risk,
                    "risk_label": risk_label,
                    "is_vip": is_vip,
                },
            )
        return enriched

    def _serialize_row(self, row: dict) -> dict:
        return {
            "user_id": row["user_id"],
            "name": row["name"],
            "phone": row.get("phone"),
            "lifetime_spend_inr": str(row["total_spent_inr"]),
            "order_count": row["order_count"],
            "avg_order_value_inr": str(row["avg_order_value_inr"]),
            "last_order_at": row["last_order_at"],
            "first_order_at": row["first_order_at"],
            "retention_score": row["retention_score"],
            "segment": row["segment"],
            "segment_label": row["segment_label"],
            "is_high_risk": row["is_high_risk"],
            "dispute_count": row["dispute_count"],
            "risk_label": row["risk_label"],
        }

    async def partner_dashboard(self, actor_user_id: UUID, actor_role: str) -> dict:
        laundry = await self._resolve_laundry(actor_user_id, actor_role)
        now = datetime.now(UTC)
        raw = await self._repo.customer_aggregates(laundry.id)
        reg_only = await self._registrations.registration_only_rows(laundry.id)
        raw = raw + reg_only
        rows = self._enrich_rows(raw, now)

        segments = {k: 0 for k in SEGMENT_LABELS}
        for row in rows:
            segments[row["segment"]] += 1

        repeat_count = sum(1 for r in rows if r["order_count"] >= REPEAT_MIN_ORDERS)
        vip_count = sum(1 for r in rows if r["segment"] == "vip" or r.get("is_vip"))
        inactive_count = segments["inactive"]
        high_risk_count = sum(1 for r in rows if r["is_high_risk"])

        total_spend = sum((r["total_spent_inr"] for r in rows), Decimal("0"))
        total_orders = sum(r["order_count"] for r in rows)
        avg_retention = sum(r["retention_score"] for r in rows) / len(rows) if rows else 0
        week_ago = now - timedelta(days=7)
        new_this_week = sum(
            1
            for r in rows
            if r.get("first_order_at") is not None and r["first_order_at"] >= week_ago
        )
        new_this_week += sum(
            1
            for r in reg_only
            if r.get("registered_at") is not None and r["registered_at"] >= week_ago
        )

        # Hub pillar order KPIs — Option A: single dashboard round-trip (see four-pillars spec).
        from app.services.partner_analytics_period import (
            PartnerOverviewPeriod,
            resolve_partner_overview_period,
        )

        week_bounds = resolve_partner_overview_period(PartnerOverviewPeriod.week, now=now)
        orders_count_all_time = await self._repo.count_laundry_orders(laundry.id)
        orders_count_this_week = await self._repo.count_laundry_orders(
            laundry.id,
            created_from=week_bounds.period_start_utc,
            created_to=week_bounds.period_end_utc,
        )

        return {
            "total_customers": len(rows),
            "segments": segments,
            "lists": {
                "top": min(len(rows), TOP_CUSTOMER_LIMIT),
                "repeat": repeat_count,
                "vip": vip_count,
                "inactive": inactive_count,
                "high_risk": high_risk_count,
            },
            "avg_retention_score": f"{avg_retention:.1f}",
            "avg_lifetime_spend_inr": str(
                (total_spend / len(rows)).quantize(Decimal("0.01")) if rows else Decimal("0"),
            ),
            "avg_order_value_inr": str(
                (total_spend / total_orders).quantize(Decimal("0.01")) if total_orders else Decimal("0"),
            ),
            "new_this_week": new_this_week,
            "orders_count_all_time": orders_count_all_time,
            "orders_count_this_week": orders_count_this_week,
        }

    async def partner_list_customers(
        self,
        actor_user_id: UUID,
        actor_role: str,
        *,
        list_type: str | None = None,
        segment: str | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> dict:
        from app.core.pagination import build_paginated_response, normalize_page_size

        laundry = await self._resolve_laundry(actor_user_id, actor_role)
        now = datetime.now(UTC)
        safe_page = max(1, page)
        safe_size = normalize_page_size(page_size)
        offset = (safe_page - 1) * safe_size

        # Common directory path: page in SQL (fixed VIP thresholds — no full dump).
        if not list_type and not segment:
            order_total = await self._repo.count_customer_aggregates(laundry.id, search=search)
            reg_total = await self._registrations.count_registration_only(laundry.id, search=search)
            total = order_total + reg_total
            offset = (safe_page - 1) * safe_size

            reg_rows = await self._registrations.registration_only_rows(laundry.id, search=search)
            reg_rows.sort(key=lambda r: (str(r.get("name") or "").lower(), str(r.get("phone") or "")))

            if offset >= order_total:
                page_raw = reg_rows[offset - order_total : offset - order_total + safe_size]
            elif offset + safe_size <= order_total:
                page_raw = await self._repo.customer_aggregates(
                    laundry.id,
                    search=search,
                    limit=safe_size,
                    offset=offset,
                )
            else:
                order_part = await self._repo.customer_aggregates(
                    laundry.id,
                    search=search,
                    limit=order_total - offset,
                    offset=offset,
                )
                reg_take = safe_size - len(order_part)
                page_raw = order_part + reg_rows[:reg_take]

            rows = self._enrich_rows(page_raw, now, use_percentile_vip=False)
            return build_paginated_response(
                items=[self._serialize_row(r) for r in rows],
                total_records=total,
                page=safe_page,
                page_size=safe_size,
            )

        # Segment / list_type filters still need enriched set; hard-cap to avoid unbounded dumps.
        FILTERED_CAP = 500
        rows = self._enrich_rows(
            await self._repo.customer_aggregates(laundry.id, limit=FILTERED_CAP),
            now,
        )

        if list_type == "top":
            rows = rows[:TOP_CUSTOMER_LIMIT]
        elif list_type == "repeat":
            rows = [r for r in rows if r["order_count"] >= REPEAT_MIN_ORDERS]
        elif list_type == "vip":
            rows = [r for r in rows if r.get("is_vip")]
        elif list_type == "inactive":
            rows = [r for r in rows if r["segment"] == "inactive"]
        elif list_type == "high_risk":
            rows = [r for r in rows if r["is_high_risk"]]

        if segment and segment in SEGMENT_LABELS:
            rows = [r for r in rows if r["segment"] == segment]

        if search:
            term = search.strip().lower()
            if term:
                rows = [
                    r
                    for r in rows
                    if term in str(r.get("name") or "").lower()
                    or term in str(r.get("phone") or "").lower()
                ]

        total = len(rows)
        page_rows = rows[offset : offset + safe_size]
        return build_paginated_response(
            items=[self._serialize_row(r) for r in page_rows],
            total_records=total,
            page=safe_page,
            page_size=safe_size,
        )