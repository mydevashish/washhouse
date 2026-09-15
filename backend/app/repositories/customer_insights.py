"""Partner customer insights persistence."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.enums import FraudRiskLevel, OrderStatus, UserRole
from app.models.laundry import Laundry
from app.models.laundry_customer import LaundryCustomer
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

    async def customer_aggregates(
        self,
        laundry_id: UUID,
        *,
        search: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[dict]:
        dispute_subq = (
            select(
                Order.laundry_customer_id.label("customer_id"),
                func.count(Complaint.id).label("dispute_count"),
            )
            .join(Complaint, Complaint.order_id == Order.id)
            .where(
                Order.laundry_id == laundry_id,
                Order.deleted_at.is_(None),
                Order.laundry_customer_id.is_not(None),
            )
            .group_by(Order.laundry_customer_id)
            .subquery()
        )
        stmt = (
            select(
                LaundryCustomer.id.label("customer_id"),
                LaundryCustomer.user_id,
                LaundryCustomer.full_name,
                LaundryCustomer.phone,
                LaundryCustomer.title,
                LaundryCustomer.plan_name,
                LaundryCustomer.address_line1,
                LaundryCustomer.address_line2,
                LaundryCustomer.city,
                LaundryCustomer.state,
                LaundryCustomer.pincode,
                User.trust_score,
                User.fraud_risk_level,
                func.count(Order.id).label("order_count"),
                func.coalesce(func.sum(Order.total_inr), 0).label("total_spent"),
                func.max(Order.created_at).label("last_order_at"),
                func.min(Order.created_at).label("first_order_at"),
                func.coalesce(dispute_subq.c.dispute_count, 0).label("dispute_count"),
            )
            .outerjoin(User, User.id == LaundryCustomer.user_id)
            .outerjoin(
                Order,
                and_(
                    Order.laundry_customer_id == LaundryCustomer.id,
                    Order.deleted_at.is_(None),
                    Order.status != OrderStatus.cancelled,
                ),
            )
            .outerjoin(dispute_subq, dispute_subq.c.customer_id == LaundryCustomer.id)
            .where(
                LaundryCustomer.laundry_id == laundry_id,
                LaundryCustomer.deleted_at.is_(None),
            )
            .group_by(
                LaundryCustomer.id,
                LaundryCustomer.user_id,
                LaundryCustomer.full_name,
                LaundryCustomer.phone,
                LaundryCustomer.title,
                LaundryCustomer.plan_name,
                LaundryCustomer.address_line1,
                LaundryCustomer.address_line2,
                LaundryCustomer.city,
                LaundryCustomer.state,
                LaundryCustomer.pincode,
                User.trust_score,
                User.fraud_risk_level,
                dispute_subq.c.dispute_count,
            )
            .order_by(func.coalesce(func.sum(Order.total_inr), 0).desc())
        )
        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(LaundryCustomer.full_name.ilike(term) | LaundryCustomer.phone.ilike(term))
        if limit is not None:
            stmt = stmt.offset(max(0, offset)).limit(limit)
        rows = await self._session.execute(stmt)
        result: list[dict] = []
        for row in rows.all():
            total = Decimal(str(row.total_spent or 0)).quantize(Decimal("0.01"))
            risk = row.fraud_risk_level
            result.append(
                {
                    "customer_id": row.customer_id,
                    "user_id": row.user_id,
                    "name": row.full_name,
                    "phone": row.phone,
                    "title": row.title,
                    "plan_name": row.plan_name,
                    "address_line1": row.address_line1,
                    "address_line2": row.address_line2,
                    "city": row.city,
                    "state": row.state,
                    "pincode": row.pincode,
                    "trust_score": int(row.trust_score or 70),
                    "fraud_risk_level": (
                        risk.value if hasattr(risk, "value") else str(risk or FraudRiskLevel.low.value)
                    ),
                    "order_count": int(row.order_count),
                    "total_spent_inr": total,
                    "last_order_at": row.last_order_at,
                    "first_order_at": row.first_order_at,
                    "dispute_count": int(row.dispute_count or 0),
                },
            )
        return result

    async def count_customer_aggregates(self, laundry_id: UUID, *, search: str | None = None) -> int:
        """Distinct customers with non-cancelled orders (matches customer_aggregates filters)."""
        stmt = (
            select(func.count()).select_from(LaundryCustomer).where(
                LaundryCustomer.laundry_id == laundry_id,
                LaundryCustomer.deleted_at.is_(None),
            )
        )
        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(LaundryCustomer.full_name.ilike(term) | LaundryCustomer.phone.ilike(term))
        return int(await self._session.scalar(stmt) or 0)

    async def count_laundry_orders(
        self,
        laundry_id: UUID,
        *,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
    ) -> int:
        """All orders for laundry (matches partner list_orders bucket=all — includes cancelled)."""
        stmt = select(func.count()).select_from(Order).where(
            Order.laundry_id == laundry_id,
            Order.deleted_at.is_(None),
        )
        if created_from is not None:
            stmt = stmt.where(Order.created_at >= created_from)
        if created_to is not None:
            stmt = stmt.where(Order.created_at < created_to)
        return int(await self._session.scalar(stmt) or 0)
