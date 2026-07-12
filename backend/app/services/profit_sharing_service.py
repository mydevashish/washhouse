"""Ownership and profit sharing business logic."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.enums import (
    AuditAction,
    PlatformExpenseCategory,
    ProfitSharePayoutStatus,
    ProfitSharePeriodStatus,
)
from app.models.profit_sharing import (
    PlatformExpense,
    PlatformOwnershipPartner,
    ProfitShareAllocation,
    ProfitSharePeriod,
)
from app.repositories.audit import AuditRepository
from app.repositories.profit_sharing import ProfitSharingRepository

OWNERSHIP_TARGET = Decimal("100.00")
Q = Decimal("0.01")


def _money(value: Decimal) -> str:
    return str(value.quantize(Q, rounding=ROUND_HALF_UP))


def _pct(value: Decimal) -> str:
    return str(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


class ProfitSharingService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = ProfitSharingRepository(session)
        self._audit = AuditRepository(session)

    async def _validate_ownership_total(
        self,
        *,
        new_pct: Decimal | None = None,
        exclude_id: UUID | None = None,
    ) -> Decimal:
        total = await self._repo.sum_active_ownership_pct(exclude_id=exclude_id)
        if new_pct is not None:
            total += new_pct
        if total != OWNERSHIP_TARGET:
            raise ValidationError(
                f"Active ownership must total 100% (currently {_pct(total)}%)",
                details=[],
            )
        return total

    def _serialize_partner(self, row: PlatformOwnershipPartner) -> dict:
        return {
            "id": row.id,
            "name": row.name,
            "ownership_pct": _pct(row.ownership_pct),
            "user_id": row.user_id,
            "is_active": row.is_active,
            "notes": row.notes,
            "created_at": row.created_at.isoformat(),
            "updated_at": row.updated_at.isoformat(),
        }

    async def _serialize_allocation(self, row: ProfitShareAllocation) -> dict:
        period = row.period if row.period else await self._repo.get_period_by_id(row.period_id)
        return {
            "id": row.id,
            "period_id": row.period_id,
            "period_year": period.period_year if period else 0,
            "period_month": period.period_month if period else 0,
            "partner_id": row.partner_id,
            "partner_name": row.partner_name,
            "ownership_pct": _pct(row.ownership_pct),
            "earnings_inr": _money(row.earnings_inr),
            "payout_status": row.payout_status.value,
            "paid_at": row.paid_at.isoformat() if row.paid_at else None,
            "payment_reference": row.payment_reference,
        }

    async def _period_preview(self, year: int, month: int) -> dict:
        revenue = await self._repo.commission_revenue(year, month)
        expenses = await self._repo.sum_expenses(year, month)
        profit = revenue - expenses
        finalized = await self._repo.is_period_finalized(year, month)
        return {
            "period_year": year,
            "period_month": month,
            "revenue_inr": _money(revenue),
            "expenses_inr": _money(expenses),
            "profit_inr": _money(profit),
            "is_finalized": finalized,
        }

    async def admin_overview(self) -> dict:
        partners = await self._repo.list_partners(include_inactive=True)
        active_total = await self._repo.sum_active_ownership_pct()
        now = datetime.now(UTC)
        current = await self._period_preview(now.year, now.month)
        history = await self._repo.payout_history(limit=10)
        return {
            "ownership_total_pct": _pct(active_total),
            "ownership_valid": active_total == OWNERSHIP_TARGET,
            "partners": [self._serialize_partner(p) for p in partners],
            "pending_payouts_inr": _money(await self._repo.pending_payout_total()),
            "paid_payouts_inr": _money(await self._repo.paid_payout_total()),
            "current_period": current,
            "recent_payouts": [await self._serialize_allocation(a) for a in history],
        }

    async def list_partners(self) -> list[dict]:
        rows = await self._repo.list_partners(include_inactive=True)
        return [self._serialize_partner(r) for r in rows]

    async def create_partner(self, *, body: dict, actor_user_id: UUID) -> dict:
        pct = Decimal(str(body["ownership_pct"]))
        await self._validate_ownership_total(new_pct=pct)
        row = PlatformOwnershipPartner(
            name=body["name"].strip(),
            ownership_pct=pct,
            user_id=body.get("user_id"),
            notes=body.get("notes"),
        )
        self._session.add(row)
        await self._session.flush()
        await self._audit.log(
            action=AuditAction.ownership_partner_created,
            actor_user_id=actor_user_id,
            resource_type="platform_ownership_partner",
            resource_id=str(row.id),
            metadata={"name": row.name, "ownership_pct": _pct(pct)},
        )
        return self._serialize_partner(row)

    async def update_partner(self, partner_id: UUID, *, body: dict, actor_user_id: UUID) -> dict:
        row = await self._repo.get_partner(partner_id)
        if not row:
            raise NotFoundError("Ownership partner not found")

        if body.get("name") is not None:
            row.name = body["name"].strip()
        if body.get("notes") is not None:
            row.notes = body["notes"]
        if "user_id" in body:
            row.user_id = body["user_id"]
        if body.get("is_active") is not None:
            row.is_active = body["is_active"]
        if body.get("ownership_pct") is not None:
            row.ownership_pct = Decimal(str(body["ownership_pct"]))

        await self._session.flush()

        active_partners = await self._repo.list_partners()
        if active_partners:
            active_total = await self._repo.sum_active_ownership_pct()
            if active_total != OWNERSHIP_TARGET:
                raise ValidationError(
                    f"Active ownership must total 100% (currently {_pct(active_total)}%)",
                )

        await self._audit.log(
            action=AuditAction.ownership_partner_updated,
            actor_user_id=actor_user_id,
            resource_type="platform_ownership_partner",
            resource_id=str(row.id),
            metadata={"name": row.name},
        )
        return self._serialize_partner(row)

    async def deactivate_partner(self, partner_id: UUID, *, actor_user_id: UUID) -> dict:
        row = await self._repo.get_partner(partner_id)
        if not row:
            raise NotFoundError("Ownership partner not found")
        row.is_active = False
        row.deleted_at = datetime.now(UTC)
        await self._session.flush()
        remaining = await self._repo.sum_active_ownership_pct()
        await self._audit.log(
            action=AuditAction.ownership_partner_deactivated,
            actor_user_id=actor_user_id,
            resource_type="platform_ownership_partner",
            resource_id=str(row.id),
            metadata={"remaining_ownership_pct": _pct(remaining)},
        )
        return self._serialize_partner(row)

    async def list_expenses(self, year: int, month: int) -> list[dict]:
        rows = await self._repo.list_expenses(year, month)
        return [
            {
                "id": r.id,
                "period_year": r.period_year,
                "period_month": r.period_month,
                "category": r.category.value,
                "description": r.description,
                "amount_inr": _money(r.amount_inr),
                "recorded_by": r.recorded_by,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]

    async def create_expense(self, *, body: dict, actor_user_id: UUID) -> dict:
        if await self._repo.is_period_finalized(body["period_year"], body["period_month"]):
            raise ConflictError("Cannot add expenses to a finalized profit share period")
        try:
            category = PlatformExpenseCategory(body["category"])
        except ValueError as exc:
            raise ValidationError("Invalid expense category") from exc
        row = PlatformExpense(
            period_year=body["period_year"],
            period_month=body["period_month"],
            category=category,
            description=body["description"].strip(),
            amount_inr=Decimal(str(body["amount_inr"])),
            recorded_by=actor_user_id,
        )
        self._session.add(row)
        await self._session.flush()
        await self._audit.log(
            action=AuditAction.platform_expense_recorded,
            actor_user_id=actor_user_id,
            resource_type="platform_expense",
            resource_id=str(row.id),
            metadata={"amount_inr": _money(row.amount_inr), "period": f"{row.period_year}-{row.period_month:02d}"},
        )
        return {
            "id": row.id,
            "period_year": row.period_year,
            "period_month": row.period_month,
            "category": row.category.value,
            "description": row.description,
            "amount_inr": _money(row.amount_inr),
            "recorded_by": row.recorded_by,
            "created_at": row.created_at.isoformat(),
        }

    async def delete_expense(self, expense_id: UUID, *, actor_user_id: UUID) -> None:
        row = await self._repo.get_expense(expense_id)
        if not row:
            raise NotFoundError("Expense not found")
        if await self._repo.is_period_finalized(row.period_year, row.period_month):
            raise ConflictError("Cannot delete expenses from a finalized profit share period")
        await self._session.delete(row)
        await self._audit.log(
            action=AuditAction.platform_expense_deleted,
            actor_user_id=actor_user_id,
            resource_type="platform_expense",
            resource_id=str(expense_id),
        )

    async def preview_period(self, year: int, month: int) -> dict:
        return await self._period_preview(year, month)

    async def list_periods(self) -> list[dict]:
        periods = await self._repo.list_periods()
        result: list[dict] = []
        for p in periods:
            allocations = await self._repo.list_allocations_for_period(p.id)
            result.append({
                "id": p.id,
                "period_year": p.period_year,
                "period_month": p.period_month,
                "revenue_inr": _money(p.revenue_inr),
                "expenses_inr": _money(p.expenses_inr),
                "profit_inr": _money(p.profit_inr),
                "status": p.status.value,
                "finalized_at": p.finalized_at.isoformat() if p.finalized_at else None,
                "allocations": [await self._serialize_allocation(a) for a in allocations],
            })
        return result

    async def finalize_period(self, *, year: int, month: int, actor_user_id: UUID) -> dict:
        existing = await self._repo.get_period(year, month)
        if existing and existing.status == ProfitSharePeriodStatus.finalized:
            raise ConflictError("Profit share period already finalized")

        active_total = await self._repo.sum_active_ownership_pct()
        if active_total != OWNERSHIP_TARGET:
            raise ValidationError(
                f"Cannot finalize: active ownership is {_pct(active_total)}%, must be 100%",
            )

        partners = await self._repo.list_partners()
        if not partners:
            raise ValidationError("No active ownership partners configured")

        revenue = await self._repo.commission_revenue(year, month)
        expenses = await self._repo.sum_expenses(year, month)
        profit = revenue - expenses

        period = existing or ProfitSharePeriod(period_year=year, period_month=month)
        period.revenue_inr = revenue
        period.expenses_inr = expenses
        period.profit_inr = profit
        period.status = ProfitSharePeriodStatus.finalized
        period.finalized_at = datetime.now(UTC)
        period.finalized_by = actor_user_id
        if not existing:
            self._session.add(period)
        await self._session.flush()

        for partner in partners:
            earnings = (profit * partner.ownership_pct / Decimal("100")).quantize(Q, rounding=ROUND_HALF_UP)
            allocation = ProfitShareAllocation(
                period_id=period.id,
                partner_id=partner.id,
                partner_name=partner.name,
                ownership_pct=partner.ownership_pct,
                earnings_inr=earnings,
                payout_status=ProfitSharePayoutStatus.pending,
            )
            self._session.add(allocation)
        await self._session.flush()

        allocations = await self._repo.list_allocations_for_period(period.id)
        await self._audit.log(
            action=AuditAction.profit_share_finalized,
            actor_user_id=actor_user_id,
            resource_type="profit_share_period",
            resource_id=str(period.id),
            metadata={
                "period": f"{year}-{month:02d}",
                "profit_inr": _money(profit),
                "partners": len(partners),
            },
        )
        return {
            "id": period.id,
            "period_year": period.period_year,
            "period_month": period.period_month,
            "revenue_inr": _money(period.revenue_inr),
            "expenses_inr": _money(period.expenses_inr),
            "profit_inr": _money(period.profit_inr),
            "status": period.status.value,
            "finalized_at": period.finalized_at.isoformat() if period.finalized_at else None,
            "allocations": [await self._serialize_allocation(a) for a in allocations],
        }

    async def mark_payout_paid(
        self,
        allocation_id: UUID,
        *,
        payment_reference: str,
        actor_user_id: UUID,
    ) -> dict:
        row = await self._repo.get_allocation(allocation_id)
        if not row:
            raise NotFoundError("Allocation not found")
        if row.payout_status == ProfitSharePayoutStatus.paid:
            raise ConflictError("Payout already marked as paid")
        row.payout_status = ProfitSharePayoutStatus.paid
        row.paid_at = datetime.now(UTC)
        row.payment_reference = payment_reference.strip()
        row.paid_by = actor_user_id
        await self._session.flush()
        await self._audit.log(
            action=AuditAction.profit_share_payout_released,
            actor_user_id=actor_user_id,
            resource_type="profit_share_allocation",
            resource_id=str(row.id),
            metadata={"payment_reference": row.payment_reference, "amount_inr": _money(row.earnings_inr)},
        )
        return await self._serialize_allocation(row)

    async def pending_payouts(self) -> list[dict]:
        rows = await self._repo.pending_allocations()
        return [await self._serialize_allocation(r) for r in rows]

    async def payout_history(self, *, limit: int = 50) -> list[dict]:
        rows = await self._repo.payout_history(limit=limit)
        return [await self._serialize_allocation(r) for r in rows]

    async def partner_summary(self, user_id: UUID) -> dict:
        partner = await self._repo.get_partner_by_user_id(user_id)
        if not partner:
            return {
                "partner_id": None,
                "partner_name": None,
                "ownership_pct": None,
                "pending_earnings_inr": _money(Decimal("0")),
                "paid_earnings_inr": _money(Decimal("0")),
                "pending_allocations": [],
                "payout_history": [],
            }
        pending_total, paid_total = await self._repo.partner_earnings_totals(partner.id)
        pending = await self._repo.pending_allocations(partner_id=partner.id)
        history = await self._repo.payout_history(limit=50, partner_id=partner.id)
        return {
            "partner_id": partner.id,
            "partner_name": partner.name,
            "ownership_pct": _pct(partner.ownership_pct),
            "pending_earnings_inr": _money(pending_total),
            "paid_earnings_inr": _money(paid_total),
            "pending_allocations": [await self._serialize_allocation(a) for a in pending],
            "payout_history": [await self._serialize_allocation(a) for a in history],
        }
