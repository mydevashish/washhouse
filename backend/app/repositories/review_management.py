"""Review management persistence."""

from __future__ import annotations

import re
from collections import Counter
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import cast, func, select, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ReviewStatus
from app.models.laundry import Laundry
from app.models.review import Review
from app.models.user import User

COMPLAINT_THEMES = {
    "Late delivery": ["late", "delay", "delayed", "slow"],
    "Damaged items": ["damage", "damaged", "torn", "stain", "ruined", "tear"],
    "Poor quality": ["poor", "bad", "worst", "quality", "dirty"],
    "Missing items": ["missing", "lost", "incomplete"],
    "Rude service": ["rude", "unprofessional", "behavior", "staff"],
    "Overpriced": ["expensive", "overpriced", "cost", "price"],
}

PRAISE_THEMES = {
    "Fast service": ["fast", "quick", "speedy", "prompt"],
    "Great quality": ["excellent", "perfect", "clean", "fresh", "quality", "great"],
    "Friendly staff": ["friendly", "polite", "helpful", "professional", "staff"],
    "Good value": ["value", "affordable", "reasonable", "worth"],
    "On-time delivery": ["on time", "ontime", "punctual", "timely"],
    "Highly recommend": ["recommend", "love", "best", "amazing", "awesome"],
}


def _match_themes(text: str, themes: dict[str, list[str]]) -> list[str]:
    lower = text.lower()
    matched = []
    for label, keywords in themes.items():
        if any(kw in lower for kw in keywords):
            matched.append(label)
    return matched


class ReviewManagementRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_review(self, review_id: UUID) -> Review | None:
        return await self._session.get(Review, review_id)

    async def get_review_for_laundry(self, review_id: UUID, laundry_id: UUID) -> Review | None:
        return await self._session.scalar(
            select(Review).where(Review.id == review_id, Review.laundry_id == laundry_id),
        )

    async def list_reviews(
        self,
        laundry_id: UUID | None = None,
        *,
        rating: int | None = None,
        min_rating: int | None = None,
        max_rating: int | None = None,
        has_reply: bool | None = None,
        abuse_reported: bool | None = None,
        status: ReviewStatus | None = None,
        statuses: tuple[ReviewStatus, ...] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[tuple[Review, str]]:
        q = (
            select(Review, User.full_name)
            .join(User, User.id == Review.user_id)
            .order_by(Review.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if laundry_id:
            q = q.where(Review.laundry_id == laundry_id)
        if rating is not None:
            q = q.where(Review.rating == rating)
        if min_rating is not None:
            q = q.where(Review.rating >= min_rating)
        if max_rating is not None:
            q = q.where(Review.rating <= max_rating)
        if has_reply is True:
            q = q.where(Review.partner_reply.isnot(None))
        elif has_reply is False:
            q = q.where(Review.partner_reply.is_(None))
        if abuse_reported is not None:
            q = q.where(Review.abuse_reported.is_(abuse_reported))
        if status is not None:
            q = q.where(Review.status == status)
        elif statuses:
            q = q.where(Review.status.in_(statuses))
        result = await self._session.execute(q)
        return list(result.all())

    async def count_reviews(
        self,
        laundry_id: UUID,
        *,
        status: ReviewStatus | None = None,
        statuses: tuple[ReviewStatus, ...] | None = None,
    ) -> int:
        q = select(func.count()).select_from(Review).where(Review.laundry_id == laundry_id)
        if status:
            q = q.where(Review.status == status)
        elif statuses:
            q = q.where(Review.status.in_(statuses))
        return int(await self._session.scalar(q) or 0)

    async def avg_rating(self, laundry_id: UUID, *, published_only: bool = True) -> tuple[float, int]:
        q = select(func.avg(Review.rating), func.count()).where(Review.laundry_id == laundry_id)
        if published_only:
            q = q.where(Review.status == ReviewStatus.published)
        row = (await self._session.execute(q)).one()
        return float(row[0] or 0), int(row[1] or 0)

    async def sentiment_counts(self, laundry_id: UUID) -> tuple[int, int]:
        """Return (positive_reviews, negative_reviews) for published reviews."""
        positive = int(
            await self._session.scalar(
                select(func.count())
                .select_from(Review)
                .where(
                    Review.laundry_id == laundry_id,
                    Review.status == ReviewStatus.published,
                    Review.rating >= 4,
                ),
            )
            or 0,
        )
        negative = int(
            await self._session.scalar(
                select(func.count())
                .select_from(Review)
                .where(
                    Review.laundry_id == laundry_id,
                    Review.status == ReviewStatus.published,
                    Review.rating <= 2,
                ),
            )
            or 0,
        )
        return positive, negative

    async def rating_trend(self, laundry_id: UUID, days: int = 30) -> list[dict]:
        start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
        rows = await self._session.execute(
            select(
                cast(Review.created_at, Date).label("day"),
                func.avg(Review.rating),
                func.count(Review.id),
            )
            .where(
                Review.laundry_id == laundry_id,
                Review.status == ReviewStatus.published,
                Review.created_at >= start,
            )
            .group_by(cast(Review.created_at, Date))
            .order_by(cast(Review.created_at, Date)),
        )
        by_day = {str(r[0]): (round(float(r[1] or 0), 2), int(r[2])) for r in rows.all()}
        trend = []
        for i in range(days):
            day = (start + timedelta(days=i)).date()
            avg, cnt = by_day.get(str(day), (0.0, 0))
            trend.append({"date": day.isoformat(), "avg_rating": avg, "review_count": cnt})
        return trend

    async def theme_counts(self, laundry_id: UUID) -> tuple[list[dict], list[dict]]:
        rows = await self._session.scalars(
            select(Review).where(
                Review.laundry_id == laundry_id,
                Review.status == ReviewStatus.published,
                Review.comment.isnot(None),
            ),
        )
        complaint_counter: Counter[str] = Counter()
        praise_counter: Counter[str] = Counter()
        for review in rows.all():
            if not review.comment:
                continue
            if review.rating <= 2:
                for theme in _match_themes(review.comment, COMPLAINT_THEMES):
                    complaint_counter[theme] += 1
            elif review.rating >= 4:
                for theme in _match_themes(review.comment, PRAISE_THEMES):
                    praise_counter[theme] += 1
        complaints = [{"theme": k, "count": v} for k, v in complaint_counter.most_common(5)]
        praise = [{"theme": k, "count": v} for k, v in praise_counter.most_common(5)]
        return complaints, praise

    async def moderation_queue_count(self) -> int:
        return int(
            await self._session.scalar(
                select(func.count())
                .select_from(Review)
                .where(
                    Review.status.in_((ReviewStatus.pending_moderation, ReviewStatus.hidden)),
                    Review.abuse_reported.is_(True),
                ),
            )
            or 0,
        )

    async def get_laundry_for_owner(self, owner_user_id: UUID) -> Laundry | None:
        return await self._session.scalar(
            select(Laundry).where(Laundry.owner_user_id == owner_user_id, Laundry.deleted_at.is_(None)),
        )

    async def get_laundry(self, laundry_id: UUID) -> Laundry | None:
        return await self._session.get(Laundry, laundry_id)

    @staticmethod
    def sanitize_reply(text: str) -> str:
        cleaned = re.sub(r"\s+", " ", text.strip())
        return cleaned[:2000]
