"""Dispute analytics aggregations."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.enums import ComplaintStatus, FraudRiskLevel, OrderStatus, PaymentStatus, UserRole
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.user import User
from app.schemas.complaint import DISPUTE_TYPE_LABELS
from app.services.revenue_analytics_service import CITY_STATE_MAP

_OPEN = (
    ComplaintStatus.open,
    ComplaintStatus.investigating,
    ComplaintStatus.awaiting_customer,
    ComplaintStatus.awaiting_partner,
    ComplaintStatus.escalated,
)
_RESOLVED = (ComplaintStatus.resolved, ComplaintStatus.rejected, ComplaintStatus.closed)
_HIGH_RISK = (FraudRiskLevel.high, FraudRiskLevel.critical)

_RISK_LABELS = {
    FraudRiskLevel.low: "Low Risk",
    FraudRiskLevel.medium: "Medium Risk",
    FraudRiskLevel.high: "High Risk",
    FraudRiskLevel.critical: "Critical Risk",
}


def _complaint_in_range(start: datetime, end: datetime):
    return and_(Complaint.created_at >= start, Complaint.created_at <= end)


def _order_in_range(start: datetime, end: datetime):
    return and_(Order.deleted_at.is_(None), Order.created_at >= start, Order.created_at <= end)


class DisputeAnalyticsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def overview(self, start: datetime, end: datetime) -> dict:
        open_count = await self._session.scalar(
            select(func.count()).select_from(Complaint).where(Complaint.status.in_(_OPEN)),
        )
        resolved_period = await self._session.scalar(
            select(func.count())
            .select_from(Complaint)
            .where(
                Complaint.status.in_(_RESOLVED),
                Complaint.resolved_at.isnot(None),
                Complaint.resolved_at >= start,
                Complaint.resolved_at <= end,
            ),
        )
        disputes_period = await self._session.scalar(
            select(func.count()).select_from(Complaint).where(_complaint_in_range(start, end)),
        )
        orders_period = await self._session.scalar(
            select(func.count()).select_from(Order).where(_order_in_range(start, end)),
        )
        avg_hours = await self._session.scalar(
            select(
                func.avg(
                    func.extract("epoch", Complaint.resolved_at - Complaint.created_at) / 3600.0,
                ),
            )
            .select_from(Complaint)
            .where(
                Complaint.resolved_at.isnot(None),
                Complaint.resolved_at >= start,
                Complaint.resolved_at <= end,
            ),
        )
        refund_sum = await self._session.scalar(
            select(func.coalesce(func.sum(Order.total_inr), 0))
            .select_from(Complaint)
            .join(Order, Order.id == Complaint.order_id)
            .where(
                _complaint_in_range(start, end),
                Order.payment_status == PaymentStatus.refunded,
            ),
        )
        rate = (
            (Decimal(str(disputes_period or 0)) / Decimal(str(orders_period or 1)) * Decimal("100"))
            if orders_period
            else Decimal("0")
        )
        return {
            "open_disputes": int(open_count or 0),
            "resolved_disputes": int(resolved_period or 0),
            "avg_resolution_hours": str(round(float(avg_hours or 0), 1)),
            "dispute_rate_pct": str(rate.quantize(Decimal("0.01"))),
            "refund_amount_inr": str(Decimal(str(refund_sum or 0)).quantize(Decimal("0.01"))),
            "total_disputes_period": int(disputes_period or 0),
            "total_orders_period": int(orders_period or 0),
        }

    async def top_dispute_types(self, start: datetime, end: datetime, *, limit: int = 8) -> list[dict]:
        total = int(
            await self._session.scalar(
                select(func.count()).select_from(Complaint).where(_complaint_in_range(start, end)),
            )
            or 0,
        )
        rows = await self._session.execute(
            select(Complaint.complaint_type, func.count())
            .where(_complaint_in_range(start, end))
            .group_by(Complaint.complaint_type)
            .order_by(func.count().desc())
            .limit(limit),
        )
        result = []
        for ctype, count in rows.all():
            cval = ctype.value if hasattr(ctype, "value") else str(ctype)
            pct = (int(count) / total * 100) if total else 0
            result.append(
                {
                    "complaint_type": cval,
                    "type_label": DISPUTE_TYPE_LABELS.get(cval, cval),
                    "count": int(count),
                    "pct": f"{pct:.1f}%",
                },
            )
        return result

    async def high_risk_customers(self, start: datetime, end: datetime, *, limit: int = 10) -> list[dict]:
        dispute_subq = (
            select(Complaint.user_id.label("user_id"), func.count().label("dispute_count"))
            .where(_complaint_in_range(start, end))
            .group_by(Complaint.user_id)
            .subquery()
        )
        refund_subq = (
            select(Order.user_id.label("user_id"), func.count().label("refunded"))
            .where(Order.payment_status == PaymentStatus.refunded, Order.deleted_at.is_(None))
            .group_by(Order.user_id)
            .subquery()
        )
        completed_subq = (
            select(Order.user_id.label("user_id"), func.count().label("completed"))
            .where(Order.status == OrderStatus.delivered, Order.deleted_at.is_(None))
            .group_by(Order.user_id)
            .subquery()
        )
        stmt = (
            select(
                User.id,
                User.full_name,
                User.email,
                User.fraud_risk_level,
                User.trust_score,
                func.coalesce(dispute_subq.c.dispute_count, 0),
                func.coalesce(refund_subq.c.refunded, 0),
                func.coalesce(completed_subq.c.completed, 0),
            )
            .outerjoin(dispute_subq, dispute_subq.c.user_id == User.id)
            .outerjoin(refund_subq, refund_subq.c.user_id == User.id)
            .outerjoin(completed_subq, completed_subq.c.user_id == User.id)
            .where(
                User.deleted_at.is_(None),
                User.role == UserRole.customer,
            )
            .order_by(
                case((User.fraud_risk_level.in_(_HIGH_RISK), 0), else_=1),
                func.coalesce(dispute_subq.c.dispute_count, 0).desc(),
                User.trust_score.asc(),
            )
            .limit(limit)
        )
        rows = await self._session.execute(stmt)
        result = []
        for uid, name, email, risk, trust, disputes, refunded, completed in rows.all():
            rate = (int(refunded) / int(completed) * 100) if completed else 0
            rl = risk.value if hasattr(risk, "value") else str(risk)
            result.append(
                {
                    "user_id": uid,
                    "full_name": name,
                    "email": email,
                    "risk_level": rl,
                    "risk_label": _RISK_LABELS.get(risk, rl),
                    "trust_score": int(trust),
                    "dispute_count": int(disputes),
                    "refund_rate_pct": f"{rate:.1f}%",
                },
            )
        return result

    async def high_risk_laundries(self, start: datetime, end: datetime, *, limit: int = 10) -> list[dict]:
        complaint_subq = (
            select(Order.laundry_id.label("laundry_id"), func.count().label("complaint_count"))
            .join(Complaint, Complaint.order_id == Order.id)
            .where(_complaint_in_range(start, end))
            .group_by(Order.laundry_id)
            .subquery()
        )
        completed_subq = (
            select(Order.laundry_id.label("laundry_id"), func.count().label("completed"))
            .where(
                Order.status == OrderStatus.delivered,
                Order.deleted_at.is_(None),
                Order.updated_at >= start,
                Order.updated_at <= end,
            )
            .group_by(Order.laundry_id)
            .subquery()
        )
        stmt = (
            select(
                Laundry.id,
                Laundry.name,
                Laundry.city,
                Laundry.fraud_risk_level,
                Laundry.trust_score,
                func.coalesce(complaint_subq.c.complaint_count, 0),
                func.coalesce(completed_subq.c.completed, 0),
            )
            .outerjoin(complaint_subq, complaint_subq.c.laundry_id == Laundry.id)
            .outerjoin(completed_subq, completed_subq.c.laundry_id == Laundry.id)
            .where(Laundry.deleted_at.is_(None))
            .order_by(
                case((Laundry.fraud_risk_level.in_(_HIGH_RISK), 0), else_=1),
                func.coalesce(complaint_subq.c.complaint_count, 0).desc(),
                Laundry.trust_score.asc(),
            )
            .limit(limit)
        )
        rows = await self._session.execute(stmt)
        result = []
        for lid, name, city, risk, trust, complaints, completed in rows.all():
            rate = (int(complaints) / int(completed) * 100) if completed else 0
            rl = risk.value if hasattr(risk, "value") else str(risk)
            state = CITY_STATE_MAP.get(city, city)
            result.append(
                {
                    "laundry_id": lid,
                    "laundry_name": name,
                    "city": city,
                    "state": state,
                    "risk_level": rl,
                    "risk_label": _RISK_LABELS.get(risk, rl),
                    "trust_score": int(trust),
                    "complaint_count": int(complaints),
                    "complaint_rate_pct": f"{rate:.1f}%",
                },
            )
        return result

    async def chart_by_laundry(self, start: datetime, end: datetime, *, limit: int = 10) -> list[dict]:
        rows = await self._session.execute(
            select(Laundry.name, func.count())
            .join(Order, Order.laundry_id == Laundry.id)
            .join(Complaint, Complaint.order_id == Order.id)
            .where(_complaint_in_range(start, end))
            .group_by(Laundry.id, Laundry.name)
            .order_by(func.count().desc())
            .limit(limit),
        )
        return [{"label": name, "value": str(count), "orders": int(count)} for name, count in rows.all()]

    async def chart_by_customer(self, start: datetime, end: datetime, *, limit: int = 10) -> list[dict]:
        rows = await self._session.execute(
            select(User.full_name, func.count())
            .join(Complaint, Complaint.user_id == User.id)
            .where(_complaint_in_range(start, end))
            .group_by(User.id, User.full_name)
            .order_by(func.count().desc())
            .limit(limit),
        )
        return [{"label": name, "value": str(count), "orders": int(count)} for name, count in rows.all()]

    async def chart_by_type(self, start: datetime, end: datetime) -> list[dict]:
        rows = await self._session.execute(
            select(Complaint.complaint_type, func.count())
            .where(_complaint_in_range(start, end))
            .group_by(Complaint.complaint_type)
            .order_by(func.count().desc()),
        )
        return [
            {
                "label": DISPUTE_TYPE_LABELS.get(
                    t.value if hasattr(t, "value") else str(t),
                    t.value if hasattr(t, "value") else str(t),
                ),
                "value": str(count),
                "orders": int(count),
            }
            for t, count in rows.all()
        ]

    async def chart_by_region(self, start: datetime, end: datetime, *, limit: int = 10) -> list[dict]:
        rows = await self._session.execute(
            select(Laundry.city, func.count())
            .join(Order, Order.laundry_id == Laundry.id)
            .join(Complaint, Complaint.order_id == Order.id)
            .where(_complaint_in_range(start, end))
            .group_by(Laundry.city)
            .order_by(func.count().desc())
            .limit(limit),
        )
        return [
            {
                "label": CITY_STATE_MAP.get(city, city),
                "value": str(count),
                "orders": int(count),
            }
            for city, count in rows.all()
        ]

    async def monthly_trend(self, start: datetime, end: datetime) -> list[dict]:
        month_expr = func.date_trunc("month", Complaint.created_at)
        created = await self._session.execute(
            select(month_expr.label("m"), func.count())
            .where(_complaint_in_range(start, end))
            .group_by(month_expr)
            .order_by(month_expr),
        )
        created_map = {row[0]: int(row[1]) for row in created.all()}

        resolved_expr = func.date_trunc("month", Complaint.resolved_at)
        resolved = await self._session.execute(
            select(resolved_expr.label("m"), func.count())
            .where(
                Complaint.resolved_at.isnot(None),
                Complaint.resolved_at >= start,
                Complaint.resolved_at <= end,
            )
            .group_by(resolved_expr)
            .order_by(resolved_expr),
        )
        resolved_map = {row[0]: int(row[1]) for row in resolved.all()}

        refund_rows = await self._session.execute(
            select(
                month_expr.label("m"),
                func.coalesce(func.sum(Order.total_inr), 0),
            )
            .select_from(Complaint)
            .join(Order, Order.id == Complaint.order_id)
            .where(
                _complaint_in_range(start, end),
                Order.payment_status == PaymentStatus.refunded,
            )
            .group_by(month_expr)
            .order_by(month_expr),
        )
        refund_map = {row[0]: Decimal(str(row[1] or 0)) for row in refund_rows.all()}

        months = sorted(set(created_map) | set(resolved_map) | set(refund_map))
        result = []
        for m in months:
            if m is None:
                continue
            result.append(
                {
                    "month": m.strftime("%b %Y"),
                    "disputes": created_map.get(m, 0),
                    "resolved": resolved_map.get(m, 0),
                    "refund_amount_inr": str(refund_map.get(m, Decimal("0")).quantize(Decimal("0.01"))),
                },
            )
        return result
