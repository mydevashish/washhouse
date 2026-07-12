"""Database aggregations for laundry-wise revenue analytics."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.enums import ComplaintStatus, LaundryStatus, OrderStatus, PaymentStatus
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.user import User

_DELIVERED = Order.status == OrderStatus.delivered
_ACTIVE_LAUNDRY = and_(Laundry.deleted_at.is_(None), Laundry.status == LaundryStatus.approved)


def _commission_expr():
    return Order.total_inr * Order.commission_rate / Decimal("100")


def _order_in_range(start: datetime, end: datetime):
    return and_(Order.deleted_at.is_(None), Order.created_at >= start, Order.created_at <= end)


class RevenueAnalyticsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def platform_overview(
        self,
        start: datetime,
        end: datetime,
    ) -> dict:
        base = _order_in_range(start, end)
        row = await self._session.execute(
            select(
                func.count(Order.id),
                func.count(case((_DELIVERED, Order.id))),
                func.coalesce(func.sum(case((_DELIVERED, Order.total_inr), else_=0)), 0),
                func.coalesce(func.sum(case((_DELIVERED, _commission_expr()), else_=0)), 0),
                func.coalesce(
                    func.sum(
                        case(
                            (Order.payment_status == PaymentStatus.refunded, Order.total_inr),
                            else_=0,
                        ),
                    ),
                    0,
                ),
            ).where(base),
        )
        total_orders, delivered_orders, revenue, commission, _refunds = row.one()
        revenue = Decimal(str(revenue or 0))
        commission = Decimal(str(commission or 0))
        delivered = int(delivered_orders or 0)
        aov = (revenue / delivered).quantize(Decimal("0.01")) if delivered else Decimal("0")
        active = await self._session.scalar(
            select(func.count()).select_from(Laundry).where(_ACTIVE_LAUNDRY),
        )
        top = await self._session.execute(
            select(Laundry.name, func.coalesce(func.sum(Order.total_inr), 0))
            .join(Order, and_(Order.laundry_id == Laundry.id, base, _DELIVERED))
            .where(Laundry.deleted_at.is_(None))
            .group_by(Laundry.id, Laundry.name)
            .order_by(func.coalesce(func.sum(Order.total_inr), 0).desc())
            .limit(1),
        )
        top_row = top.first()
        return {
            "total_orders": int(total_orders or 0),
            "delivered_orders": delivered,
            "revenue": revenue,
            "commission": commission,
            "active_laundries": int(active or 0),
            "top_laundry_name": top_row[0] if top_row else None,
            "top_laundry_revenue": Decimal(str(top_row[1] or 0)) if top_row else None,
            "aov": aov,
        }

    async def laundry_aggregates(
        self,
        start: datetime,
        end: datetime,
        *,
        laundry_id: UUID | None = None,
        partner_id: UUID | None = None,
        city: str | None = None,
        status: str | None = None,
        revenue_min: Decimal | None = None,
        revenue_max: Decimal | None = None,
        cities_for_state: list[str] | None = None,
        page: int = 1,
        page_size: int = 25,
        sort_by: str = "revenue",
        sort_dir: str = "desc",
    ) -> tuple[list[dict], int]:
        base = _order_in_range(start, end)
        dispute_subq = (
            select(
                Order.laundry_id.label("laundry_id"),
                func.count(Complaint.id).label("disputes_count"),
            )
            .join(Complaint, Complaint.order_id == Order.id)
            .where(base)
            .group_by(Order.laundry_id)
            .subquery()
        )

        revenue_expr = func.coalesce(func.sum(case((_DELIVERED, Order.total_inr), else_=0)), 0)
        commission_expr = func.coalesce(func.sum(case((_DELIVERED, _commission_expr()), else_=0)), 0)
        refund_expr = func.coalesce(
            func.sum(
                case(
                    (Order.payment_status == PaymentStatus.refunded, Order.total_inr),
                    else_=0,
                ),
            ),
            0,
        )
        orders_expr = func.count(Order.id)

        stmt = (
            select(
                Laundry.id,
                Laundry.name,
                Laundry.city,
                Laundry.status,
                Laundry.avg_rating,
                Laundry.commission_rate,
                User.id.label("partner_id"),
                User.full_name.label("partner_name"),
                orders_expr.label("orders_count"),
                revenue_expr.label("revenue"),
                commission_expr.label("commission"),
                refund_expr.label("refund_amount"),
                func.coalesce(dispute_subq.c.disputes_count, 0).label("disputes_count"),
            )
            .join(User, User.id == Laundry.owner_user_id)
            .outerjoin(Order, and_(Order.laundry_id == Laundry.id, base))
            .outerjoin(dispute_subq, dispute_subq.c.laundry_id == Laundry.id)
            .where(Laundry.deleted_at.is_(None))
            .group_by(
                Laundry.id,
                Laundry.name,
                Laundry.city,
                Laundry.status,
                Laundry.avg_rating,
                Laundry.commission_rate,
                User.id,
                User.full_name,
                dispute_subq.c.disputes_count,
            )
        )

        if laundry_id:
            stmt = stmt.where(Laundry.id == laundry_id)
        if partner_id:
            stmt = stmt.where(Laundry.owner_user_id == partner_id)
        if city:
            stmt = stmt.where(Laundry.city.ilike(f"%{city}%"))
        if cities_for_state:
            stmt = stmt.where(Laundry.city.in_(cities_for_state))
        if status:
            from app.models.enums import LaundryStatus

            try:
                stmt = stmt.where(Laundry.status == LaundryStatus(status))
            except ValueError:
                pass

        having_filters = []
        if revenue_min is not None:
            having_filters.append(revenue_expr >= revenue_min)
        if revenue_max is not None:
            having_filters.append(revenue_expr <= revenue_max)
        if having_filters:
            stmt = stmt.having(and_(*having_filters))

        sort_map = {
            "revenue": revenue_expr,
            "orders": orders_expr,
            "commission": commission_expr,
            "name": Laundry.name,
            "rating": Laundry.avg_rating,
            "disputes": func.coalesce(dispute_subq.c.disputes_count, 0),
        }
        sort_col = sort_map.get(sort_by, revenue_expr)
        stmt = stmt.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int(await self._session.scalar(count_stmt) or 0)

        offset = (max(page, 1) - 1) * page_size
        result = await self._session.execute(stmt.limit(page_size).offset(offset))
        rows = []
        for r in result.all():
            revenue = Decimal(str(r.revenue or 0))
            commission = Decimal(str(r.commission or 0))
            rows.append(
                {
                    "laundry_id": r.id,
                    "laundry_name": r.name,
                    "partner_id": r.partner_id,
                    "partner_name": r.partner_name,
                    "city": r.city,
                    "status": r.status.value if hasattr(r.status, "value") else str(r.status),
                    "average_rating": Decimal(str(r.avg_rating or 0)),
                    "commission_rate": r.commission_rate,
                    "orders_count": int(r.orders_count or 0),
                    "revenue": revenue,
                    "commission": commission,
                    "net_payout": (revenue - commission).quantize(Decimal("0.01")),
                    "refund_amount": Decimal(str(r.refund_amount or 0)),
                    "disputes_count": int(r.disputes_count or 0),
                },
            )
        return rows, total

    async def laundry_revenue_for_period(
        self,
        laundry_id: UUID,
        start: datetime,
        end: datetime,
    ) -> Decimal:
        base = and_(_order_in_range(start, end), Order.laundry_id == laundry_id, _DELIVERED)
        val = await self._session.scalar(
            select(func.coalesce(func.sum(Order.total_inr), 0)).where(base),
        )
        return Decimal(str(val or 0))

    async def chart_top_laundries(
        self,
        start: datetime,
        end: datetime,
        *,
        limit: int = 10,
        metric: str = "revenue",
    ) -> list[dict]:
        base = _order_in_range(start, end)
        revenue_expr = func.coalesce(func.sum(case((_DELIVERED, Order.total_inr), else_=0)), 0)
        commission_expr = func.coalesce(func.sum(case((_DELIVERED, _commission_expr()), else_=0)), 0)
        orders_expr = func.count(Order.id)

        value_expr = revenue_expr
        if metric == "commission":
            value_expr = commission_expr
        elif metric == "orders":
            value_expr = orders_expr

        result = await self._session.execute(
            select(Laundry.name, value_expr, orders_expr)
            .join(Order, and_(Order.laundry_id == Laundry.id, base))
            .where(Laundry.deleted_at.is_(None))
            .group_by(Laundry.id, Laundry.name)
            .order_by(value_expr.desc())
            .limit(limit),
        )
        return [
            {
                "label": name,
                "value": Decimal(str(val or 0)),
                "orders": int(orders or 0),
            }
            for name, val, orders in result.all()
        ]

    async def daily_revenue_trend(
        self,
        start: datetime,
        end: datetime,
    ) -> list[dict]:
        from sqlalchemy import cast, Date

        base = and_(_order_in_range(start, end), _DELIVERED)
        result = await self._session.execute(
            select(
                cast(Order.created_at, Date).label("day"),
                func.coalesce(func.sum(Order.total_inr), 0),
                func.count(Order.id),
            )
            .where(base)
            .group_by(cast(Order.created_at, Date))
            .order_by(cast(Order.created_at, Date)),
        )
        return [
            {
                "label": str(day),
                "value": Decimal(str(rev or 0)),
                "orders": int(cnt or 0),
            }
            for day, rev, cnt in result.all()
        ]

    async def monthly_revenue_trend(
        self,
        start: datetime,
        end: datetime,
        *,
        laundry_id: UUID | None = None,
    ) -> list[dict]:
        from sqlalchemy import extract

        base = and_(_order_in_range(start, end), _DELIVERED)
        if laundry_id:
            base = and_(base, Order.laundry_id == laundry_id)

        result = await self._session.execute(
            select(
                extract("year", Order.created_at).label("yr"),
                extract("month", Order.created_at).label("mo"),
                func.coalesce(func.sum(Order.total_inr), 0),
                func.count(Order.id),
                func.coalesce(func.sum(_commission_expr()), 0),
            )
            .where(base)
            .group_by("yr", "mo")
            .order_by("yr", "mo"),
        )
        rows = []
        for yr, mo, rev, cnt, comm in result.all():
            rows.append(
                {
                    "month": f"{int(yr):04d}-{int(mo):02d}",
                    "revenue": Decimal(str(rev or 0)),
                    "orders": int(cnt or 0),
                    "commission": Decimal(str(comm or 0)),
                },
            )
        return rows

    async def commission_block(
        self,
        start: datetime,
        end: datetime,
        *,
        laundry_id: UUID | None = None,
    ) -> dict:
        base = and_(_order_in_range(start, end), _DELIVERED)
        if laundry_id:
            base = and_(base, Order.laundry_id == laundry_id)

        row = await self._session.execute(
            select(
                func.coalesce(func.sum(Order.total_inr), 0),
                func.coalesce(func.sum(_commission_expr()), 0),
                func.coalesce(func.avg(Order.commission_rate), 0),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                and_(
                                    _DELIVERED,
                                    Order.payment_status.in_(
                                        (PaymentStatus.pending_cod, PaymentStatus.pending),
                                    ),
                                ),
                                Order.total_inr - _commission_expr(),
                            ),
                            else_=0,
                        ),
                    ),
                    0,
                ),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                and_(_DELIVERED, Order.payment_status == PaymentStatus.paid),
                                Order.total_inr - _commission_expr(),
                            ),
                            else_=0,
                        ),
                    ),
                    0,
                ),
            ).where(base),
        )
        revenue, commission, avg_rate, pending, completed = row.one()
        revenue = Decimal(str(revenue or 0))
        commission = Decimal(str(commission or 0))
        return {
            "revenue": revenue,
            "commission": commission,
            "avg_rate": Decimal(str(avg_rate or 0)),
            "net_earnings": (revenue - commission).quantize(Decimal("0.01")),
            "pending_settlements": Decimal(str(pending or 0)).quantize(Decimal("0.01")),
            "completed_settlements": Decimal(str(completed or 0)).quantize(Decimal("0.01")),
        }

    async def refund_block(
        self,
        start: datetime,
        end: datetime,
        *,
        laundry_id: UUID | None = None,
    ) -> dict:
        base = _order_in_range(start, end)
        if laundry_id:
            base = and_(base, Order.laundry_id == laundry_id)

        total_orders = await self._session.scalar(select(func.count(Order.id)).where(base))
        refund_filter = and_(base, Order.payment_status == PaymentStatus.refunded)
        refund_row = await self._session.execute(
            select(
                func.count(Order.id),
                func.coalesce(func.sum(Order.total_inr), 0),
            ).where(refund_filter),
        )
        refund_count, refund_amount = refund_row.one()
        refund_count = int(refund_count or 0)
        refund_amount = Decimal(str(refund_amount or 0))
        total_orders = int(total_orders or 0)
        pct = (
            (Decimal(refund_count) / Decimal(total_orders) * Decimal("100")).quantize(Decimal("0.01"))
            if total_orders
            else Decimal("0")
        )

        reason_rows = await self._session.execute(
            select(
                Complaint.complaint_type,
                func.count(Complaint.id),
                func.coalesce(func.sum(Order.total_inr), 0),
            )
            .join(Order, Order.id == Complaint.order_id)
            .where(
                refund_filter,
                Complaint.complaint_type.isnot(None),
            )
            .group_by(Complaint.complaint_type)
            .order_by(func.count(Complaint.id).desc())
            .limit(8),
        )
        by_reason = [
            {
                "reason": t.value if hasattr(t, "value") else str(t),
                "count": int(c or 0),
                "amount": Decimal(str(a or 0)),
            }
            for t, c, a in reason_rows.all()
        ]

        by_laundry_rows = await self._session.execute(
            select(Laundry.name, func.coalesce(func.sum(Order.total_inr), 0), func.count(Order.id))
            .join(Laundry, Laundry.id == Order.laundry_id)
            .where(refund_filter)
            .group_by(Laundry.id, Laundry.name)
            .order_by(func.coalesce(func.sum(Order.total_inr), 0).desc())
            .limit(10),
        )
        by_laundry = [
            {
                "label": name,
                "value": Decimal(str(val or 0)),
                "orders": int(cnt or 0),
            }
            for name, val, cnt in by_laundry_rows.all()
        ]

        return {
            "refund_amount": refund_amount,
            "refund_count": refund_count,
            "refund_pct": pct,
            "by_reason": by_reason,
            "by_laundry": by_laundry,
        }

    async def dispute_block(
        self,
        start: datetime,
        end: datetime,
        *,
        laundry_id: UUID | None = None,
    ) -> dict:
        base = _order_in_range(start, end)
        join_cond = Complaint.order_id == Order.id
        if laundry_id:
            base = and_(base, Order.laundry_id == laundry_id)

        open_statuses = (ComplaintStatus.open, ComplaintStatus.investigating, ComplaintStatus.escalated)
        resolved_statuses = (ComplaintStatus.resolved, ComplaintStatus.rejected)

        open_count = await self._session.scalar(
            select(func.count(Complaint.id))
            .join(Order, join_cond)
            .where(base, Complaint.status.in_(open_statuses)),
        )
        resolved_count = await self._session.scalar(
            select(func.count(Complaint.id))
            .join(Order, join_cond)
            .where(base, Complaint.status.in_(resolved_statuses)),
        )
        total_orders = await self._session.scalar(select(func.count(Order.id)).where(base))
        total_disputes = int(open_count or 0) + int(resolved_count or 0)
        total_orders = int(total_orders or 0)
        rate = (
            (Decimal(total_disputes) / Decimal(total_orders) * Decimal("100")).quantize(Decimal("0.01"))
            if total_orders
            else Decimal("0")
        )

        issue_rows = await self._session.execute(
            select(Complaint.complaint_type, func.count(Complaint.id))
            .join(Order, join_cond)
            .where(base)
            .group_by(Complaint.complaint_type)
            .order_by(func.count(Complaint.id).desc())
            .limit(8),
        )
        common = [
            {
                "label": t.value if hasattr(t, "value") else str(t),
                "value": Decimal(str(c or 0)),
                "orders": int(c or 0),
            }
            for t, c in issue_rows.all()
        ]

        return {
            "open_disputes": int(open_count or 0),
            "resolved_disputes": int(resolved_count or 0),
            "dispute_rate_pct": rate,
            "common_issues": common,
        }

    async def partner_branches(
        self,
        partner_id: UUID,
        start: datetime,
        end: datetime,
    ) -> list[dict]:
        rows, _ = await self.laundry_aggregates(
            start,
            end,
            partner_id=partner_id,
            page=1,
            page_size=100,
            sort_by="revenue",
        )
        return rows

    async def get_laundry_meta(self, laundry_id: UUID) -> dict | None:
        row = await self._session.execute(
            select(Laundry, User.full_name, User.id)
            .join(User, User.id == Laundry.owner_user_id)
            .where(Laundry.id == laundry_id, Laundry.deleted_at.is_(None)),
        )
        item = row.first()
        if not item:
            return None
        laundry, partner_name, partner_id = item
        return {
            "laundry_id": laundry.id,
            "laundry_name": laundry.name,
            "partner_id": partner_id,
            "partner_name": partner_name,
            "city": laundry.city,
            "status": laundry.status.value,
            "average_rating": Decimal(str(laundry.avg_rating or 0)),
            "commission_rate": laundry.commission_rate,
        }

    async def count_partner_laundries(self, partner_id: UUID) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(Laundry)
                .where(Laundry.owner_user_id == partner_id, Laundry.deleted_at.is_(None)),
            )
            or 0,
        )
