"""Laundry trust score metrics and persistence."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.enums import ComplaintStatus, OrderStatus, PaymentStatus, ReviewStatus, UserRole
from app.models.laundry import Laundry
from app.models.order import Order, OrderStatusEvent
from app.models.review import Review
from app.models.user import User


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
            select(Laundry)
            .where(Laundry.owner_user_id == owner_user_id, Laundry.deleted_at.is_(None))
            .order_by(Laundry.created_at.asc())
            .limit(1),
        )
        return result.scalars().first()

    async def list_laundries_with_owners(
        self,
        *,
        limit: int = 200,
        offset: int = 0,
        search: str | None = None,
    ) -> list[tuple[Laundry, str | None]]:
        q = (
            select(Laundry, User.full_name)
            .outerjoin(User, User.id == Laundry.owner_user_id)
            .where(Laundry.deleted_at.is_(None))
        )
        if search and search.strip():
            term = f"%{search.strip()}%"
            q = q.where(
                Laundry.name.ilike(term)
                | Laundry.city.ilike(term)
            )
        result = await self._session.execute(
            q.order_by(Laundry.trust_score.asc(), Laundry.name.asc())
            .limit(limit)
            .offset(offset),
        )
        return list(result.all())

    async def list_laundries(
        self,
        *,
        limit: int = 200,
        offset: int = 0,
        search: str | None = None,
    ) -> list[Laundry]:
        rows = await self.list_laundries_with_owners(limit=limit, offset=offset, search=search)
        return [laundry for laundry, _ in rows]

    async def count_laundries(self, *, search: str | None = None) -> int:
        q = select(func.count()).select_from(Laundry).where(Laundry.deleted_at.is_(None))
        if search and search.strip():
            term = f"%{search.strip()}%"
            q = q.where(
                Laundry.name.ilike(term)
                | Laundry.city.ilike(term)
            )
        return int(await self._session.scalar(q) or 0)

    async def list_summary_metrics(self, laundry_ids: list[UUID]) -> dict[UUID, tuple[int, float, int]]:
        """Return laundry_id -> (completed_orders, avg_rating, review_count) in two queries."""
        if not laundry_ids:
            return {}
        completed_rows = await self._session.execute(
            select(Order.laundry_id, func.count())
            .where(
                Order.laundry_id.in_(laundry_ids),
                Order.status == OrderStatus.delivered,
                Order.deleted_at.is_(None),
            )
            .group_by(Order.laundry_id),
        )
        completed_map = {row[0]: int(row[1]) for row in completed_rows.all()}
        rating_rows = await self._session.execute(
            select(Review.laundry_id, func.avg(Review.rating), func.count())
            .where(
                Review.laundry_id.in_(laundry_ids),
                Review.status == ReviewStatus.published,
            )
            .group_by(Review.laundry_id),
        )
        rating_map = {
            row[0]: (float(row[1] or 0), int(row[2] or 0))
            for row in rating_rows.all()
        }
        out: dict[UUID, tuple[int, float, int]] = {}
        for lid in laundry_ids:
            avg, count = rating_map.get(lid, (0.0, 0))
            out[lid] = (completed_map.get(lid, 0), round(avg, 1), count)
        return out

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
