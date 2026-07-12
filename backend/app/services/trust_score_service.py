"""Customer trust score calculation and event recording."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.enums import ComplaintType, TrustScoreEventType, TrustScoreLevel
from app.models.trust_score import CustomerTrustScoreEvent
from app.api.trust_score_list_params import TrustScoreListParams
from app.core.pagination import build_paginated_response
from app.repositories.trust_score import TrustScoreRepository
from app.schemas.trust_score import (
    TRUST_LEVEL_LABELS,
    TRUST_SCORE_EVENT_LABELS,
    CustomerTrustScoreDetail,
    CustomerTrustScoreSummary,
    TrustScoreEventResponse,
)

MIN_SCORE = 0
MAX_SCORE = 100
DEFAULT_SCORE = 100

SCORE_DELTAS: dict[TrustScoreEventType, int] = {
    TrustScoreEventType.refund_request: -15,
    TrustScoreEventType.dispute_filed: -10,
    TrustScoreEventType.chargeback: -30,
    TrustScoreEventType.failed_payment: -5,
    TrustScoreEventType.fake_claim: -25,
    TrustScoreEventType.successful_order: 2,
    TrustScoreEventType.positive_review: 3,
    TrustScoreEventType.long_history: 5,
}

LONG_HISTORY_MIN_DAYS = 90
LONG_HISTORY_MIN_ORDERS = 5
POSITIVE_REVIEW_MIN_RATING = 4


class TrustScoreService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = TrustScoreRepository(session)

    @staticmethod
    def level_for_score(score: int) -> TrustScoreLevel:
        if score >= 85:
            return TrustScoreLevel.gold
        if score >= 70:
            return TrustScoreLevel.silver
        if score >= 50:
            return TrustScoreLevel.bronze
        return TrustScoreLevel.high_risk

    async def apply_event(
        self,
        user_id: UUID,
        event_type: TrustScoreEventType,
        *,
        reference_type: str | None = None,
        reference_id: UUID | None = None,
        metadata: dict[str, Any] | None = None,
        idempotent: bool = True,
    ) -> CustomerTrustScoreEvent | None:
        if idempotent and reference_id is not None:
            if await self._repo.has_event(user_id, event_type, reference_id=reference_id):
                return None
        if idempotent and event_type == TrustScoreEventType.long_history:
            if await self._repo.has_event(user_id, event_type):
                return None

        delta = SCORE_DELTAS.get(event_type, 0)
        if delta == 0:
            return None

        user = await self._repo.get_user(user_id)
        if not user:
            return None

        before = user.trust_score
        after = max(MIN_SCORE, min(MAX_SCORE, before + delta))
        user.trust_score = after

        row = CustomerTrustScoreEvent(
            user_id=user_id,
            event_type=event_type,
            delta=delta,
            score_before=before,
            score_after=after,
            reference_type=reference_type,
            reference_id=reference_id,
            metadata_=metadata,
        )
        return await self._repo.save_event(row)

    async def on_dispute_filed(
        self,
        user_id: UUID,
        complaint_id: UUID,
        complaint_type: ComplaintType,
    ) -> None:
        await self.apply_event(
            user_id,
            TrustScoreEventType.dispute_filed,
            reference_type="complaint",
            reference_id=complaint_id,
            metadata={"complaint_type": complaint_type.value},
        )
        if complaint_type in (ComplaintType.refund_request,):
            await self.apply_event(
                user_id,
                TrustScoreEventType.refund_request,
                reference_type="complaint",
                reference_id=complaint_id,
                metadata={"complaint_type": complaint_type.value},
            )

    async def on_dispute_rejected(self, user_id: UUID, complaint_id: UUID) -> None:
        await self.apply_event(
            user_id,
            TrustScoreEventType.fake_claim,
            reference_type="complaint",
            reference_id=complaint_id,
            metadata={"reason": "dispute_rejected"},
        )

    async def on_successful_order(self, user_id: UUID, order_id: UUID) -> None:
        await self.apply_event(
            user_id,
            TrustScoreEventType.successful_order,
            reference_type="order",
            reference_id=order_id,
        )
        await self._maybe_award_long_history(user_id)

    async def on_positive_review(self, user_id: UUID, order_id: UUID, rating: int) -> None:
        if rating < POSITIVE_REVIEW_MIN_RATING:
            return
        await self.apply_event(
            user_id,
            TrustScoreEventType.positive_review,
            reference_type="order",
            reference_id=order_id,
            metadata={"rating": rating},
        )

    async def on_failed_payment(self, user_id: UUID, order_id: UUID) -> None:
        await self.apply_event(
            user_id,
            TrustScoreEventType.failed_payment,
            reference_type="order",
            reference_id=order_id,
        )

    async def on_chargeback(self, user_id: UUID, order_id: UUID) -> None:
        await self.apply_event(
            user_id,
            TrustScoreEventType.chargeback,
            reference_type="order",
            reference_id=order_id,
        )

    async def _maybe_award_long_history(self, user_id: UUID) -> None:
        user = await self._repo.get_user(user_id)
        if not user:
            return
        age_days = (datetime.now(UTC) - user.created_at.replace(tzinfo=UTC)).days
        if age_days < LONG_HISTORY_MIN_DAYS:
            return
        delivered = await self._repo.count_delivered_orders(user_id)
        if delivered < LONG_HISTORY_MIN_ORDERS:
            return
        await self.apply_event(
            user_id,
            TrustScoreEventType.long_history,
            reference_type="user",
            reference_id=user_id,
            metadata={"account_age_days": age_days, "delivered_orders": delivered},
        )

    async def list_for_admin(self, params: TrustScoreListParams) -> dict:
        rows, total = await self._repo.list_customers_paginated(params)
        items: list[CustomerTrustScoreSummary] = []
        for user, dispute_count, refund_count, delivered in rows:
            level = self.level_for_score(user.trust_score)
            items.append(
                CustomerTrustScoreSummary(
                    user_id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    phone=user.phone,
                    role=user.role.value,
                    trust_score=user.trust_score,
                    level=level,
                    level_label=TRUST_LEVEL_LABELS[level],
                    risk_level=user.fraud_risk_level.value,
                    delivered_orders=int(delivered or 0),
                    dispute_count=int(dispute_count or 0),
                    refund_count=int(refund_count or 0),
                    status="active" if user.deleted_at is None else "inactive",
                    created_at=user.created_at,
                ),
            )
        return build_paginated_response(
            items=[i.model_dump() for i in items],
            total_records=total,
            page=params.page,
            page_size=params.page_size,
        )

    async def list_for_admin_legacy(self) -> list[CustomerTrustScoreSummary]:
        from app.api.trust_score_list_params import TrustScoreListParams

        data = await self.list_for_admin(TrustScoreListParams(page=1, page_size=100))
        return [CustomerTrustScoreSummary.model_validate(i) for i in data["items"]]

    async def get_detail_for_admin(self, user_id: UUID) -> CustomerTrustScoreDetail:
        user = await self._repo.get_user(user_id)
        if not user:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Customer not found")
        summary = await self._to_summary(user)
        events = await self._repo.list_events(user_id)
        return CustomerTrustScoreDetail(
            **summary.model_dump(),
            events=[self._event_response(e) for e in events],
        )

    async def _to_summary(self, user, *, dispute_count: int = 0, refund_count: int = 0, delivered: int | None = None) -> CustomerTrustScoreSummary:
        level = self.level_for_score(user.trust_score)
        if delivered is None:
            delivered = await self._repo.count_delivered_orders(user.id)
        if not dispute_count:
            dispute_count = await self._count_disputes(user.id)
        return CustomerTrustScoreSummary(
            user_id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            role=user.role.value,
            trust_score=user.trust_score,
            level=level,
            level_label=TRUST_LEVEL_LABELS[level],
            risk_level=user.fraud_risk_level.value,
            delivered_orders=delivered,
            dispute_count=dispute_count,
            refund_count=refund_count,
            status="active" if user.deleted_at is None else "inactive",
            created_at=user.created_at,
        )

    async def _count_disputes(self, user_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(Complaint).where(Complaint.user_id == user_id),
        )
        return int(result.scalar_one())

    @staticmethod
    def _event_response(row: CustomerTrustScoreEvent) -> TrustScoreEventResponse:
        return TrustScoreEventResponse(
            id=row.id,
            user_id=row.user_id,
            event_type=row.event_type,
            label=TRUST_SCORE_EVENT_LABELS.get(row.event_type, row.event_type.value),
            delta=row.delta,
            score_before=row.score_before,
            score_after=row.score_after,
            reference_type=row.reference_type,
            reference_id=row.reference_id,
            metadata=row.metadata_,
            created_at=row.created_at,
        )
