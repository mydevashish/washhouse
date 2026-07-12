"""Profit sharing persistence."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import OrderStatus, ProfitSharePayoutStatus, ProfitSharePeriodStatus
from app.models.order import Order
from app.models.profit_sharing import (
    PlatformExpense,
    PlatformOwnershipPartner,
    ProfitShareAllocation,
    ProfitSharePeriod,
)


def _commission_expr():
    return Order.total_inr * Order.commission_rate / Decimal("100")


def _period_bounds(year: int, month: int) -> tuple[datetime, datetime]:
    start = datetime(year, month, 1, tzinfo=UTC)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=UTC)
    else:
        end = datetime(year, month + 1, 1, tzinfo=UTC)
    return start, end


class ProfitSharingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_partners(self, *, include_inactive: bool = False) -> list[PlatformOwnershipPartner]:
        q = select(PlatformOwnershipPartner).where(PlatformOwnershipPartner.deleted_at.is_(None))
        if not include_inactive:
            q = q.where(PlatformOwnershipPartner.is_active.is_(True))
        q = q.order_by(PlatformOwnershipPartner.name)
        return list((await self._session.scalars(q)).all())

    async def get_partner(self, partner_id: UUID) -> PlatformOwnershipPartner | None:
        return await self._session.scalar(
            select(PlatformOwnershipPartner).where(
                PlatformOwnershipPartner.id == partner_id,
                PlatformOwnershipPartner.deleted_at.is_(None),
            ),
        )

    async def sum_active_ownership_pct(self, *, exclude_id: UUID | None = None) -> Decimal:
        q = select(func.coalesce(func.sum(PlatformOwnershipPartner.ownership_pct), 0)).where(
            PlatformOwnershipPartner.deleted_at.is_(None),
            PlatformOwnershipPartner.is_active.is_(True),
        )
        if exclude_id:
            q = q.where(PlatformOwnershipPartner.id != exclude_id)
        return Decimal(str(await self._session.scalar(q) or 0))

    async def commission_revenue(self, year: int, month: int) -> Decimal:
        start, end = _period_bounds(year, month)
        row = await self._session.scalar(
            select(func.coalesce(func.sum(_commission_expr()), 0)).where(
                Order.deleted_at.is_(None),
                Order.status == OrderStatus.delivered,
                Order.delivered_at.isnot(None),
                Order.delivered_at >= start,
                Order.delivered_at < end,
            ),
        )
        return Decimal(str(row or 0))

    async def sum_expenses(self, year: int, month: int) -> Decimal:
        row = await self._session.scalar(
            select(func.coalesce(func.sum(PlatformExpense.amount_inr), 0)).where(
                PlatformExpense.period_year == year,
                PlatformExpense.period_month == month,
            ),
        )
        return Decimal(str(row or 0))

    async def list_expenses(self, year: int, month: int) -> list[PlatformExpense]:
        rows = await self._session.scalars(
            select(PlatformExpense)
            .where(PlatformExpense.period_year == year, PlatformExpense.period_month == month)
            .order_by(PlatformExpense.created_at.desc()),
        )
        return list(rows.all())

    async def get_expense(self, expense_id: UUID) -> PlatformExpense | None:
        return await self._session.get(PlatformExpense, expense_id)

    async def get_period(self, year: int, month: int) -> ProfitSharePeriod | None:
        return await self._session.scalar(
            select(ProfitSharePeriod).where(
                ProfitSharePeriod.period_year == year,
                ProfitSharePeriod.period_month == month,
            ),
        )

    async def get_period_by_id(self, period_id: UUID) -> ProfitSharePeriod | None:
        return await self._session.get(ProfitSharePeriod, period_id)

    async def list_periods(self, *, limit: int = 24) -> list[ProfitSharePeriod]:
        rows = await self._session.scalars(
            select(ProfitSharePeriod)
            .order_by(ProfitSharePeriod.period_year.desc(), ProfitSharePeriod.period_month.desc())
            .limit(limit),
        )
        return list(rows.all())

    async def list_allocations_for_period(self, period_id: UUID) -> list[ProfitShareAllocation]:
        rows = await self._session.scalars(
            select(ProfitShareAllocation)
            .where(ProfitShareAllocation.period_id == period_id)
            .order_by(ProfitShareAllocation.partner_name),
        )
        return list(rows.all())

    async def get_allocation(self, allocation_id: UUID) -> ProfitShareAllocation | None:
        return await self._session.get(ProfitShareAllocation, allocation_id)

    async def pending_payout_total(self) -> Decimal:
        row = await self._session.scalar(
            select(func.coalesce(func.sum(ProfitShareAllocation.earnings_inr), 0)).where(
                ProfitShareAllocation.payout_status == ProfitSharePayoutStatus.pending,
            ),
        )
        return Decimal(str(row or 0))

    async def paid_payout_total(self) -> Decimal:
        row = await self._session.scalar(
            select(func.coalesce(func.sum(ProfitShareAllocation.earnings_inr), 0)).where(
                ProfitShareAllocation.payout_status == ProfitSharePayoutStatus.paid,
            ),
        )
        return Decimal(str(row or 0))

    async def payout_history(self, *, limit: int = 50, partner_id: UUID | None = None) -> list[ProfitShareAllocation]:
        q = (
            select(ProfitShareAllocation)
            .where(ProfitShareAllocation.payout_status == ProfitSharePayoutStatus.paid)
            .order_by(ProfitShareAllocation.paid_at.desc())
            .limit(limit)
        )
        if partner_id:
            q = q.where(ProfitShareAllocation.partner_id == partner_id)
        return list((await self._session.scalars(q)).all())

    async def pending_allocations(self, *, partner_id: UUID | None = None) -> list[ProfitShareAllocation]:
        q = (
            select(ProfitShareAllocation)
            .where(ProfitShareAllocation.payout_status == ProfitSharePayoutStatus.pending)
            .order_by(ProfitShareAllocation.created_at.desc())
        )
        if partner_id:
            q = q.where(ProfitShareAllocation.partner_id == partner_id)
        return list((await self._session.scalars(q)).all())

    async def get_partner_by_user_id(self, user_id: UUID) -> PlatformOwnershipPartner | None:
        return await self._session.scalar(
            select(PlatformOwnershipPartner).where(
                PlatformOwnershipPartner.user_id == user_id,
                PlatformOwnershipPartner.deleted_at.is_(None),
                PlatformOwnershipPartner.is_active.is_(True),
            ),
        )

    async def partner_earnings_totals(self, partner_id: UUID) -> tuple[Decimal, Decimal]:
        pending = await self._session.scalar(
            select(func.coalesce(func.sum(ProfitShareAllocation.earnings_inr), 0)).where(
                ProfitShareAllocation.partner_id == partner_id,
                ProfitShareAllocation.payout_status == ProfitSharePayoutStatus.pending,
            ),
        )
        paid = await self._session.scalar(
            select(func.coalesce(func.sum(ProfitShareAllocation.earnings_inr), 0)).where(
                ProfitShareAllocation.partner_id == partner_id,
                ProfitShareAllocation.payout_status == ProfitSharePayoutStatus.paid,
            ),
        )
        return Decimal(str(pending or 0)), Decimal(str(paid or 0))

    async def is_period_finalized(self, year: int, month: int) -> bool:
        period = await self.get_period(year, month)
        return period is not None and period.status == ProfitSharePeriodStatus.finalized
