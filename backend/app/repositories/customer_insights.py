"""Partner customer insights persistence."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.enums import FraudRiskLevel, OrderStatus, UserRole
from app.models.laundry import Laundry
from app.models.order import Order
from app.models.user import User


class CustomerInsightsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_laundry_for_owner(self, owner_user_id: UUID) -> Laundry | None:
        return await self._session.scalar(
            select(Laundry).where(Laundry.owner_user_id == owner_user_id, Laundry.deleted_at.is_(None)),
        )

    async def get_laundry(self, laundry_id: UUID) -> Laundry | None:
        return await self._session.get(Laundry, laundry_id)

    async def customer_aggregates(self, laundry_id: UUID) -> list[dict]:
        dispute_subq = (
            select(
                Order.user_id.label("user_id"),
                func.count(Complaint.id).label("dispute_count"),
            )
            .join(Complaint, Complaint.order_id == Order.id)
            .where(Order.laundry_id == laundry_id, Order.deleted_at.is_(None))
            .group_by(Order.user_id)
            .subquery()
        )
        stmt = (
            select(
                Order.user_id,
                User.full_name,
                User.trust_score,
                User.fraud_risk_level,
                func.count(Order.id).label("order_count"),
                func.coalesce(func.sum(Order.total_inr), 0).label("total_spent"),
                func.max(Order.created_at).label("last_order_at"),
                func.min(Order.created_at).label("first_order_at"),
                func.coalesce(dispute_subq.c.dispute_count, 0).label("dispute_count"),
            )
            .join(User, User.id == Order.user_id)
            .outerjoin(dispute_subq, dispute_subq.c.user_id == Order.user_id)
            .where(
                Order.laundry_id == laundry_id,
                Order.deleted_at.is_(None),
                Order.status != OrderStatus.cancelled,
                User.deleted_at.is_(None),
                User.role == UserRole.customer,
            )
            .group_by(
                Order.user_id,
                User.full_name,
                User.trust_score,
                User.fraud_risk_level,
                dispute_subq.c.dispute_count,
            )
            .order_by(func.coalesce(func.sum(Order.total_inr), 0).desc())
        )
        rows = await self._session.execute(stmt)
        result: list[dict] = []
        for row in rows.all():
            total = Decimal(str(row.total_spent or 0)).quantize(Decimal("0.01"))
            risk = row.fraud_risk_level
            result.append(
                {
                    "user_id": row.user_id,
                    "name": row.full_name,
                    "trust_score": int(row.trust_score),
                    "fraud_risk_level": risk.value if hasattr(risk, "value") else str(risk),
                    "order_count": int(row.order_count),
                    "total_spent_inr": total,
                    "last_order_at": row.last_order_at,
                    "first_order_at": row.first_order_at,
                    "dispute_count": int(row.dispute_count or 0),
                },
            )
        return result
