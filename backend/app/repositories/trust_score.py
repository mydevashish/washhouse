"""Customer trust score persistence."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.types import String

from app.api.trust_score_list_params import TrustScoreListParams
from app.core.pagination import apply_sort
from app.models.complaint import Complaint
from app.models.enums import ComplaintType, FraudRiskLevel, OrderStatus, TrustScoreLevel, UserRole
from app.models.order import Order
from app.models.trust_score import CustomerTrustScoreEvent
from app.models.user import User


class TrustScoreRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_user(self, user_id: UUID) -> User | None:
        result = await self._session.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None)),
        )
        return result.scalar_one_or_none()

    async def save_event(self, row: CustomerTrustScoreEvent) -> CustomerTrustScoreEvent:
        self._session.add(row)
        await self._session.flush()
        return row

    async def has_event(
        self,
        user_id: UUID,
        event_type,
        *,
        reference_id: UUID | None = None,
    ) -> bool:
        q = select(CustomerTrustScoreEvent.id).where(
            CustomerTrustScoreEvent.user_id == user_id,
            CustomerTrustScoreEvent.event_type == event_type,
        )
        if reference_id is not None:
            q = q.where(CustomerTrustScoreEvent.reference_id == reference_id)
        result = await self._session.execute(q.limit(1))
        return result.scalar_one_or_none() is not None

    async def list_events(self, user_id: UUID, *, limit: int = 100) -> list[CustomerTrustScoreEvent]:
        result = await self._session.execute(
            select(CustomerTrustScoreEvent)
            .where(CustomerTrustScoreEvent.user_id == user_id)
            .order_by(CustomerTrustScoreEvent.created_at.desc())
            .limit(limit),
        )
        return list(result.scalars().all())

    async def count_delivered_orders(self, user_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(Order)
            .where(
                Order.user_id == user_id,
                Order.status == OrderStatus.delivered,
                Order.deleted_at.is_(None),
            ),
        )
        return int(result.scalar_one())

    async def list_customers_paginated(
        self,
        params: TrustScoreListParams,
    ) -> tuple[list[tuple[User, int, int, int]], int]:
        dispute_sq = (
            select(func.count())
            .select_from(Complaint)
            .where(Complaint.user_id == User.id)
            .correlate(User)
            .scalar_subquery()
        )
        refund_sq = (
            select(func.count())
            .select_from(Complaint)
            .where(
                Complaint.user_id == User.id,
                Complaint.complaint_type == ComplaintType.refund_request,
            )
            .correlate(User)
            .scalar_subquery()
        )
        orders_sq = (
            select(func.count())
            .select_from(Order)
            .where(
                Order.user_id == User.id,
                Order.status == OrderStatus.delivered,
                Order.deleted_at.is_(None),
            )
            .correlate(User)
            .scalar_subquery()
        )

        role = UserRole(params.role) if params.role else UserRole.customer
        stmt = select(User, dispute_sq, refund_sq, orders_sq).where(
            User.deleted_at.is_(None),
            User.role == role,
        )

        if params.risk_level:
            stmt = stmt.where(User.fraud_risk_level == FraudRiskLevel(params.risk_level))
        if params.trust_score_min is not None:
            stmt = stmt.where(User.trust_score >= params.trust_score_min)
        if params.trust_score_max is not None:
            stmt = stmt.where(User.trust_score <= params.trust_score_max)
        if params.created_from:
            stmt = stmt.where(User.created_at >= params.created_from)
        if params.created_to:
            stmt = stmt.where(User.created_at <= params.created_to)
        if params.status == "active":
            stmt = stmt.where(User.deleted_at.is_(None))
        elif params.status == "high_risk":
            stmt = stmt.where(User.trust_score < 50)

        if params.search:
            term = f"%{params.search}%"
            stmt = stmt.where(
                or_(
                    User.full_name.ilike(term),
                    User.email.ilike(term),
                    User.phone.ilike(term),
                    cast(User.id, String).ilike(term),
                ),
            )

        sort_map = {
            "trust_score": User.trust_score,
            "full_name": User.full_name,
            "created_at": User.created_at,
            "email": User.email,
            "disputes": dispute_sq,
            "orders": orders_sq,
        }
        stmt = apply_sort(
            stmt,
            params.sort_by,
            params.sort_order,
            column_map=sort_map,
            default=User.trust_score,
        )

        count_stmt = select(func.count()).select_from(
            stmt.order_by(None).subquery(),
        )
        total = int(await self._session.scalar(count_stmt) or 0)
        result = await self._session.execute(
            stmt.offset(params.offset).limit(params.page_size),
        )
        return list(result.all()), total
