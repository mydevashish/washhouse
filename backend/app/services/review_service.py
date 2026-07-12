"""Review creation and listing."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.enums import OrderStatus
from app.models.review import Review
from app.repositories.laundry import LaundryRepository
from app.repositories.order import OrderRepository
from app.repositories.review import ReviewRepository
from app.services.trust_score_service import TrustScoreService
from app.services.laundry_trust_score_service import LaundryTrustScoreService


class ReviewService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._reviews = ReviewRepository(session)
        self._orders = OrderRepository(session)
        self._laundries = LaundryRepository(session)

    async def create(
        self,
        user_id: UUID,
        laundry_id: UUID,
        *,
        order_id: UUID,
        rating: int,
        comment: str | None,
    ) -> Review:
        order = await self._orders.get_by_id(order_id)
        if not order or order.user_id != user_id or order.laundry_id != laundry_id:
            raise NotFoundError("Order not found")
        if order.status != OrderStatus.delivered:
            raise ValidationError("Only delivered orders can be reviewed")
        if await self._reviews.get_by_order(order_id):
            raise ConflictError("Order already reviewed")
        review = Review(
            laundry_id=laundry_id,
            user_id=user_id,
            order_id=order_id,
            rating=rating,
            comment=comment,
        )
        await self._reviews.create(review)
        await TrustScoreService(self._session).on_positive_review(user_id, order_id, rating)
        laundry = await self._laundries.get_by_id(laundry_id)
        if laundry:
            from app.repositories.review_management import ReviewManagementRepository

            avg, count = await ReviewManagementRepository(self._session).avg_rating(laundry_id, published_only=True)
            laundry.avg_rating = Decimal(str(round(avg, 2)))
            laundry.review_count = count
            await self._session.flush()
            await LaundryTrustScoreService(self._session).recalculate(laundry_id)
        return review

    async def list_for_laundry(
        self,
        laundry_id: UUID,
        *,
        limit: int = 20,
        offset: int = 0,
    ) -> list[Review]:
        laundry = await self._laundries.get_by_id(laundry_id)
        if not laundry:
            raise NotFoundError("Laundry not found")
        return await self._reviews.list_by_laundry(laundry_id, limit=limit, offset=offset)
