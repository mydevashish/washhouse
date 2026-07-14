"""Marketing site persistence."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import LaundryStatus, OrderStatus, ReviewStatus, UserRole
from app.models.laundry import Laundry
from app.models.marketing import (
    MARKETING_STATS_SINGLETON_KEY,
    MarketingContactSubmission,
    MarketingFranchiseInquiry,
    MarketingSiteStats,
    MarketingTestimonial,
)
from app.models.order import Order, OrderItem
from app.models.review import Review
from app.models.user import User


class MarketingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save_contact(self, row: MarketingContactSubmission) -> MarketingContactSubmission:
        self._session.add(row)
        await self._session.flush()
        return row

    async def save_franchise_inquiry(self, row: MarketingFranchiseInquiry) -> MarketingFranchiseInquiry:
        self._session.add(row)
        await self._session.flush()
        return row

    async def count_recent_contact_by_ip(self, client_ip: str, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(MarketingContactSubmission)
            .where(
                MarketingContactSubmission.client_ip == client_ip,
                MarketingContactSubmission.created_at >= since,
            ),
        )
        return int(result.scalar_one())

    async def count_recent_contact_by_phone(self, phone: str, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(MarketingContactSubmission)
            .where(
                MarketingContactSubmission.phone == phone,
                MarketingContactSubmission.created_at >= since,
            ),
        )
        return int(result.scalar_one())

    async def count_recent_franchise_by_ip(self, client_ip: str, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(MarketingFranchiseInquiry)
            .where(
                MarketingFranchiseInquiry.client_ip == client_ip,
                MarketingFranchiseInquiry.created_at >= since,
            ),
        )
        return int(result.scalar_one())

    async def get_site_stats(self) -> MarketingSiteStats:
        result = await self._session.execute(
            select(MarketingSiteStats).where(
                MarketingSiteStats.singleton_key == MARKETING_STATS_SINGLETON_KEY,
            ),
        )
        row = result.scalar_one_or_none()
        if row is not None:
            return row

        row = MarketingSiteStats(singleton_key=MARKETING_STATS_SINGLETON_KEY)
        self._session.add(row)
        await self._session.flush()
        return row

    async def count_customers(self) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(User)
            .where(
                User.role == UserRole.customer,
                User.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def count_approved_laundries(self) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Laundry)
            .where(
                Laundry.status == LaundryStatus.approved,
                Laundry.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def count_distinct_cities(self) -> int:
        result = await self._session.execute(
            select(func.count(func.distinct(Laundry.city)))
            .select_from(Laundry)
            .where(
                Laundry.status == LaundryStatus.approved,
                Laundry.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def sum_garments_cleaned(self) -> int:
        result = await self._session.execute(
            select(func.coalesce(func.sum(OrderItem.quantity), 0))
            .select_from(OrderItem)
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                Order.deleted_at.is_(None),
                Order.status != OrderStatus.cancelled,
            ),
        )
        return int(result.scalar_one())

    async def avg_published_review_rating(self) -> float | None:
        result = await self._session.execute(
            select(func.avg(Review.rating))
            .select_from(Review)
            .where(Review.status == ReviewStatus.published),
        )
        value = result.scalar_one()
        return float(value) if value is not None else None

    async def list_featured_testimonials(self, *, limit: int) -> list[MarketingTestimonial]:
        result = await self._session.execute(
            select(MarketingTestimonial)
            .where(
                MarketingTestimonial.is_active.is_(True),
                MarketingTestimonial.is_featured.is_(True),
            )
            .order_by(MarketingTestimonial.sort_order.asc(), MarketingTestimonial.created_at.desc())
            .limit(limit),
        )
        return list(result.scalars().all())

    async def touch_site_stats_aggregated_at(self, stats: MarketingSiteStats, at: datetime) -> None:
        stats.last_aggregated_at = at
        await self._session.flush()
