"""Laundry (partner) trust score calculation from operational metrics."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.enums import LaundryTrustLevel
from app.models.laundry import Laundry
from app.repositories.laundry_trust_score import LaundryTrustScoreRepository
from app.repositories.order import OrderRepository
from app.repositories.user import UserRepository
from app.schemas.laundry_trust_score import (
    LAUNDRY_TRUST_LEVEL_LABELS,
    LaundryTrustMetrics,
    LaundryTrustScoreDetail,
    LaundryTrustScoreSummary,
)

MIN_SCORE = 0
MAX_SCORE = 100
DEFAULT_SCORE = 70

WEIGHTS: dict[str, float] = {
    "on_time_delivery": 0.25,
    "complaint_rate": 0.20,
    "refund_rate": 0.15,
    "dispute_rate": 0.10,
    "customer_rating": 0.20,
    "completed_orders": 0.10,
}


class LaundryTrustScoreService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = LaundryTrustScoreRepository(session)
        self._orders = OrderRepository(session)
        self._users = UserRepository(session)

    @staticmethod
    def level_for_score(score: int) -> LaundryTrustLevel:
        if score >= 85:
            return LaundryTrustLevel.premium
        if score >= 70:
            return LaundryTrustLevel.trusted
        if score >= 50:
            return LaundryTrustLevel.verified
        return LaundryTrustLevel.under_review

    async def compute_metrics(self, laundry_id: UUID) -> LaundryTrustMetrics:
        completed = await self._repo.count_completed_orders(laundry_id)
        on_time = await self._repo.count_on_time_deliveries(laundry_id)
        complaints = await self._repo.count_complaints(laundry_id)
        disputes = await self._repo.count_active_disputes(laundry_id)
        refunds = await self._repo.count_refunded_orders(laundry_id)

        laundry = await self._repo.get_laundry(laundry_id)
        avg_rating = float(laundry.avg_rating) if laundry else 0.0
        review_count = laundry.review_count if laundry else 0

        if completed > 0:
            on_time_pct = (on_time / completed) * 100.0
            complaint_rate = (complaints / completed) * 100.0
            refund_rate = (refunds / completed) * 100.0
            dispute_rate = (disputes / completed) * 100.0
        else:
            on_time_pct = 100.0
            complaint_rate = 0.0
            refund_rate = 0.0
            dispute_rate = 0.0

        return LaundryTrustMetrics(
            on_time_delivery_pct=round(on_time_pct, 1),
            complaint_rate_pct=round(complaint_rate, 1),
            refund_rate_pct=round(refund_rate, 1),
            dispute_rate_pct=round(dispute_rate, 1),
            avg_rating=round(avg_rating, 2),
            review_count=review_count,
            completed_orders=completed,
        )

    @staticmethod
    def score_breakdown(metrics: LaundryTrustMetrics) -> dict[str, float]:
        on_time_score = metrics.on_time_delivery_pct
        complaint_score = max(0.0, 100.0 - metrics.complaint_rate_pct * 10.0)
        refund_score = max(0.0, 100.0 - metrics.refund_rate_pct * 20.0)
        dispute_score = max(0.0, 100.0 - metrics.dispute_rate_pct * 25.0)
        if metrics.review_count > 0:
            rating_score = (metrics.avg_rating / 5.0) * 100.0
        else:
            rating_score = 70.0
        volume_score = min(100.0, metrics.completed_orders * 2.0)
        return {
            "on_time_delivery": round(on_time_score, 1),
            "complaint_rate": round(complaint_score, 1),
            "refund_rate": round(refund_score, 1),
            "dispute_rate": round(dispute_score, 1),
            "customer_rating": round(rating_score, 1),
            "completed_orders": round(volume_score, 1),
        }

    @classmethod
    def compute_score_from_metrics(cls, metrics: LaundryTrustMetrics) -> tuple[int, dict[str, float]]:
        if metrics.completed_orders == 0:
            neutral = {key: float(DEFAULT_SCORE) for key in WEIGHTS}
            return DEFAULT_SCORE, neutral

        breakdown = cls.score_breakdown(metrics)
        raw = sum(breakdown[key] * WEIGHTS[key] for key in WEIGHTS)
        score = int(round(max(MIN_SCORE, min(MAX_SCORE, raw))))
        return score, breakdown

    async def recalculate(self, laundry_id: UUID) -> LaundryTrustScoreSummary | None:
        laundry = await self._repo.get_laundry(laundry_id)
        if not laundry:
            return None
        metrics = await self.compute_metrics(laundry_id)
        score, breakdown = self.compute_score_from_metrics(metrics)
        laundry.trust_score = score
        await self._session.flush()
        return await self._to_summary(laundry, metrics)

    async def recalculate_for_order(self, order_id: UUID) -> None:
        order = await self._orders.get_by_id(order_id)
        if order and order.laundry_id:
            await self.recalculate(order.laundry_id)

    async def get_for_partner(self, owner_user_id: UUID) -> LaundryTrustScoreSummary:
        laundry = await self._repo.get_laundry_by_owner(owner_user_id)
        if not laundry:
            raise NotFoundError("Laundry not found")
        metrics = await self.compute_metrics(laundry.id)
        score, breakdown = self.compute_score_from_metrics(metrics)
        if laundry.trust_score != score:
            laundry.trust_score = score
            await self._session.flush()
        return await self._to_summary(laundry, metrics)

    async def list_for_admin(self) -> list[LaundryTrustScoreSummary]:
        laundries = await self._repo.list_laundries()
        summaries: list[LaundryTrustScoreSummary] = []
        for laundry in laundries:
            metrics = await self.compute_metrics(laundry.id)
            score, breakdown = self.compute_score_from_metrics(metrics)
            if laundry.trust_score != score:
                laundry.trust_score = score
            summaries.append(await self._to_summary(laundry, metrics))
        await self._session.flush()
        summaries.sort(key=lambda s: s.trust_score)
        return summaries

    async def get_detail_for_admin(self, laundry_id: UUID) -> LaundryTrustScoreDetail:
        laundry = await self._repo.get_laundry(laundry_id)
        if not laundry:
            raise NotFoundError("Laundry not found")
        metrics = await self.compute_metrics(laundry_id)
        score, breakdown = self.compute_score_from_metrics(metrics)
        laundry.trust_score = score
        await self._session.flush()
        summary = await self._to_summary(laundry, metrics)
        return LaundryTrustScoreDetail(**summary.model_dump(), score_breakdown=breakdown)

    async def _to_summary(
        self,
        laundry: Laundry,
        metrics: LaundryTrustMetrics,
    ) -> LaundryTrustScoreSummary:
        score, _ = self.compute_score_from_metrics(metrics)
        level = self.level_for_score(score)
        owner = await self._users.get_by_id(laundry.owner_user_id)
        return LaundryTrustScoreSummary(
            laundry_id=laundry.id,
            laundry_name=laundry.name,
            city=laundry.city,
            owner_name=owner.full_name if owner else None,
            trust_score=score,
            level=level,
            level_label=LAUNDRY_TRUST_LEVEL_LABELS[level],
            metrics=metrics,
            calculated_at=datetime.now(UTC),
        )
