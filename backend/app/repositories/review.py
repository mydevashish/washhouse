"""Review persistence."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ReviewStatus
from app.models.review import Review


class ReviewRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, review: Review) -> Review:
        self._session.add(review)
        await self._session.flush()
        return review

    async def get_by_order(self, order_id: UUID) -> Review | None:
        result = await self._session.execute(
            select(Review).where(Review.order_id == order_id),
        )
        return result.scalar_one_or_none()

    async def list_by_laundry(
        self,
        laundry_id: UUID,
        *,
        limit: int = 20,
        offset: int = 0,
    ) -> list[Review]:
        result = await self._session.execute(
            select(Review)
            .where(Review.laundry_id == laundry_id, Review.status == ReviewStatus.published)
            .order_by(Review.created_at.desc())
            .limit(limit)
            .offset(offset),
        )
        return list(result.scalars().all())

    async def avg_rating(self, laundry_id: UUID) -> tuple[float, int]:
        result = await self._session.execute(
            select(func.avg(Review.rating), func.count())
            .where(Review.laundry_id == laundry_id, Review.status == ReviewStatus.published),
        )
        row = result.one()
        avg = float(row[0] or 0)
        count = int(row[1] or 0)
        return avg, count
