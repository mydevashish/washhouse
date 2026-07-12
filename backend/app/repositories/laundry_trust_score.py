"""Laundry trust score metrics and persistence."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.enums import ComplaintStatus, OrderStatus, PaymentStatus, UserRole
from app.models.laundry import Laundry
from app.models.order import Order, OrderStatusEvent


class LaundryTrustScoreRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_laundry(self, laundry_id: UUID) -> Laundry | None:
        result = await self._session.execute(
            select(Laundry).where(Laundry.id == laundry_id, Laundry.deleted_at.is_(None)),
        )
        return result.scalar_one_or_none()

    async def get_laundry_by_owner(self, owner_user_id: UUID) -> Laundry | None:
        result = await self._session.execute(
            select(Laundry).where(Laundry.owner_user_id == owner_user_id, Laundry.deleted_at.is_(None)),
        )
        return result.scalar_one_or_none()

    async def list_laundries(self, *, limit: int = 200) -> list[Laundry]:
        result = await self._session.execute(
            select(Laundry)
            .where(Laundry.deleted_at.is_(None))
            .order_by(Laundry.trust_score.asc(), Laundry.name.asc())
            .limit(limit),
        )
        return list(result.scalars().all())

    async def count_completed_orders(self, laundry_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry_id,
                Order.status == OrderStatus.delivered,
                Order.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def count_on_time_deliveries(self, laundry_id: UUID) -> int:
        """Delivered orders where actual delivery event is on or before scheduled delivery_at."""
        delivered_subq = (
            select(OrderStatusEvent.order_id, func.min(OrderStatusEvent.created_at).label("delivered_at"))
            .where(OrderStatusEvent.status == OrderStatus.delivered)
            .group_by(OrderStatusEvent.order_id)
            .subquery()
        )
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .join(delivered_subq, Order.id == delivered_subq.c.order_id)
            .where(
                Order.laundry_id == laundry_id,
                Order.status == OrderStatus.delivered,
                Order.deleted_at.is_(None),
                delivered_subq.c.delivered_at <= Order.delivery_at,
            ),
        )
        return int(result.scalar_one())

    async def count_complaints(self, laundry_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Complaint)
            .join(Order, Complaint.order_id == Order.id)
            .where(Order.laundry_id == laundry_id),
        )
        return int(result.scalar_one())

    async def count_active_disputes(self, laundry_id: UUID) -> int:
        active = {ComplaintStatus.open, ComplaintStatus.investigating, ComplaintStatus.escalated}
        result = await self._session.execute(
            select(func.count())
            .select_from(Complaint)
            .join(Order, Complaint.order_id == Order.id)
            .where(Order.laundry_id == laundry_id, Complaint.status.in_(active)),
        )
        return int(result.scalar_one())

    async def count_refunded_orders(self, laundry_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.laundry_id == laundry_id,
                Order.status == OrderStatus.delivered,
                Order.payment_status == PaymentStatus.refunded,
                Order.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())
